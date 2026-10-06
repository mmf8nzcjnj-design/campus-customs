"""SQLite access for Campus Customs.

The database and product images live in ../data. We layer two JSON files
over the catalogue rows at read time, without ever modifying the .db:
  - catalogue_overrides.json: real description/colors/tags for the few rows
    that shipped as "Vision blocked" filename stubs.
  - taglines.json: the catchy one-line card copy (Problem 3).
"""
from __future__ import annotations

import json
import sqlite3
from datetime import date, timedelta
from pathlib import Path
from typing import Any

DATA_DIR = (Path(__file__).resolve().parent.parent / "data").resolve()
DB_PATH = DATA_DIR / "campus_customs.db"
PRODUCTS_DIR = DATA_DIR / "products"
OVERRIDES_PATH = DATA_DIR / "catalogue_overrides.json"
TAGLINES_PATH = DATA_DIR / "taglines.json"


def _load_json(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    data = json.loads(path.read_text())
    return {k: v for k, v in data.items() if not k.startswith("_")}


_OVERRIDES = _load_json(OVERRIDES_PATH)
_TAGLINES = _load_json(TAGLINES_PATH)


# garment_type has 22 spellings for 6 real categories (harness.md, quirk 1).
# Checked in order, so "crew-neck t-shirt" lands in T-Shirts and
# "hooded sweatshirt" lands in Hoodies.
CATEGORY_RULES = [
    ("t-shirt", "T-Shirts"),
    ("hood", "Hoodies"),
    ("quarter-zip", "Quarter-Zips"),
    ("jacket", "Jackets & Fleece"),
    ("performance", "Long Sleeve"),
    ("neck", "Crewnecks"),
]
CATEGORIES = [name for _, name in CATEGORY_RULES]
SIZE_ORDER = {s: i for i, s in enumerate(["XS", "S", "M", "L", "XL", "XXL"])}

# `colors` lists the garment color first, then the print colors ("navy blue",
# "white" = a navy hoodie with white lettering; checked on all 102 rows).
# Each product is one colorway, so color is a browse filter, not a variant.
# Garment colors fold into a few families for the filter (quirk 2).
COLOR_FAMILIES = [
    ("navy", "Navy"),
    ("gray", "Gray"), ("grey", "Gray"), ("charcoal", "Gray"),
    ("cream", "Cream & White"), ("ivory", "Cream & White"), ("white", "Cream & White"),
    ("coral", "Coral"),
]


def color_family(color: str) -> str:
    c = (color or "").lower()
    for needle, family in COLOR_FAMILIES:
        if needle in c:
            return family
    return c.title()


def category_for(garment_type: str) -> str:
    g = (garment_type or "").lower()
    for needle, name in CATEGORY_RULES:
        if needle in g:
            return name
    return "Crewnecks"


# Shipping policy (yalebulldogblue.com): most orders are produced in 5-8
# business days, then ship by UPS. Domestic UPS Ground adds 1-5 business days.
PRODUCTION_DAYS = (5, 8)
UPS_TRANSIT_DAYS = (1, 5)


def _add_business_days(start: date, days: int) -> date:
    d = start
    while days > 0:
        d += timedelta(days=1)
        if d.weekday() < 5:
            days -= 1
    return d


def delivery_estimate(today: date | None = None) -> dict[str, Any]:
    today = today or date.today()
    lo = PRODUCTION_DAYS[0] + UPS_TRANSIT_DAYS[0]
    hi = PRODUCTION_DAYS[1] + UPS_TRANSIT_DAYS[1]
    earliest = _add_business_days(today, lo)
    latest = _add_business_days(today, hi)
    return {
        "business_days": [lo, hi],
        "earliest": earliest.isoformat(),
        "latest": latest.isoformat(),
        "text": (
            f"Arrives {earliest:%a, %b} {earliest.day} – {latest:%a, %b} {latest.day} "
            f"(made to order in {PRODUCTION_DAYS[0]}–{PRODUCTION_DAYS[1]} business days, "
            "then UPS to your door)"
        ),
    }


def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def _parse_json_list(value: str) -> list[str]:
    try:
        parsed = json.loads(value)
        return parsed if isinstance(parsed, list) else []
    except (json.JSONDecodeError, TypeError):
        return []


def _product_from_row(row: sqlite3.Row, inventory: list[dict[str, Any]]) -> dict[str, Any]:
    pid = row["product_id"]
    override = _OVERRIDES.get(pid, {})
    colors = override.get("colors") or _parse_json_list(row["colors"])
    tags = override.get("search_tags") or _parse_json_list(row["search_tags"])
    total_stock = sum(item["quantity"] for item in inventory)
    return {
        "product_id": pid,
        "name": row["name"],
        "garment_type": row["garment_type"],
        "category": category_for(row["garment_type"]),
        "description": override.get("description") or row["description"],
        "tagline": _TAGLINES.get(pid, ""),
        "colors": colors,
        "garment_color": colors[0] if colors else "",
        "color_family": color_family(colors[0]) if colors else "",
        "print_colors": colors[1:],
        "search_tags": tags,
        "image_url": f"/media/{row['image_file_path']}",
        "price": row["price"],
        "inventory": inventory,
        "total_stock": total_stock,
        "in_stock": total_stock > 0,
    }


def list_products() -> list[dict[str, Any]]:
    conn = get_conn()
    try:
        rows = conn.execute("SELECT * FROM catalogue ORDER BY name").fetchall()
        inv_rows = conn.execute(
            "SELECT product_id, size, quantity FROM inventory"
        ).fetchall()
    finally:
        conn.close()

    by_product: dict[str, list[dict[str, Any]]] = {}
    for r in inv_rows:
        by_product.setdefault(r["product_id"], []).append(
            {"size": r["size"], "quantity": r["quantity"]}
        )
    for items in by_product.values():
        items.sort(key=lambda i: SIZE_ORDER.get(i["size"], 99))

    return [_product_from_row(r, by_product.get(r["product_id"], [])) for r in rows]


def get_product(product_id: str) -> dict[str, Any] | None:
    conn = get_conn()
    try:
        row = conn.execute(
            "SELECT * FROM catalogue WHERE product_id = ?", (product_id,)
        ).fetchone()
        if row is None:
            return None
        inv_rows = conn.execute(
            "SELECT size, quantity FROM inventory WHERE product_id = ?",
            (product_id,),
        ).fetchall()
    finally:
        conn.close()

    inventory = sorted(
        ({"size": r["size"], "quantity": r["quantity"]} for r in inv_rows),
        key=lambda i: SIZE_ORDER.get(i["size"], 99),
    )
    product = _product_from_row(row, inventory)
    product["delivery"] = delivery_estimate()
    return product
