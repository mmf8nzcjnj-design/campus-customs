# Campus Customs — Design (Problem 10)

What changed in the redesign, the business reason for each change, and how it makes buying easier and more enjoyable for the customer.

**Design goal:** make it feel like walking onto Old Campus in your favorite sweatshirt. Proud, warm, a little playful, and unmistakably Yale. Every decorative choice also has to move the shopper toward a product.

---

## 1. Typography

| Role | Font | Where |
|---|---|---|
| Display | **Fraunces** (serif, with gold *italic* accents) | Headlines: "Wear your *Bulldog* pride." |
| Varsity labels | **Graduate** (collegiate block letters) | Kickers, "YALE vs HARVARD", stats, footer headings, "Ask me" |
| Text | **Inter** | Body copy, prices, forms, chat |

- **Business:** a serif plus a varsity face says "heritage university" in one glance, and that heritage is what licensed merch sells. The clean sans keeps prices and sizes easy to read.
- **Customer:** headlines feel special, and product facts stay readable. The type itself tells you which is which.

## 2. Color hierarchy

**Yale Blue leads, Bulldog Gold means "act", Crimson appears only for the rival.**

- **Yale Blue** (`#00356b`) and a deep navy carry the brand: nav, hero overlay, ticker, chat header, footer.
- **Bulldog Gold** (`#f2c14e`) is kept for *actions and rewards*: "Shop the collection", the 10% badge, the chat button, student prices.
- **Crimson** shows up only in the Yale vs. Harvard section. The rivalry gets its own color, and nowhere else.
- A warm paper background (`#f7f4ee`) instead of stark white is easy on the eyes and makes the white product photos pop.
- **Business:** when gold always means "click here", the eye is trained to find the next step, which lifts click-through on calls to action.
- **Customer:** less hunting. The important thing on every screen is the gold thing.

## 3. Emotion and campus photos

- **Hero:** a full-width photo of **Old Campus and Harkness Tower**, with a slow "breathing" zoom under a navy overlay. On top: "Wear your *Bulldog* pride." and three floating product cards you can click straight into.
- **Products page:** a banner over **Old Campus and Durfee Hall**. **About Us:** **Harkness Tower in fall**.
- **Business:** licensed apparel is an emotional purchase, about belonging and nostalgia. Campus imagery sells the feeling the product delivers, which supports full-price buying.
- **Customer:** alumni and parents get an instant "I'm back on campus" moment, and students see their own campus.
- *Note:* photos are openly licensed from Wikimedia Commons and credited in the footer. A photo of real students wearing our products is still to come: the hero automatically shows `public/hero-students.jpg` once that photo exists.

## 4. Student 10% discount, front and center

- A **gold banner** right below the hero, with a wobbling "10% OFF" seal: *"Sign in with your @yale.edu email. Save 10% on everything."* It includes a one-click "Create student account" button.
- An **announcement bar** on every page repeats the offer. Once a @yale.edu student signs in, it changes to *"Student pricing on"*, and the home banner turns green: *"You're in!"*
- **How it works:** signing in with a password-protected **@yale.edu** account is the verification. The 10% is **applied automatically on the server at checkout** (it can't be faked from the browser). It shows as a line in the bag and at checkout, and signed-in students see a struck-through price plus their student price on every product card. Tested: $136.00 order → **$13.60 off → $122.40** for a @yale.edu account, and no discount for other emails.
- **Business:** students are the core, repeat audience. An automatic discount converts them, and requiring an account grows a list of verified students we can bring back. Making it "evident" removes the "is there a student code?" exit.
- **Customer:** no codes and no hunting. Sign in once, and every price you see is already your price.

## 5. Yale vs. Harvard: "The Game"

- A full-bleed section over a photo of a **packed Yale Bowl at The Game**, split diagonally **Yale Blue | Harvard Crimson**. "YALE *vs* HARVARD" is set in varsity letters.
- Three rivalry milestones (1875 first game · 1914 Yale Bowl opens · 2004 the famous "We Suck" prank), then **game-day gear** right beside them: the 2025 Yale vs Harvard tee, football tees, and the gameday hood. "Shop game-day gear" links to the products.
- **Business:** The Game is the biggest seasonal sales moment in Yale merch. A dedicated, always-on section captures that demand, and it's the obvious place for limited game-day drops.
- **Customer:** fans get the rivalry fun, and the right shirt for Saturday is one click away.

## 6. Handsome Dan, the real bulldog

- **"Meet the mascot":** a large photo of **Handsome Dan** in his blue Y bandana, with the story (America's first live college mascot, 1889).
- His photo is also the **face of the chatbot**: the gold "Ask me" chat button, the chat header, and a small avatar beside every reply, which pulses while he "thinks". The chatbot is named **Friendly Bulldog**, "in his spirit".
- **Business:** a mascot face makes the assistant approachable, so more people try the chat. Chat users reach matching products in one message instead of several filter clicks (see Problem 7).
- **Customer:** talking to a bulldog in a Y bandana is friendlier than talking to a form.

## 7. Random Yale facts

- A **scrolling ticker** in Yale Blue between sections ("Yale was founded in 1701…"). It pauses on hover.
- A **"Did you know?" card** with a 🎲 *Another Yale fact* button, which shows a random fact each time (12 facts: Harkness carillon, Boola Boola, the Whiffenpoofs, the Frisbie pie tins, and more).
- **Business:** content that's fun to click keeps people on the page longer, and pride in the place drives buying the merch.
- **Customer:** a small moment of delight, and something to share.

## 8. "What should we make next?": shoppers recommend merchandise

- On the home page, shoppers can **suggest a product** (an idea plus a type: hats, drinkware, accessories, kids, pets, dorm & home…) and **upvote** others on a live "Most wanted" board. Duplicate ideas count as votes. Ideas are stored in a new `product_suggestions` table.
- The chatbot points people there when they ask for something we don't carry ("caps?").
- **Business:** free, ranked demand data. We make what people have already asked for, before investing in inventory. It also turns a "no" ("we don't sell caps") into engagement.
- **Customer:** they feel heard, and get a reason to come back and see if their idea was made.

## 9. Product presentation

- **Category tiles** became big image cards with a navy caption that slides on hover ("27 styles →").
- **Product cards:** rounded, with a lift on hover, category label, catchy tagline, and a clear price. There's a gold "Student" tag when the discount applies, and "Few left" / "Sold out" pills.
- **Product page:** the student price sits next to the list price (or a nudge to sign up). The garment-color swatch and the sizes show live stock, the shopper's size is pre-selected (Problem 9), and the delivery estimate is shown.
- **Business:** clear price + scarcity + savings at the point of decision is the classic combination for conversion.
- **Customer:** everything needed to decide is in one place: what it looks like, what it costs *for me*, and whether my size is there.

## 10. The chat field

- A **gold pill "Ask me" button** with Handsome Dan's photo and a soft halo pulse. It's easy to find without blocking content.
- The panel has a **navy header with a gold rule**, a green "online" dot, and "history saved" for signed-in shoppers. Dan's avatar appears beside each reply. There are **rounded pill input** and **gold send** buttons, and starter chips ("What hoodies do you have?", "Gift ideas for my dad").
- **Business:** the chat is a sales channel (search → cards on the page → add to bag). Making it inviting raises the share of visitors who use it.
- **Customer:** it reads like texting a friend who works at the shop, and the answers are always real prices and stock.

## 11. Footer and trust

- A deep-navy footer with Shop / Help / Visit columns (shipping, returns, the student deal, 57 Broadway address, phone, email) and the motto line *"Lux et Veritas, and a really good hoodie."*
- **Photo credits** for every Wikimedia image, with licenses, as the licenses require.
- **Business:** a visible address, phone number and policies reduce purchase anxiety, which matters for made-to-order items.
- **Customer:** answers to "when will it arrive?" and "can I return it?" are always one glance away.

---

### Accessibility and performance notes
- Everything animated respects **reduced-motion** settings (animations switch off).
- Photos are compressed to ≤ 1920 px (about 0.3–0.9 MB). Product images lazy-load.
- Layouts fold down for tablets and phones. On small screens the hero cards hide, so the headline and calls to action come first.
