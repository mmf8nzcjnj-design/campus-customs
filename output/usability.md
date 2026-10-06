# Campus Customs — Usability Improvements (Problem 9)

The changes I asked for after clicking through the site myself. Each one has a two-line rationale: **why** I asked for it, and the **business** case.

---

### 1. Color selection that actually works
**Change:** The color swatches on a product page looked clickable but did nothing. Now the Products page has a working color filter (Navy · Gray · Cream & White · Coral, with counts) that combines with the category chips. On a product page, the garment color is shown as selected, and the print colors are listed separately. Tapping another swatch opens the closest matching style in that color. The chatbot's color search now matches the garment color, not the lettering.
- **Why:** Something that looks like a button but does nothing makes the whole site feel broken, and shoppers think in colors ("I want a gray one").
- **Business:** Letting people narrow 102 products to the color they want gets them to a buyable item faster. Fewer dead ends means fewer abandoned visits.

### 2. A bag icon that looks like a bag
**Change:** The trapezoid icon in the nav looked like a trash can. It's now a shopping bag with handles and a "Bag" label, with the item count in a gold badge. The same icon is on the "Add to bag" button.
- **Why:** A "dustbin" next to my purchases is confusing, and slightly alarming: it looks like it deletes things.
- **Business:** The bag is the path to revenue. If shoppers can't recognize it instantly, they don't check out.

### 3. People wearing the merch on the home page
**Change:** I replaced the single product photo in the hero with an illustration of three college students on campus, wearing a navy YALE hoodie, a gray YALE crewneck, and a white YALE BULLDOGS tee. Claude drew it as an SVG (`frontend/public/hero-students.svg`).
- **Why:** A lone hoodie on a black background is flat. People wearing the clothes together show what owning them feels like.
- **Business:** Lifestyle imagery helps shoppers picture themselves in the product and sells the "belonging" that school merch is really about. That lifts first-glance engagement.

### 4. Chatbot renamed to "Friendly Bulldog"
**Change:** "Handsome Dan" is replaced by **Friendly Bulldog** everywhere: chat header, greeting, buttons, the agent's system prompt, and the "Bulldog's pick" badge.
- **Why:** Handsome Dan is the name of Yale's real live mascot. A friendly, generic name makes clear this is a shopping helper, not the mascot itself.
- **Business:** A name that says what it does ("friendly") invites more people to try the chat. It also avoids implying an endorsement by Yale's official mascot.

### 5. A headline that makes sense
**Change:** "Big Pride, Big Yale." is now **"Wear your Bulldog pride."**
- **Why:** The old line was lifted from a section heading on the real store, and on its own it reads awkwardly (it even came through as "Pick Pride Be Gay" when I dictated it).
- **Business:** The headline is the first thing every visitor reads. One clear line about wearing your pride tells them in a second what the shop sells and why to care.

### 6. Welcome banner after logging in
**Change:** After a successful login, a banner slides in: "Welcome back, *name*, to Yale Bulldog Blue!" After sign-up it says "Welcome to the Bulldog family, *name*! Your account is ready." It links to the chatbot and fades out after 5 seconds.
- **Why:** Without feedback, a shopper can't tell whether the login worked. Greeting them by name confirms it and feels personal.
- **Business:** A warm, personal confirmation rewards creating an account. Accounts are what make saved chats, faster checkout, and repeat purchases possible.

### 7. Remember my size
**Change:** Once a shopper adds a size to the bag, that size is **pre-selected on every other product** that has it in stock, with a note ("✓ We picked L, the size in your bag"). If it's sold out on that item, the page says so and points to similar styles.
- **Why:** People wear one size. Picking it again on every product is a repeated, pointless click.
- **Business:** One less step per product means less friction toward the second and third item. That raises items per order and makes the "fewest clicks" goal real.

### 8. "Complete the look" after adding to the bag
**Change:** Adding an item opens the bag with **"Complete the look"**: up to 4 picks, in stock in the shopper's size, each with a one-tap "+ L" add. Picks are complementary layers first (hoodie → tee, long sleeve, quarter-zip), then one more of the same kind, matched on the design's theme (college, sport, family). The shop sells apparel only, so there are no caps to suggest. The picks are real catalogue items, never invented.
- **Why:** The moment right after adding something is when a shopper is most ready to buy more. Showing what goes with it saves them from searching again.
- **Business:** Cross-sell at add-to-bag is a classic way to raise average order value. With one-tap add in the size they already chose, it costs the shopper almost nothing to say yes.

---

**Also fixed while testing:** chatbot search matched letters inside words ("red" matched "embroidered"), so it could recommend items that aren't actually red. It now matches whole words only, so color and keyword answers stay honest.
