# Campus Customs: Yale Bulldog Blue storefront + Friendly Bulldog chatbot

MGT 409 Homework 4. A real shopping site for Campus Customs' officially licensed Yale apparel, with a PydanticAI shopping assistant that answers **only from the store's database**.

**Stack:** React + Vite + TypeScript (frontend) · FastAPI (backend) · PydanticAI agent on `gpt-5.6-luna` via Portkey · SQLite

## What it does
- **Shop:** home, products (category + color filters, search), single-item pages with live stock per size and delivery estimate, bag, one-page checkout.
- **Accounts:** sign up / log in (PBKDF2-hashed passwords, signed tokens). **Yale students get 10% off automatically** when signed in with an `@yale.edu` email (applied on the server).
- **Friendly Bulldog chatbot:** searches the catalogue, quotes real prices and per-size stock, puts search results on the page as product cards, remembers signed-in shoppers, and understands "this one" from the page you're on.
- **Usability:** remembers your size, "Complete the look" recommendations after adding to the bag, a welcome banner after login, and shopper "What should we make next?" suggestions with voting.
- **Safety and audit:** strict source, privacy and anti-hacking rules in the prompt. Loop limits, and an append-only audit trail of every agent run.

## Run it (after placing the data pack)

You need **Python 3.13**, **Node.js 20+**, and a **Portkey API key** for the chatbot.

### 1. Place the data pack
The Campus Customs database and product images are not in this repo. Unzip the course data pack (`data.zip`) and copy its contents into `data/`, so you end up with:

```
data/
├── campus_customs.db          ← from the data pack
├── products/                  ← from the data pack (102 .jpg images)
│   ├── basic-hoodie-big-yale.jpg
│   └── …
├── catalogue_overrides.json   (already in the repo)
└── taglines.json              (already in the repo)
```

```bash
# example, if the pack was unzipped to ~/Downloads/data
cp ~/Downloads/data/campus_customs.db data/
cp -R ~/Downloads/data/products data/
```

### 2. Add your keys
```bash
cp .env.example .env
# open .env and set:
#   PORTKEY_API_KEY=<your Portkey key>
#   APP_SECRET=<any long random string>   (signs login tokens)
```

### 3. Start the backend (terminal 1)
```bash
cd backend
python3 -m venv .venv
.venv/bin/pip install -r ../requirements.txt
.venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000
```
Check it: http://127.0.0.1:8000/api/health → `{"status":"ok"}` · API docs at http://127.0.0.1:8000/docs.
On first start the backend adds its own tables (`orders`, `product_suggestions`) to the database.

### 4. Start the frontend (terminal 2)
```bash
cd frontend
npm install
npm run dev
```
Open **http://127.0.0.1:5173**. Vite forwards `/api` and `/media` (product images) to the backend on port 8000, so keep both terminals running.

### Troubleshooting
| Symptom | Fix |
|---|---|
| Products page empty or "Couldn't load products" | Is the backend running on port 8000? Is `data/campus_customs.db` in place? |
| Product cards have no pictures | `data/products/` is missing or empty. Copy the images from the data pack. |
| Chat says "assistant is unavailable" | `PORTKEY_API_KEY` is missing or wrong in `.env`. Restart the backend after fixing it. |
| Port already in use | Stop the other app using 8000 or 5173, then start again. |

## Where things are
| Path | What |
|---|---|
| `backend/main.py` | FastAPI routes: products, auth, checkout, chat, history, suggestions |
| `backend/agent.py` | Agent wiring, memory and page context, loop limits, audit trail |
| `backend/tools.py` | Database tools: search, details, stock check, similar items |
| `backend/models.py` | Pydantic types for tool results, the chat contract, and deps |
| `backend/prompts/prompt.md` | System prompt: voice, honesty rules, tool guide, safety rules |
| `frontend/src/` | React app (pages, components, chat widget, styles) |
| `output/harness.md` | Full harness: rationale, architecture, model and tool choices, safety, limits, how to run |
| `output/usability.md` · `output/design.md` · `output/app_check.html` (+ `app_check_images/`) | Problems 9, 10 and 11 write-ups |
| `output/audit_trail.json` | Append-only log of agent runs (Problem 12) |
| `requirements.txt` · `.env.example` | Python dependencies · environment template |
| `AI_prompts.md` | Every prompt given to the AI coding agent, by problem |

## Not in this repo (on purpose)
The real `.env`, the Campus Customs database, and the product images. See `.gitignore`. The committed `output/audit_trail.json` comes from demo chats, and new runs keep appending to it.

Campus photos: Wikimedia Commons, credited in the site footer and in `frontend/src/yale.ts`.
