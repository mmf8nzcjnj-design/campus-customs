"""Pydantic types for the Campus Customs chatbot (Problems 5-8).

Chat contract (Problem 5): ChatRequest / ChatResponse are the /api/chat
contract with the frontend. AgentReply is the structured output the agent
must return. ProductCard is what the chat widget renders under a reply.
Cards are built from the database in main.py, never from model text, so
prices and stock shown to shoppers are always the real numbers.

Tool results (Problem 6): every tool in tools.py returns one of the models
below, filled only from campus_customs.db.

Customer memory (Problem 8): PageContext is what the website says about the
page the shopper is on. ShopperContext (the agent's deps) carries who is
chatting and that page. ShopperProfile / CurrentPage are what the agent's
memory tools return. ChatHistory is saved chat reloaded for signed-in shoppers.
"""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class ChatTurn(BaseModel):
    """One earlier message, sent back by the widget so follow-ups make sense."""

    role: Literal["user", "assistant"]
    content: str


class PageContext(BaseModel):
    """Where the shopper is on the website when they send a message."""

    path: str = "/"
    page_type: Literal[
        "home", "products", "product", "about", "login", "signup", "checkout", "other"
    ] = "other"
    product_id: str | None = Field(None, description="Set on a product page.")
    selected_size: str | None = Field(None, description="Size picked on the product page, if any.")
    category_filter: str | None = Field(None, description="Category chip selected on Products.")
    color_filter: str | None = Field(None, description="Color swatch selected on Products.")
    search_text: str | None = Field(None, description="Text in the Products search box.")
    results_title: str | None = Field(None, description="Chat results currently shown on the page.")


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    # Guests send their own recent turns. For signed-in shoppers the server
    # ignores this and uses the history saved in chat_messages instead.
    history: list[ChatTurn] = Field(default_factory=list)
    page: PageContext | None = None


LOW_STOCK_AT = 5  # 5 or fewer units left in a size counts as "low_stock"


class SizeStock(BaseModel):
    """Stock for one size, straight from the inventory table."""

    size: str
    quantity: int
    status: Literal["in_stock", "low_stock", "sold_out"]

    @classmethod
    def from_row(cls, size: str, quantity: int) -> "SizeStock":
        if quantity <= 0:
            status = "sold_out"
        elif quantity <= LOW_STOCK_AT:
            status = "low_stock"
        else:
            status = "in_stock"
        return cls(size=size, quantity=quantity, status=status)


# --- tool results (Problem 6) -----------------------------------------------

class ProductSummary(BaseModel):
    """One search hit. Short on purpose so a broad search stays readable."""

    product_id: str
    name: str
    category: str
    price: float = Field(description="USD, from catalogue.price. Quote exactly.")
    colors: list[str] = Field(description="Garment color first, then print colors.")
    tagline: str
    sizes_in_stock: list[str]
    sold_out_sizes: list[str]
    total_stock: int
    stock_status: Literal["in_stock", "partly_sold_out", "sold_out"]


class SearchResult(BaseModel):
    """What search_products returns."""

    total_matches: int
    products: list[ProductSummary]
    exact_match: bool = Field(
        True, description="False when no product matched every word and these are only close matches."
    )
    sold_out_in_size: list[ProductSummary] = Field(
        default_factory=list,
        description="Products that match the search but are sold out in the requested size.",
    )
    notes: list[str] = Field(default_factory=list)


class ProductDetails(BaseModel):
    """What get_product_details returns: one product, in full."""

    found: bool = True
    product_id: str = ""
    name: str = ""
    category: str = ""
    garment_type: str = ""
    description: str = ""
    price: float | None = None
    colors: list[str] = Field(default_factory=list)
    stock_by_size: list[SizeStock] = Field(default_factory=list)
    total_stock: int = 0
    stock_status: Literal["in_stock", "partly_sold_out", "sold_out", "unknown"] = "unknown"
    delivery_estimate: str = ""
    page_url: str = ""
    did_you_mean: list[ProductSummary] = Field(default_factory=list)
    notes: list[str] = Field(default_factory=list)


class StockCheck(BaseModel):
    """What check_stock returns: a straight answer for one product in one size."""

    found: bool = True
    product_id: str = ""
    name: str = ""
    price: float | None = None
    size: str = ""
    size_offered: bool = False
    quantity: int = 0
    status: Literal["in_stock", "low_stock", "sold_out", "not_offered", "unknown"] = "unknown"
    other_sizes_in_stock: list[str] = Field(default_factory=list)
    notes: list[str] = Field(default_factory=list)


class SimilarResult(BaseModel):
    """What recommend_similar returns."""

    found: bool = True
    based_on: str = ""
    products: list[ProductSummary] = Field(default_factory=list)
    notes: list[str] = Field(default_factory=list)


# --- chat contract (Problem 5) ----------------------------------------------


class ProductCard(BaseModel):
    product_id: str
    name: str
    price: float
    image_url: str
    tagline: str = ""
    category: str = ""
    total_stock: int = 0
    sizes_in_stock: list[str] = Field(default_factory=list)


class AgentReply(BaseModel):
    """What the agent returns at the end of every run."""

    reply: str = Field(
        description="The message to the shopper, in Markdown. Short and friendly."
    )
    product_ids: list[str] = Field(
        default_factory=list,
        description=(
            "product_id values (from tool results) of the products the reply "
            "talks about or recommends, best first. At most 6. Empty if none."
        ),
    )
    show_on_page: bool = Field(
        False,
        description=(
            "True when the shopper is browsing a kind of item (\"what hoodies do you "
            "have?\", \"show me Davenport gear\"). The website then shows every match "
            "from your search_products calls as product cards on the page."
        ),
    )
    page_title: str = Field(
        "",
        description="Short heading for those page results, e.g. \"Hoodies\" or \"Navy gear under $60\".",
    )


class PageResults(BaseModel):
    """Search results the website lays out on the page (Problem 7)."""

    title: str
    query: str
    products: list[ProductCard]


class ChatResponse(BaseModel):
    role: Literal["assistant"] = "assistant"
    content: str
    products: list[ProductCard] = Field(default_factory=list)
    page_results: PageResults | None = None
    tools_used: list[str] = Field(default_factory=list)


class HistoryMessage(BaseModel):
    """One saved chat turn, as the widget reloads it."""

    id: int
    role: Literal["user", "assistant"]
    content: str
    products: list[ProductCard] = Field(default_factory=list)
    created_at: str


class ChatHistory(BaseModel):
    messages: list[HistoryMessage]


class ShopperContext(BaseModel):
    """The agent's deps for one run: who is chatting, where they are, and
    what search_products found.

    search_products appends every product id it matched (not just the few it
    shows the model) to `search_hits`, so main.py can put the full result
    set on the page without the model having to list 27 ids itself.
    """

    signed_in: bool = False
    user_id: int | None = None
    first_name: str | None = None
    full_name: str | None = None
    email: str | None = None
    member_since: str | None = None
    student_discount: bool = False  # signed in with @yale.edu: 10% off at checkout
    saved_messages: int = 0  # chat turns already in the database before this one
    page: PageContext = Field(default_factory=PageContext)
    search_hits: list[str] = Field(default_factory=list)


class ShopperProfile(BaseModel):
    """What the who_is_chatting tool returns."""

    signed_in: bool
    first_name: str | None = None
    full_name: str | None = None
    email: str | None = None
    member_since: str | None = None
    student_discount: bool = False
    returning_customer: bool = False
    saved_messages: int = 0
    note: str = ""


class CurrentPage(BaseModel):
    """What the current_page tool returns: the page, plus the product on it."""

    page_type: str
    path: str
    product: "ProductDetails | None" = None
    selected_size: str | None = None
    category_filter: str | None = None
    color_filter: str | None = None
    search_text: str | None = None
    results_title: str | None = None
