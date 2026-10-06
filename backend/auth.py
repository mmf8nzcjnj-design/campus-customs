"""Account creation, login, and session tokens for Campus Customs.

Password storage
----------------
Passwords are never stored in plain text and are never written to any log,
file, or API response. Each password is run through PBKDF2-HMAC-SHA256 with
a per-user random salt and 120,000 iterations, and only the result is kept:

    pbkdf2_sha256$<salt>$<hex digest>

This is a one-way function: the stored value cannot be turned back into the
password. 120,000 iterations matches the hashes already in the users table,
so the seed accounts keep working. Verification is constant-time.

Sessions
--------
On a successful login or sign-up we return a signed, opaque session token
(HMAC-SHA256 over the user id and an expiry, keyed by APP_SECRET). The token
carries no password. The frontend sends it as `Authorization: Bearer <token>`
and the backend re-verifies the signature on each request.
"""
from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import secrets
import sqlite3
import time
from typing import Any

from db import get_conn

PBKDF2_ALGO = "pbkdf2_sha256"
PBKDF2_ITERATIONS = 120_000
SESSION_TTL_SECONDS = 60 * 60 * 24 * 14  # 14 days

# Signing key for session tokens. Set APP_SECRET in the environment for a
# stable key across restarts; otherwise a random one is used per process.
APP_SECRET = os.environ.get("APP_SECRET") or secrets.token_hex(32)


# --- password hashing -------------------------------------------------------

def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode(), salt.encode(), PBKDF2_ITERATIONS
    ).hex()
    return f"{PBKDF2_ALGO}${salt}${digest}"


def verify_password(password: str, stored: str) -> bool:
    try:
        algo, salt, digest = stored.split("$")
    except ValueError:
        return False
    if algo != PBKDF2_ALGO:
        return False
    computed = hashlib.pbkdf2_hmac(
        "sha256", password.encode(), salt.encode(), PBKDF2_ITERATIONS
    ).hex()
    return hmac.compare_digest(computed, digest)


# --- session tokens ---------------------------------------------------------

def _b64(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode().rstrip("=")


def _b64decode(data: str) -> bytes:
    return base64.urlsafe_b64decode(data + "=" * (-len(data) % 4))


def create_token(user_id: int) -> str:
    payload = {"uid": user_id, "exp": int(time.time()) + SESSION_TTL_SECONDS}
    body = _b64(json.dumps(payload, separators=(",", ":")).encode())
    sig = _b64(hmac.new(APP_SECRET.encode(), body.encode(), hashlib.sha256).digest())
    return f"{body}.{sig}"


def verify_token(token: str) -> int | None:
    try:
        body, sig = token.split(".")
    except ValueError:
        return None
    expected = _b64(hmac.new(APP_SECRET.encode(), body.encode(), hashlib.sha256).digest())
    if not hmac.compare_digest(sig, expected):
        return None
    try:
        payload = json.loads(_b64decode(body))
    except (json.JSONDecodeError, ValueError):
        return None
    if payload.get("exp", 0) < time.time():
        return None
    return payload.get("uid")


# --- student discount (Problem 10) -------------------------------------------

STUDENT_DOMAIN = "@yale.edu"
STUDENT_DISCOUNT = 0.10


def is_student(email: str) -> bool:
    """Signed in with a password-protected @yale.edu account = verified
    student for the 10% discount. (Staff subdomains such as
    @campuscustoms.yale.edu don't count.)"""
    return (email or "").strip().lower().endswith(STUDENT_DOMAIN)


# --- user records -----------------------------------------------------------

def _public_user(row: sqlite3.Row) -> dict[str, Any]:
    """A user object safe to send to the client. Never includes the hash."""
    return {
        "id": row["id"],
        "name": row["name"],
        "first_name": row["first_name"],
        "last_name": row["last_name"],
        "email": row["email"],
        "student_discount": is_student(row["email"]),
    }


def create_account(
    first_name: str, last_name: str, email: str, password: str
) -> dict[str, Any]:
    email = email.strip().lower()
    first_name = first_name.strip()
    last_name = last_name.strip()
    full_name = f"{first_name} {last_name}".strip() or email

    conn = get_conn()
    try:
        exists = conn.execute(
            "SELECT 1 FROM users WHERE email = ?", (email,)
        ).fetchone()
        if exists:
            raise ValueError("An account with this email already exists.")
        cur = conn.execute(
            """INSERT INTO users (name, email, password_hash, first_name, last_name)
               VALUES (?, ?, ?, ?, ?)""",
            (full_name, email, hash_password(password), first_name, last_name),
        )
        conn.commit()
        row = conn.execute(
            "SELECT * FROM users WHERE id = ?", (cur.lastrowid,)
        ).fetchone()
    finally:
        conn.close()
    return _public_user(row)


def authenticate(email: str, password: str) -> dict[str, Any] | None:
    email = email.strip().lower()
    conn = get_conn()
    try:
        row = conn.execute(
            "SELECT * FROM users WHERE email = ?", (email,)
        ).fetchone()
    finally:
        conn.close()
    if row is None or not verify_password(password, row["password_hash"]):
        return None
    return _public_user(row)


def get_user(user_id: int) -> dict[str, Any] | None:
    conn = get_conn()
    try:
        row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    finally:
        conn.close()
    return _public_user(row) if row else None
