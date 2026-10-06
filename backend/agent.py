"""PydanticAI agent for the Campus Customs chatbot (Problems 5-8, 12).

Model: gpt-5.6-luna via Portkey (OpenAI Responses API), low reasoning
effort. System prompt: prompts/prompt.md. Tools: tools.TOOLS, which only
read campus_customs.db, plus two memory tools defined here. Output:
models.AgentReply (reply text, product ids, page-results flag).

Customer memory (Problem 8) also lives here:
  build_shopper()     deps for one run: who is chatting + which page they're on
  who_is_chatting     tool: name, email, member-since for a signed-in shopper
  current_page        tool: the page and the product the shopper is looking at
  load_history()      saved chat_messages rows for a signed-in shopper
  save_turn()         write one user/assistant pair to chat_messages

Audit trail (Problem 12): every run appends one entry to
output/audit_trail.json (time, each tool call with short args, short result
and its own processing time, stop reason, total processing time, token use).
The file is append-only and is never wiped between runs.
"""
from __future__ import annotations

import contextvars
import functools
import inspect
import json
import os
import re
import threading
import time
from datetime import datetime, timezone
from functools import lru_cache
from pathlib import Path

os.environ.setdefault("PYDANTIC_AI_NO_BANNER", "1")

from openai import AsyncOpenAI
from pydantic_ai import Agent, RunContext
from pydantic_ai.messages import (
    ModelMessage,
    ModelRequest,
    ModelResponse,
    TextPart,
    ToolCallPart,
    UserPromptPart,
)
from pydantic_ai.models.openai import OpenAIResponsesModel, OpenAIResponsesModelSettings
from pydantic_ai.providers.openai import OpenAIProvider
from pydantic_ai.exceptions import UsageLimitExceeded
from pydantic_ai.messages import ToolReturnPart
from pydantic_ai.usage import UsageLimits

import db
from models import (
    AgentReply,
    ChatTurn,
    CurrentPage,
    PageContext,
    ProductCard,
    ShopperContext,
    ShopperProfile,
)
from tools import TOOLS, get_product_details

HERE = Path(__file__).resolve().parent
PROMPT_PATH = HERE / "prompts" / "prompt.md"
PORTKEY_BASE_URL = "https://api.portkey.ai/v1"
HISTORY_TURNS = 12  # earlier messages the model sees, so follow-ups make sense
AUDIT_PATH = HERE.parent / "output" / "audit_trail.json"

# Loop limits for one chat message. A normal answer needs 2-4 model requests
# (search -> maybe details -> answer); these caps stop a runaway tool loop.
LOOP_LIMITS = UsageLimits(request_limit=8, tool_calls_limit=10, total_tokens_limit=60_000)

_audit_lock = threading.Lock()
# Per-run list of {"tool", "ms"} filled by the timed tool wrappers below.
_tool_timings: contextvars.ContextVar[list[dict] | None] = contextvars.ContextVar("tool_timings", default=None)


def _timed(fn):
    """Wrap a tool so its processing time lands in the audit trail. The
    wrapper keeps the original signature and docstring, so the model sees
    the same tool."""
    if inspect.iscoroutinefunction(fn):
        @functools.wraps(fn)
        async def awrapper(*args, **kwargs):
            start = time.perf_counter()
            try:
                return await fn(*args, **kwargs)
            finally:
                _record(fn.__name__, start)
        return awrapper

    @functools.wraps(fn)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        try:
            return fn(*args, **kwargs)
        finally:
            _record(fn.__name__, start)
    return wrapper


def _record(name: str, start: float) -> None:
    timings = _tool_timings.get()
    if timings is not None:
        timings.append({"tool": name, "ms": round((time.perf_counter() - start) * 1000, 1)})


@lru_cache(maxsize=1)
def get_agent() -> Agent[ShopperContext, AgentReply]:
    key = os.getenv("PORTKEY_API_KEY")
    if not key:
        raise RuntimeError("PORTKEY_API_KEY is not set.")
    client = AsyncOpenAI(
        api_key=key,
        base_url=os.getenv("PORTKEY_BASE_URL", PORTKEY_BASE_URL),
        default_headers={"x-portkey-api-key": key},
    )
    # The Responses endpoint: chat/completions refuses tools + reasoning_effort
    # for this model.
    model = OpenAIResponsesModel(
        os.getenv("PORTKEY_MODEL", "gpt-5.6-luna"),
        provider=OpenAIProvider(openai_client=client),
    )
    agent = Agent(
        model,
        deps_type=ShopperContext,
        output_type=AgentReply,
        instructions=PROMPT_PATH.read_text(encoding="utf-8"),
        tools=[_timed(t) for t in TOOLS],
        end_strategy="early",
        model_settings=OpenAIResponsesModelSettings(openai_reasoning_effort="low"),
        retries=2,
    )

    @agent.instructions
    def shopper_and_page(ctx: RunContext[ShopperContext]) -> str:
        """Per-run context appended to the system prompt."""
        d = ctx.deps
        if d.signed_in:
            who = (
                f"The shopper is signed in as {d.full_name} ({d.email}). "
                f"Call them {d.first_name}."
            )
            if d.saved_messages:
                who += " They are a returning customer; earlier chat is in the history."
            if d.student_discount:
                who += " They signed in with a @yale.edu email, so 10% comes off automatically at checkout."
        else:
            who = "The shopper is a guest (not signed in)."
        return f"{who}\n{describe_page(d.page)}"

    @agent.tool
    @_timed
    def who_is_chatting(ctx: RunContext[ShopperContext]) -> ShopperProfile:
        """Who is chatting: first name, full name, email, member-since date, and
        whether they have chatted before. Call when the shopper asks "do you
        remember me?", "what's my email?", or anything about their account."""
        d = ctx.deps
        if not d.signed_in:
            return ShopperProfile(
                signed_in=False,
                note="Guest. You don't know their name or email; they can sign in to be remembered.",
            )
        return ShopperProfile(
            signed_in=True,
            first_name=d.first_name,
            full_name=d.full_name,
            email=d.email,
            member_since=d.member_since,
            student_discount=d.student_discount,
            returning_customer=d.saved_messages > 0,
            saved_messages=d.saved_messages,
        )

    @agent.tool
    @_timed
    def current_page(ctx: RunContext[ShopperContext]) -> CurrentPage:
        """The page the shopper is on right now, with full product details
        (price, colors, stock by size) when it is a product page. Call this
        when they say "this", "it", or "this one" and the chat hasn't named
        a product."""
        page = ctx.deps.page
        product = get_product_details(page.product_id) if page.product_id else None
        return CurrentPage(
            page_type=page.page_type,
            path=page.path,
            product=product,
            selected_size=page.selected_size,
            category_filter=page.category_filter,
            color_filter=page.color_filter,
            search_text=page.search_text,
            results_title=page.results_title,
        )

    return agent


# --- page context ----------------------------------------------------------

def describe_page(page: PageContext) -> str:
    """One or two sentences about the shopper's page, for the instructions."""
    if page.page_type == "product" and page.product_id:
        product = db.get_product(page.product_id)
        if product:
            text = (
                f"The shopper is on the product page for **{product['name']}** "
                f"(product_id: {product['product_id']}). \"This\", \"it\" and "
                "\"this one\" mean this product unless the chat clearly names another."
            )
            if page.selected_size:
                text += f" They have size {page.selected_size} selected."
            return text
    parts = {
        "home": "The shopper is on the home page.",
        "products": "The shopper is browsing the Products page.",
        "about": "The shopper is reading the About Us page.",
        "checkout": "The shopper is on the checkout page.",
        "login": "The shopper is on the login page.",
        "signup": "The shopper is on the create-account page.",
    }
    text = parts.get(page.page_type, f"The shopper is on {page.path}.")
    if page.category_filter:
        text += f" Category filter: {page.category_filter}."
    if page.color_filter:
        text += f" Color filter: {page.color_filter}."
    if page.search_text:
        text += f" Search box: \"{page.search_text}\"."
    if page.results_title:
        text += f" The page is showing your earlier results: \"{page.results_title}\"."
    return text


# --- who is chatting --------------------------------------------------------

def build_shopper(user: dict | None, page: PageContext | None) -> ShopperContext:
    """Deps for one run. `user` is the signed-in user from auth (or None)."""
    page = page or PageContext()
    if user is None:
        return ShopperContext(page=page)
    conn = db.get_conn()
    try:
        row = conn.execute(
            "SELECT created_at FROM users WHERE id = ?", (user["id"],)
        ).fetchone()
        saved = conn.execute(
            "SELECT COUNT(*) FROM chat_messages WHERE user_id = ?", (user["id"],)
        ).fetchone()[0]
    finally:
        conn.close()
    return ShopperContext(
        signed_in=True,
        user_id=user["id"],
        first_name=user.get("first_name") or user["name"].split(" ")[0],
        full_name=user["name"],
        email=user["email"],
        member_since=(row["created_at"] or "")[:10] if row else None,
        student_discount=bool(user.get("student_discount")),
        saved_messages=saved,
        page=page,
    )


# --- saved chat (chat_messages table) ---------------------------------------

def _product_ids(products_json: str | None) -> list[str]:
    """products_json holds a list of product objects (the seed rows use full
    catalogue rows, ours use ProductCard). Only the ids are trusted: cards
    are rebuilt from the live database so reloaded prices and stock are current."""
    try:
        items = json.loads(products_json or "[]")
    except json.JSONDecodeError:
        return []
    return [i["product_id"] for i in items if isinstance(i, dict) and "product_id" in i]


def load_history(user_id: int, card_for, limit: int = 200) -> list[dict]:
    """Saved turns for one shopper, oldest first, with product cards rebuilt."""
    conn = db.get_conn()
    try:
        rows = conn.execute(
            """SELECT * FROM (
                   SELECT id, role, content, products_json, created_at
                   FROM chat_messages WHERE user_id = ? ORDER BY id DESC LIMIT ?
               ) ORDER BY id""",
            (user_id, limit),
        ).fetchall()
    finally:
        conn.close()
    messages = []
    for r in rows:
        cards = []
        for pid in _product_ids(r["products_json"]):
            product = db.get_product(pid)
            if product:
                cards.append(card_for(product))
        messages.append(
            {"id": r["id"], "role": r["role"], "content": r["content"],
             "products": cards, "created_at": r["created_at"]}
        )
    return messages


def saved_turns(user_id: int) -> list[ChatTurn]:
    """The last HISTORY_TURNS saved messages, as model memory."""
    rows = load_history(user_id, card_for=lambda p: p, limit=HISTORY_TURNS)
    return [ChatTurn(role=r["role"], content=r["content"]) for r in rows]


def save_turn(user_id: int, message: str, reply: str, cards: list[ProductCard]) -> None:
    conn = db.get_conn()
    try:
        conn.execute(
            "INSERT INTO chat_messages (user_id, role, content) VALUES (?, 'user', ?)",
            (user_id, message),
        )
        conn.execute(
            """INSERT INTO chat_messages (user_id, role, content, products_json)
               VALUES (?, 'assistant', ?, ?)""",
            (user_id, reply, json.dumps([c.model_dump() for c in cards]) if cards else None),
        )
        conn.commit()
    finally:
        conn.close()


def clear_history(user_id: int) -> None:
    conn = db.get_conn()
    try:
        conn.execute("DELETE FROM chat_messages WHERE user_id = ?", (user_id,))
        conn.commit()
    finally:
        conn.close()


# --- running the agent ------------------------------------------------------

def history_to_messages(history: list[ChatTurn]) -> list[ModelMessage]:
    """Earlier widget turns -> PydanticAI message history."""
    messages: list[ModelMessage] = []
    for turn in history:
        if turn.role == "user":
            messages.append(ModelRequest(parts=[UserPromptPart(content=turn.content)]))
        else:
            messages.append(ModelResponse(parts=[TextPart(content=turn.content)]))
    return messages


# --- audit trail (Problem 12) ----------------------------------------------

_EMAIL = re.compile(r"[\w.+-]+@[\w-]+(\.[\w-]+)+")


def _short(value, limit: int = 240) -> str:
    """Compact, privacy-safe text for the audit log: emails are masked, long
    values are cut."""
    if hasattr(value, "model_dump"):
        value = value.model_dump(exclude_defaults=True)
    text = value if isinstance(value, str) else json.dumps(value, ensure_ascii=False, default=str)
    text = _EMAIL.sub("[email]", text)
    return text if len(text) <= limit else text[: limit - 1] + "…"


def _append_audit(entry: dict) -> None:
    """Append one entry. Never truncates: if the file is unreadable it is set
    aside as audit_trail.corrupt-<time>.json and a new list is started."""
    AUDIT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with _audit_lock:
        rows: list = []
        if AUDIT_PATH.exists():
            try:
                rows = json.loads(AUDIT_PATH.read_text(encoding="utf-8") or "[]")
                if not isinstance(rows, list):
                    raise ValueError("audit trail is not a JSON list")
            except (json.JSONDecodeError, ValueError):
                stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
                AUDIT_PATH.rename(AUDIT_PATH.with_name(f"audit_trail.corrupt-{stamp}.json"))
                rows = []
        rows.append(entry)
        tmp = AUDIT_PATH.with_suffix(".json.tmp")
        tmp.write_text(json.dumps(rows, indent=2, ensure_ascii=False), encoding="utf-8")
        tmp.replace(AUDIT_PATH)  # atomic swap: a crash mid-write can't wipe the log


def _steps(new_messages: list[ModelMessage], timings: list[dict]) -> list[dict]:
    """One audit step per tool call: tool, short args, short result, ms."""
    queues: dict[str, list[float]] = {}
    for t in timings:
        queues.setdefault(t["tool"], []).append(t["ms"])
    steps: dict[str, dict] = {}
    for msg in new_messages:
        for part in msg.parts:
            if isinstance(part, ToolCallPart) and not part.tool_name.startswith("final_result"):
                q = queues.get(part.tool_name) or []
                steps[part.tool_call_id] = {
                    "tool": part.tool_name,
                    "args": _short(part.args_as_dict(), 160),
                    "result": None,
                    "ms": q.pop(0) if q else None,
                }
            elif isinstance(part, ToolReturnPart) and part.tool_call_id in steps:
                steps[part.tool_call_id]["result"] = _short(part.content)
    return list(steps.values())


def _tokens(usage) -> dict:
    inp = getattr(usage, "input_tokens", 0) or 0
    out = getattr(usage, "output_tokens", 0) or 0
    return {"input": inp, "output": out, "total": inp + out}


# --- run ---------------------------------------------------------------------

LOOP_LIMIT_REPLY = (
    "Sorry, that one took me too many steps to look up. Could you narrow it down "
    "a little, for example by category, color, or size?"
)


async def run_agent(
    message: str, history: list[ChatTurn], shopper: ShopperContext
) -> tuple[AgentReply, list[str]]:
    """Answer one chat message. Returns the agent's reply and the tools it used.
    Every run, including failures, is appended to the audit trail."""
    timings: list[dict] = []
    token = _tool_timings.set(timings)
    started = time.perf_counter()
    entry: dict = {
        "time": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "model": os.getenv("PORTKEY_MODEL", "gpt-5.6-luna"),
        "user_id": shopper.user_id,  # an id only, never name or email
        "page": shopper.page.product_id or shopper.page.page_type,
        "message": _short(message, 200),
    }
    try:
        result = await get_agent().run(
            message,
            message_history=history_to_messages(history),
            deps=shopper,
            usage_limits=LOOP_LIMITS,
        )
    except UsageLimitExceeded as exc:
        entry.update(
            steps=_steps([], timings),
            stop_reason=f"loop limit: {exc}",
            reply=_short(LOOP_LIMIT_REPLY, 200),
            processing_ms=round((time.perf_counter() - started) * 1000),
            tokens=None,
        )
        _append_audit(entry)
        return AgentReply(reply=LOOP_LIMIT_REPLY), [t["tool"] for t in timings]
    except Exception as exc:
        entry.update(
            steps=_steps([], timings),
            stop_reason=f"error: {type(exc).__name__}: {_short(str(exc), 200)}",
            processing_ms=round((time.perf_counter() - started) * 1000),
            tokens=None,
        )
        _append_audit(entry)
        raise
    finally:
        _tool_timings.reset(token)

    new = result.new_messages()
    usage = result.usage() if callable(result.usage) else result.usage
    last = next((m for m in reversed(new) if isinstance(m, ModelResponse)), None)
    steps = _steps(new, timings)
    entry.update(
        steps=steps,
        stop_reason=f"final answer ({getattr(last, 'finish_reason', None) or 'stop'})",
        reply=_short(result.output.reply, 200),
        products=result.output.product_ids,
        show_on_page=result.output.show_on_page,
        processing_ms=round((time.perf_counter() - started) * 1000),
        model_requests=getattr(usage, "requests", None),
        tokens=_tokens(usage),
    )
    _append_audit(entry)
    tools_used = list(dict.fromkeys(st["tool"] for st in steps))
    return result.output, tools_used
