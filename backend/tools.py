"""Tools the Campus Customs chatbot can call (Problems 5-6).

Every tool reads the live SQLite catalogue (campus_customs.db) through db.py
and returns a typed model from models.py. The agent has no other source of
facts, so every price and stock number it quotes comes from the database.

  search_products     find merchandise by words, category, color, size, price
  get_product_details full facts for one product: description, price, stock by size, delivery
  check_stock         a straight yes/no for one product in one size
  recommend_similar   "you might also like" picks for a product
"""
from __future__ import annotations

import re
from typing import Any

from pydantic_ai import RunContext

import db
from models import (
    ProductDetails,
    ProductSummary,
    SearchResult,
    SimilarResult,
    ShopperContext,
    SizeStock,
    StockCheck,
)

MAX_RESULTS = 12

# Shopper words -> the words the catalogue actually uses (harness.md quirks 1, 2, 4).
SYNONYMS = {
    "tee": "t-shirt", "tees": "t-shirt", "tshirt": "t-shirt", "tshirts": "t-shirt",
    "shirt": "t-shirt", "shirts": "t-shirt",
    "hoody": "hoodie", "hoodies": "hoodie", "hood": "hoodie",
    "sweatshirts": "sweatshirt", "crew": "crewneck", "crewnecks": "crewneck",
    "quarterzip": "quarter-zip", "1/4": "quarter-zip", "zip-up": "zip",
    "grey": "gray", "fleeces": "fleece", "jackets": "jacket",
    "mum": "mom", "mother": "mom", "father": "dad", "grandmother": "grandma",
    "grandfather": "grandpa", "bulldogs": "bulldog", "dog": "bulldog",
}

STOPWORDS = {
    "a", "an", "and", "any", "anything", "are", "do", "does", "for", "from", "have",
    "i", "in", "is", "it", "looking", "me", "my", "of", "on", "or", "please",
    "show", "some", "something", "that", "the", "to", "want", "with", "you",
    "your", "got", "need", "find", "items", "item", "merch", "merchandise",
    "clothes", "stuff", "gift", "cheap", "under", "size",
}

CATEGORY_ALIASES = {
    "t-shirt": "T-Shirts", "tee": "T-Shirts", "shirt": "T-Shirts",
    "hood": "Hoodies", "quarter": "Quarter-Zips", "1/4": "Quarter-Zips",
    "jacket": "Jackets & Fleece", "fleece": "Jackets & Fleece",
    "long": "Long Sleeve", "performance": "Long Sleeve",
    "crew": "Crewnecks", "sweatshirt": "Crewnecks", "mock": "Crewnecks",
}


def _normalize(text: str) -> str:
    text = text.lower()
    text = re.sub(r"\b1[ /]4[ -]?zip\b", "quarter-zip", text)
    text = re.sub(r"\bquarter[ ]zip\b", "quarter-zip", text)
    text = text.replace("navy blue", "navy")
    return text


def _haystack(p: dict[str, Any]) -> str:
    parts = [p["name"], p["garment_type"], p["category"], p["description"],
             " ".join(p["colors"]), " ".join(p["search_tags"])]
    return _normalize(" ".join(parts))


def _query_words(query: str) -> list[str]:
    words = []
    for raw in re.findall(r"[a-z0-9/'&-]+", _normalize(query)):
        word = SYNONYMS.get(raw, raw)
        if word not in STOPWORDS and len(word) > 1:
            words.append(word)
    return words


def _word_in(word: str, hay: str) -> bool:
    """Word match from the start of a word: "red" must not hit "embroidered",
    but "hood" still hits "hoodie" and "college" hits "colleges"."""
    def starts_a_word(w: str) -> bool:
        return re.search(r"(?<![a-z0-9])" + re.escape(w), hay) is not None
    if starts_a_word(word):
        return True
    return len(word) > 3 and word.endswith("s") and starts_a_word(word[:-1])


def _match_category(category: str) -> str | None:
    c = category.strip().lower()
    for name in db.CATEGORIES:
        if c == name.lower():
            return name
    for alias, name in CATEGORY_ALIASES.items():
        if alias in c:
            return name
    return None


VALID_SIZES = ["XS", "S", "M", "L", "XL", "XXL"]


def _stock_status(p: dict[str, Any]) -> str:
    if p["total_stock"] == 0:
        return "sold_out"
    if any(i["quantity"] == 0 for i in p["inventory"]):
        return "partly_sold_out"
    return "in_stock"


def _summary(p: dict[str, Any]) -> ProductSummary:
    """Compact product facts for the model: enough to answer, not a wall of text."""
    return ProductSummary(
        product_id=p["product_id"],
        name=p["name"],
        category=p["category"],
        price=p["price"],
        colors=p["colors"],
        tagline=p["tagline"],
        sizes_in_stock=[i["size"] for i in p["inventory"] if i["quantity"] > 0],
        sold_out_sizes=[i["size"] for i in p["inventory"] if i["quantity"] == 0],
        total_stock=p["total_stock"],
        stock_status=_stock_status(p),
    )


def _closest(text: str, n: int = 3) -> list[ProductSummary]:
    return find_products(text.replace("-", " "))[0][:n]


def search_products(
    ctx: RunContext[ShopperContext],
    query: str = "",
    category: str | None = None,
    color: str | None = None,
    size: str | None = None,
    max_price: float | None = None,
    min_price: float | None = None,
    limit: int = 8,
) -> SearchResult:
    """Search the Campus Customs catalogue. Start here for any "do you have...",
    "show me...", or "how much are..." question.

    Args:
        query: Shopper words to match against product name, description, colors,
            and tags, e.g. "bulldog", "hockey", "Davenport", "dad", "vintage".
            Every word must match. Leave empty to browse by the filters only.
        category: One of "T-Shirts", "Hoodies", "Crewnecks", "Quarter-Zips",
            "Jackets & Fleece", "Long Sleeve".
        color: The garment's main color: "navy", "gray", "cream", "white" or
            "coral" (every product is one of these). Print colors like red
            lettering are matched by putting the word in `query` instead.
        size: XS, S, M, L, XL or XXL. Products with stock in this size come back
            in `products`; matching products sold out in it come back in
            `sold_out_in_size`.
        max_price: Highest price in USD.
        min_price: Lowest price in USD.
        limit: Max products to return (1-12). `total_matches` is the full count.
    """
    matches, sold_out_in_size, exact, notes = find_products(
        query, category, color, size, max_price, min_price
    )
    limit = max(1, min(int(limit), MAX_RESULTS))
    # Remember every match (not just the first `limit`) for the page (Problem 7).
    # Close-but-not-exact matches only count as far as the model saw them.
    for p in matches if exact else matches[:limit]:
        if p.product_id not in ctx.deps.search_hits:
            ctx.deps.search_hits.append(p.product_id)
    return SearchResult(
        total_matches=len(matches),
        products=matches[:limit],
        exact_match=exact,
        sold_out_in_size=sold_out_in_size[:limit],
        notes=notes,
    )


def find_products(
    query: str = "",
    category: str | None = None,
    color: str | None = None,
    size: str | None = None,
    max_price: float | None = None,
    min_price: float | None = None,
) -> tuple[list[ProductSummary], list[ProductSummary], bool, list[str]]:
    """The search itself: (matches, sold_out_in_size, exact_match, notes).
    Matches are best first. Shared by the search_products tool and _closest."""
    products = db.list_products()
    words = _query_words(query)
    notes: list[str] = []

    if category:
        cat = _match_category(category)
        if cat:
            products = [p for p in products if p["category"] == cat]
        else:
            notes.append(f"Unknown category '{category}'. Categories: {', '.join(db.CATEGORIES)}.")
    if color:
        # Match the garment's own color (colors[0]), not the print: "navy
        # hoodies" must not return gray hoodies with navy lettering.
        want = SYNONYMS.get(color.lower(), _normalize(color)).strip()
        products = [p for p in products
                    if want in _normalize(p["garment_color"]) or want in p["color_family"].lower()]
    if max_price is not None:
        products = [p for p in products if p["price"] <= max_price]
    if min_price is not None:
        products = [p for p in products if p["price"] >= min_price]

    exact = True
    if words:
        scored = []
        for p in products:
            hits = sum(_word_in(w, _haystack(p)) for w in words)
            name_hits = sum(_word_in(w, _normalize(p["name"])) for w in words)
            scored.append((hits, name_hits, p))
        chosen = [x for x in scored if x[0] == len(words)]
        if not chosen:
            # Nothing matches every word: offer the closest items, flagged.
            chosen = [x for x in scored if x[0] > 0]
            exact = not chosen
        chosen.sort(key=lambda x: (-x[0], -x[1], -x[2]["total_stock"]))
        products = [x[2] for x in chosen]

    # Size is applied last, so a product that exists but is sold out in that
    # size is reported as sold out, not silently dropped as "not found".
    sold_out: list[dict[str, Any]] = []
    if size:
        s = size.strip().upper()
        has = [p for p in products if any(i["size"] == s and i["quantity"] > 0 for i in p["inventory"])]
        sold_out = [p for p in products if p not in has]
        products = has
        if sold_out:
            notes.append(
                f"{len(sold_out)} matching product(s) are sold out in size {s}; see sold_out_in_size. "
                "Tell the shopper they exist but that size is sold out."
            )

    if not exact:
        notes.append("No product matched every word; these are only the closest matches. Say so.")
    if not products and not sold_out:
        notes.append("Nothing in the catalogue matches. Tell the shopper honestly; do not suggest it exists.")
    return [_summary(p) for p in products], [_summary(p) for p in sold_out], exact, notes


def get_product_details(product_id: str) -> ProductDetails:
    """Full facts for one product: description, price, colors, the exact stock
    count for every size, and the delivery estimate. Call this before quoting
    exact quantities or when the shopper asks about one specific product.

    Args:
        product_id: The product_id from a search result, e.g. "basic-hoodie-big-yale".
    """
    product = db.get_product(product_id.strip())
    if product is None:
        return ProductDetails(
            found=False,
            notes=[f"No product with id '{product_id}'. Do not guess its price or stock."],
            did_you_mean=_closest(product_id),
        )
    s = _summary(product)
    return ProductDetails(
        product_id=s.product_id,
        name=s.name,
        category=s.category,
        garment_type=product["garment_type"],
        description=product["description"],
        price=s.price,
        colors=s.colors,
        stock_by_size=[SizeStock.from_row(i["size"], i["quantity"]) for i in product["inventory"]],
        total_stock=s.total_stock,
        stock_status=s.stock_status,
        delivery_estimate=product["delivery"]["text"],
        page_url=f"/products/{s.product_id}",
    )


def check_stock(product_id: str, size: str) -> StockCheck:
    """Is this product available in this size right now? Returns the live count
    and, if it is sold out, which sizes are still available.

    Args:
        product_id: The product_id from a search result.
        size: XS, S, M, L, XL or XXL (words like "medium" or "extra large" are fine).
    """
    words = {"extra small": "XS", "small": "S", "medium": "M", "large": "L",
             "extra large": "XL", "xxl": "XXL", "2xl": "XXL", "double xl": "XXL"}
    want = words.get(size.strip().lower(), size.strip().upper())
    product = db.get_product(product_id.strip())
    if product is None:
        return StockCheck(
            found=False, size=want,
            notes=[f"No product with id '{product_id}'. Search first; do not guess."],
        )
    row = next((i for i in product["inventory"] if i["size"] == want), None)
    others = [i["size"] for i in product["inventory"] if i["quantity"] > 0 and i["size"] != want]
    base = dict(product_id=product["product_id"], name=product["name"],
                price=product["price"], size=want, other_sizes_in_stock=others)
    if row is None:
        return StockCheck(
            **base, size_offered=False, status="not_offered",
            notes=[f"This product only comes in {', '.join(VALID_SIZES)}."],
        )
    stock = SizeStock.from_row(row["size"], row["quantity"])
    return StockCheck(**base, size_offered=True, quantity=stock.quantity, status=stock.status)


def recommend_similar(product_id: str, limit: int = 4) -> SimilarResult:
    """Products similar to one the shopper likes (shared theme, tags, category),
    in stock only. Use for "what else goes with this?", "something like X", or
    to offer an alternative when the shopper's pick is sold out.

    Args:
        product_id: The product to find matches for.
        limit: How many to suggest (1-6).
    """
    products = db.list_products()
    base = next((p for p in products if p["product_id"] == product_id), None)
    if base is None:
        return SimilarResult(found=False, notes=[f"No product with id '{product_id}'."])

    base_tags = set(base["search_tags"])
    base_words = set(_query_words(base["name"])) - {"yale", "t-shirt", "hoodie", "crewneck"}
    scored = []
    for p in products:
        if p["product_id"] == product_id:
            continue
        score = 2 * len(base_tags & set(p["search_tags"]))
        score += 3 * len(base_words & set(_query_words(p["name"])))
        score += 1 if p["category"] == base["category"] else 0
        if score and p["in_stock"]:
            scored.append((score, p["total_stock"], p))
    scored.sort(key=lambda x: (-x[0], -x[1]))
    limit = max(1, min(int(limit), 6))
    return SimilarResult(based_on=base["name"], products=[_summary(x[2]) for x in scored[:limit]])


TOOLS = [search_products, get_product_details, check_stock, recommend_similar]
