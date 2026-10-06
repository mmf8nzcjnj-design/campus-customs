"""Campus Customs backend (Problems 3-8).

Serves the product catalogue and images, handles account creation and login,
records orders at checkout, and exposes /api/chat, which answers through the
PydanticAI agent in agent.py.

Run from this folder:  uvicorn main:app --port 8000
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Annotated

from dotenv import load_dotenv

# Keys live in "homework 4/.env" (or backend/.env). Load before importing
# auth, which reads APP_SECRET at import time.
HERE = Path(__file__).resolve().parent
load_dotenv(HERE / ".env")
load_dotenv(HERE.parent / ".env")

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr, Field

import auth  # noqa: E402
import db  # noqa: E402
import agent  # noqa: E402
from models import ChatHistory, ChatRequest, ChatResponse, PageResults, ProductCard  # noqa: E402

app = FastAPI(title="Campus Customs API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve product images at /media/products/<file>.jpg
app.mount("/media", StaticFiles(directory=str(db.DATA_DIR)), name="media")


def _ensure_orders_table() -> None:
    conn = db.get_conn()
    try:
        conn.execute(
            """CREATE TABLE IF NOT EXISTS orders (
                   id INTEGER PRIMARY KEY AUTOINCREMENT,
                   user_id INTEGER,
                   items_json TEXT NOT NULL,
                   subtotal REAL NOT NULL,
                   contact_name TEXT NOT NULL,
                   email TEXT NOT NULL,
                   address TEXT NOT NULL,
                   created_at TEXT NOT NULL DEFAULT (datetime('now')),
                   FOREIGN KEY (user_id) REFERENCES users(id)
               )"""
        )
        # Problem 10: student discount columns (added to existing tables too).
        cols = {r["name"] for r in conn.execute("PRAGMA table_info(orders)")}
        if "discount" not in cols:
            conn.execute("ALTER TABLE orders ADD COLUMN discount REAL NOT NULL DEFAULT 0")
        if "total" not in cols:
            conn.execute("ALTER TABLE orders ADD COLUMN total REAL")
        # Problem 10: shoppers suggest merchandise we should add.
        conn.execute(
            """CREATE TABLE IF NOT EXISTS product_suggestions (
                   id INTEGER PRIMARY KEY AUTOINCREMENT,
                   idea TEXT NOT NULL,
                   category TEXT NOT NULL DEFAULT 'Other',
                   votes INTEGER NOT NULL DEFAULT 1,
                   user_id INTEGER,
                   created_at TEXT NOT NULL DEFAULT (datetime('now')),
                   FOREIGN KEY (user_id) REFERENCES users(id)
               )"""
        )
        conn.commit()
    finally:
        conn.close()


_ensure_orders_table()


# --- schemas ----------------------------------------------------------------

class SignupRequest(BaseModel):
    first_name: str = Field(min_length=1)
    last_name: str = Field(min_length=1)
    email: EmailStr
    password: str = Field(min_length=8)
    confirm_password: str

    def passwords_match(self) -> bool:
        return self.password == self.confirm_password


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class OrderItem(BaseModel):
    product_id: str
    size: str
    quantity: int = Field(ge=1)


class SuggestionRequest(BaseModel):
    idea: str = Field(min_length=3, max_length=120)
    category: str = Field("Other", max_length=40)


class CheckoutRequest(BaseModel):
    items: list[OrderItem] = Field(min_length=1)
    contact_name: str = Field(min_length=1)
    email: EmailStr
    address: str = Field(min_length=1)


# --- auth dependency --------------------------------------------------------

def current_user_optional(
    authorization: Annotated[str | None, Header()] = None,
) -> dict | None:
    if not authorization or not authorization.lower().startswith("bearer "):
        return None
    uid = auth.verify_token(authorization.split(" ", 1)[1])
    return auth.get_user(uid) if uid else None


# --- products ---------------------------------------------------------------

@app.get("/api/products")
def get_products():
    return db.list_products()


@app.get("/api/products/{product_id}")
def get_product(product_id: str):
    product = db.get_product(product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


# --- accounts ---------------------------------------------------------------

@app.post("/api/auth/signup")
def signup(req: SignupRequest):
    if not req.passwords_match():
        raise HTTPException(status_code=400, detail="Passwords do not match.")
    try:
        user = auth.create_account(
            req.first_name, req.last_name, req.email, req.password
        )
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    return {"user": user, "token": auth.create_token(user["id"])}


@app.post("/api/auth/login")
def login(req: LoginRequest):
    user = auth.authenticate(req.email, req.password)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    return {"user": user, "token": auth.create_token(user["id"])}


@app.get("/api/auth/me")
def me(user: Annotated[dict | None, Depends(current_user_optional)]):
    if user is None:
        raise HTTPException(status_code=401, detail="Not signed in.")
    return {"user": user}


# --- checkout ---------------------------------------------------------------

@app.post("/api/checkout")
def checkout(
    req: CheckoutRequest,
    user: Annotated[dict | None, Depends(current_user_optional)],
):
    subtotal = 0.0
    detailed = []
    for item in req.items:
        product = db.get_product(item.product_id)
        if product is None:
            raise HTTPException(status_code=400, detail=f"Unknown product {item.product_id}")
        subtotal += product["price"] * item.quantity
        detailed.append(
            {
                "product_id": item.product_id,
                "name": product["name"],
                "size": item.size,
                "quantity": item.quantity,
                "price": product["price"],
            }
        )

    # Problem 10: signed-in @yale.edu students get 10% off, applied here on
    # the server so it can't be faked from the browser.
    subtotal = round(subtotal, 2)
    student = bool(user and user.get("student_discount"))
    discount = round(subtotal * auth.STUDENT_DISCOUNT, 2) if student else 0.0
    total = round(subtotal - discount, 2)

    conn = db.get_conn()
    try:
        cur = conn.execute(
            """INSERT INTO orders
               (user_id, items_json, subtotal, contact_name, email, address, discount, total)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                user["id"] if user else None,
                json.dumps(detailed),
                subtotal,
                req.contact_name,
                req.email.lower(),
                req.address,
                discount,
                total,
            ),
        )
        conn.commit()
        order_id = cur.lastrowid
    finally:
        conn.close()

    return {
        "order_id": order_id,
        "items": detailed,
        "subtotal": subtotal,
        "discount": discount,
        "total": total,
        "confirmation": f"CC-{order_id:05d}",
    }


# --- product suggestions (Problem 10) ---------------------------------------

def _top_suggestions(conn, limit: int = 8) -> list[dict]:
    rows = conn.execute(
        "SELECT id, idea, category, votes FROM product_suggestions ORDER BY votes DESC, id DESC LIMIT ?",
        (limit,),
    ).fetchall()
    return [dict(r) for r in rows]


@app.get("/api/suggestions")
def list_suggestions():
    conn = db.get_conn()
    try:
        return {"suggestions": _top_suggestions(conn)}
    finally:
        conn.close()


@app.post("/api/suggestions")
def add_suggestion(
    req: SuggestionRequest,
    user: Annotated[dict | None, Depends(current_user_optional)],
):
    """A shopper's idea for new merch. The same idea twice counts as a vote."""
    idea = " ".join(req.idea.split())
    conn = db.get_conn()
    try:
        same = conn.execute(
            "SELECT id FROM product_suggestions WHERE lower(idea) = lower(?)", (idea,)
        ).fetchone()
        if same:
            conn.execute("UPDATE product_suggestions SET votes = votes + 1 WHERE id = ?", (same["id"],))
        else:
            conn.execute(
                "INSERT INTO product_suggestions (idea, category, user_id) VALUES (?, ?, ?)",
                (idea, req.category.strip() or "Other", user["id"] if user else None),
            )
        conn.commit()
        return {"suggestions": _top_suggestions(conn)}
    finally:
        conn.close()


@app.post("/api/suggestions/{suggestion_id}/vote")
def vote_suggestion(suggestion_id: int):
    conn = db.get_conn()
    try:
        cur = conn.execute(
            "UPDATE product_suggestions SET votes = votes + 1 WHERE id = ?", (suggestion_id,)
        )
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Suggestion not found")
        conn.commit()
        return {"suggestions": _top_suggestions(conn)}
    finally:
        conn.close()


# --- chat (Problem 5) -------------------------------------------------------

def _card(product: dict) -> ProductCard:
    return ProductCard(
        product_id=product["product_id"],
        name=product["name"],
        price=product["price"],
        image_url=product["image_url"],
        tagline=product["tagline"],
        category=product["category"],
        total_stock=product["total_stock"],
        sizes_in_stock=[i["size"] for i in product["inventory"] if i["quantity"] > 0],
    )


@app.post("/api/chat", response_model=ChatResponse, response_model_exclude_none=True)
async def chat(
    req: ChatRequest,
    user: Annotated[dict | None, Depends(current_user_optional)],
):
    # Problem 8: deps carry who is chatting and which page they're on.
    shopper = agent.build_shopper(user, req.page)
    # Signed-in shoppers: memory comes from the database. Guests: from the widget.
    history = (
        agent.saved_turns(user["id"]) if user else req.history[-agent.HISTORY_TURNS:]
    )
    try:
        reply, tools_used = await agent.run_agent(req.message, history, shopper)
    except Exception as exc:  # model/network failure: say so, don't crash the widget
        print(f"[chat] agent error: {type(exc).__name__}: {exc}")
        raise HTTPException(
            status_code=502,
            detail="The shopping assistant is unavailable right now. Please try again in a moment.",
        )

    # Cards come from the database by id, so the price and stock shown are real.
    # Ids the model made up simply don't resolve and are dropped.
    by_id = {p["product_id"]: p for p in db.list_products()}
    cards = [_card(by_id[pid]) for pid in dict.fromkeys(reply.product_ids) if pid in by_id][:6]

    # Problem 7: when the shopper is browsing a kind of item, every product
    # search_products matched (recorded in shopper.search_hits) goes on the page.
    page = None
    if reply.show_on_page:
        ids = shopper.search_hits or reply.product_ids
        page_cards = [_card(by_id[pid]) for pid in dict.fromkeys(ids) if pid in by_id]
        if page_cards:
            page = PageResults(
                title=reply.page_title or "Results from Friendly Bulldog",
                query=req.message,
                products=page_cards,
            )

    if user:
        agent.save_turn(user["id"], req.message, reply.reply, cards)
    return ChatResponse(
        content=reply.reply, products=cards, page_results=page, tools_used=tools_used
    )


@app.get("/api/chat/history", response_model=ChatHistory)
def chat_history(user: Annotated[dict | None, Depends(current_user_optional)]):
    """Saved chat for the signed-in shopper, reloaded when they come back."""
    if user is None:
        raise HTTPException(status_code=401, detail="Sign in to see saved chats.")
    return {"messages": agent.load_history(user["id"], _card)}


@app.delete("/api/chat/history", status_code=204)
def clear_chat_history(user: Annotated[dict | None, Depends(current_user_optional)]):
    if user is None:
        raise HTTPException(status_code=401, detail="Sign in first.")
    agent.clear_history(user["id"])


@app.get("/api/health")
def health():
    return {"status": "ok"}
