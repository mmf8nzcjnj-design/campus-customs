# AI Prompts — MGT 409 Homework 4: Campus Customs Shopping Site

Every prompt I gave the AI coding agent (Claude Code) for this homework, word for word, grouped by problem. Each problem lists the prompts I typed, then any follow-up prompts and why I needed them.

## Setup (before Problem 1)

### Prompts typed

> We are doing homework number 4, so we'll be working in the homework 4 folder.

> Here, we'll be building a React + TypeScript frontend and a Python Fast API backend. The backend will be powered by a Pydantic AI agent brain. The objective is to create a real customer website for campus customs, and it should also have a helpful chatbot. Shoppers should be able to use it like a normal e-commerce website:
>
> * Browse products
> * Create accounts
> * Chat
> * See merchandise
> * Chat and help search merchandise
> * Have recommended items with their matching searches
> * Get honest answers about the price and stock availability from a local database
>
> This is the basic idea, but we'll proceed step by step. I'll give you each step-by-step detail.

### Follow-up prompts and why I needed them

> Oh, this is the AI homework 4, not probability homework 4.

*Why:* The agent first opened the MGT 403 folder, `Probability Homework #4/`. This prompt pointed it to the MGT 409 `homework 4/` folder.

> What all have you done till now? In this particular project

*Why:* Some of the agent's replies were cut off mid-build, so I asked for a status check: what was finished, what was half-done, and what was left.

> Continue all work from the last chat that we were doing. All the instructions, same folders, same files, same workflow

*Why:* The first chat session stopped partway through the build (frontend and the Problem 5 agent were unfinished). I opened a new chat and needed the agent to pick up where it left off without losing any of the earlier instructions.

> Now give me the site link so that I can visit the site and

*Why:* By Problem 8 I wanted to open the site myself and click around, instead of only reading the agent's test results.

> whats the status of the website

*Why:* A quick check that the site was still up and working before I opened it.

## Problem 1: Vibe coder prompts

This file is the Problem 1 deliverable: every prompt I gave the AI coding agent, logged as I went.

### Prompts typed

> First of all, you have to create AI_prompt.md, and in that, you have to add all the prompts that I give you.

### Follow-up prompts and why I needed them

> This assignment has 13 problems. All problems should be added with the heading, the problem number, and the name of the problem. If I use a follow-up prompt, why did I need them

*Why:* The first version of this file listed prompts in one flat list. This prompt set the format: one section per problem.

## Problem 2: Analyze the database

### Prompts typed

> @"/Users/mamu/Downloads/data/"
> The database and understand key categories, key heads, catalogs, inventory, and users other relevant information
> Start a new file: output/harness.md. In this, you have to write down the tables and their fields, and one short line on why each field matters for the shop or the chatbot. This harness will be expanded in the later problems.

### Follow-up prompts and why I needed them

> 啊 sorry, I forgot to tell you. I gave you the database and asked you to create the output/harness file as part of problem 2: analyze the database.

*Why:* I hadn't said which problem the database prompt belonged to, so the agent filed it under Problem 1 with a made-up name. This follow-up moved it to Problem 2 and gave the real name.

## Problem 3: Build the Campus Customs website

### Prompts typed

> Problem 3: Build the campus customs website. Our frontend will be React + Yait + TypeScript, and at the top there will be a navigation bar that will have:
>
> * Home
> * Products
> * About Us
> * Login
> * Create Account
>
> Full campus custom style wording from yalebulldogblue.com for Home and About Us
>
> The products page: you have to show the product images from the catalog. Use the image paths in the database. Along with the products, you should have:
>
> * name
> * price
> * short description
>
> The description should be catchy and relevant. Make each product a single item page. That means a large image on one side and full product text on the other. Product text means the description, price, stock available, sizes, and estimated delivery time. Clicking a card on products should take the shopper there. At the bottom, add a chat interface on the site. It should be a floating chat icon, and a Yale bulldog animated avatar should be used to represent the entry point into the chat interface. You can start a simple fast API app in backend/main.py just to serve products and images, and then grow it into the agent backend in the next problem.

### Follow-up prompts and why I needed them

> Ask me clarifying questions if you have any doubt.

*Why:* Problem 3 left some details open (delivery estimates aren't in the database, and accounts and chat are only built in later problems). I wanted the agent to check with me instead of guessing.

> The website that we are creating should be very beautiful and engaging, with colors that are easy on the eye. The website should be attractive to the users at first glance. The website should have a minimum number of clicks in order to check out and create an account.

*Why:* The first prompt covered which pages to build but not how the site should look or feel. This sets the bar: polished, easy on the eyes, and as few clicks as possible to check out or sign up.

**My answers to the agent's clarifying questions:**

- Checkout: a cart plus a one-page checkout that saves orders to a new orders table. No real payment.
- Delivery estimate: follow the real site's shipping policy (5–8 business days to produce, then UPS transit).
- Login / Create Account: forms only for now. Connecting them to the database waits for the accounts problem.
- Card descriptions: Claude writes the 102 catchy lines now and saves them to a file I can edit.

## Problem 4: Create account and login

### Prompts typed

> Build a create account/login flow. In login, you can log in with your email and your password. In the create account section, you will ask for:
>
> * first name
> * last name
> * email
> * password
> * confirm password
>
> All the new accounts and password information will be saved in the `users` table. Make sure to store passwords securely. No hackers, no humans, no AI should be able to access these passwords, but me and you.
>
> The WS that you have been given already has a test email and a test password. See if that works. After this, update output/harness.md with:
>
> * how the login flow and the authorization work
> * what all information is stored
> * how passwords are protected
> * etc.

**My answers to the agent's clarifying questions:** This is Problem 4. The test password wasn't given to me, so the agent should try common test passwords against the stored hash.

### Follow-up prompts and why I needed them

_None yet._

## Problem 5: PydanticAI agent backend

### Prompts typed

> Now, problem 5: Pydantic AI agent backend.
> The chatbot should be a Pydantic AI agent behind a Fast API that should be plugged into the frontend chat widget that we have discussed in the previous prompts. Put the API app in backend/main.py. Agent should be stored as these four files.
>
> There will be two files:
>
> 1. backend/prompts/prompts.md, in which you'll get the system prompts.
> 2. backend/agent.py, in which the agent entry or wiring will be stored.
>
> 3. Backend/tools.py: tools the agent can use
> 4. Backend/model.py: the pydantic AI structure types
>
> In main.py, you have to expose the chat route so a message from the website returns a reply from the agent. Use the Portkey API key and use ChatGPT Luna, low effort.  Campus customs, voice, and safety basics into prompt/prompt.md as and when required, you can update types in models.py for chat replies or product cards.  Output/harness.md. The frontend should talk to the fast API and
>
> Make sure that the backend runs from the backend folder.

### Follow-up prompts and why I needed them

_None yet._

## Problem 6: Tools: products, info, and stock

### Prompts typed

> Great, so now we have problem 6: tools, products, info, and stock.
> Give the agent tools that will help it look up real information from campus_customers.db, information like product description, price, and stock availability by size. The agent must only use the database. You have no right to invent or hallucinate prices or quantities. If it is out of stock, you say it directly. Expand prompt/prompts.md so the agent knows how to call these tools for price and stock questions. Add or update return types in models.py. In output/harness.md, list each tool and explain which model fields you choose for lookup results and why.

**My reasoning on what the lookup results should carry:**

- A shopper asks "do you have it in M?", not "is it in stock?". So stock has to come back size by size, with sold-out sizes named. One "in stock: yes" for the whole product would let the bot say yes to a size that is gone.
- Price has to come straight from the `price` column on every result. The bot repeats what the tool returns and never does its own math or guessing.
- Search results should stay short (name, price, colors, sizes left) so a broad question like "show me hoodies" doesn't flood the bot. The long description and the exact count per size only come back when the shopper zooms in on one product.
- Every result carries the `product_id`, so the website can show the real product card with the real price and photo, and the bot can't make up a product.
- When nothing matches, the tool says so in plain words. Then the bot says it honestly instead of filling the gap.

### Follow-up prompts and why I needed them

_None yet._

## Problem 7: Chat search that updates the page

### Prompts typed

> Now, problem 7: chart search that updates the page
>
> When a customer asks the chatbot about a type of item (for example, "What hoodies do you have?"), the agent should search the catalog, and the website should dynamically show the results that match as product cards. You know what product cards include:
>
> * Name
> * Price
> * Short info
> * Most importantly, the image
>
> After the dynamic product cards are loaded, make sure the same single item page behavior that we built in problem 3 still works. Each product card, including the ones that Chat just built on the page, should still open that detail view (meaning large image and full information when clicked). Update prompts/prompts.md and output/harness.md so it can be clearly seen how the search results reach the page.

### Follow-up prompts and why I needed them

_None yet._

## Problem 8: Customer memory

### Prompts typed

> Problem 8: Customer memory
> The shopper is logged in. Save their chat history in the database in the appropriate table. Reload it when they return to that page. The agent should remember, as a tool, who is chatting: the name and email of the user. Put that in the agent's deps or as a tool that the agent can call when an old user returns. Also pass enough page context to the chatbot. For example, if a user is browsing a hoodie and the user asks, "Do you have this in black?" the agent should know which item is being referred to. Do that. Put code in the agent file. Put whatever you want, but the agent should work seamlessly.  Guests will be able to chat without logging in, but history only needs to be present for logged-in users. Document this in output/harnerst.md: how user chat history is stored, what customer fields the agency is, and how the page context is passed.

### Follow-up prompts and why I needed them

_None yet._

## Problem 9: Usability improvements

### Prompts typed

> Problem 9: Usability improvements
> The color toggle filter doesn't work.
>
> *(Attached: a screenshot of the product page's Colors row, Navy and White, with the size buttons below.)*

> The "Add to your bag" icon looks like a dustbin. Make the icon better.

> Also, the image that you have displayed on the homepage is bad. Instead of that, make the image of two to three AI-generated human-looking characters (male and female) in a group wearing Yale merchandise. should be college students. white

> The name of the chatbot should not be Handsome Dan. It should be Friendly Bulldog.

> After the login is successful, a temporary banner should be displayed: "Welcome, name, to the Yale webson," something like a welcome message and

> Now, to usability improvements if a user has selected a size once and added it to the bag, then that size should be auto-selected for the user when he looks at a different item. When one of the items is added to a cart, you should show recommended items that are more of the same kind or complementary products. For example, if a user has added a hoodie, then you can show a T-shirt or a cap to go along with it. There are two functional improvements. Log them in the prompts.

> In output/usability.md, add whatever changes I asked you to make, and give a two-line rationale on why I asked you to make these changes and why it makes business sense.

### Follow-up prompts and why I needed them

> No, I want you to create images of people wearing the merchandise.

*Why:* The agent said it couldn't generate pictures, and offered a product collage plus an image prompt for me to run myself. I wanted it to actually make the photos of students wearing the merch.

> Change the tagline. "Pick Pride Be Gay" doesn't make any sense.

*Why:* The home page headline ("Big Pride, Big Yale", which came through as "Pick Pride Be Gay" when I dictated it) was taken from the real store's section heading, but on its own it reads awkwardly. I wanted a headline that makes sense at first glance.

> Depend on portkey to make the image. Make the image in Claude and then use that image.

*Why:* I wanted the agent to produce the picture of people itself and put it on the site, instead of leaving me a placeholder and a prompt to run.

> Also, the filter to change colors is not working.

*Why:* After the first fix, the color swatches on a product page still didn't do anything when I clicked them. I expected clicking a color to change what I was looking at.

## Problem 10: Style the website

### Prompts typed

> Problem 10: Style the website.
>
> Redesign the website. Make it look like a real campus custom storefront: the font, color hierarchy, emotion, product presentation, chat field, etc. Be designed to be really imaginative and innovative. It should be a wow feeling. Add Yale building photos in the background.
>
> * Add Yale bulldog photo wherever required.
> * Add Yale vs. Harvard.
> * Add random Yale facts. Add an option to recommend what all should be added to the site in terms of merchandise and products. Mention that students get an additional 10% discount upon email ID verification. Any student who logs in via yale.edu will get an auto-applied 10% discount. Display this evidently as a banner on the front page. Write output/design.md: whatever I changed and what the business rationale behind it is, and how this will help customers have a good experience around buying the product.

### Follow-up prompts and why I needed them

> The image that you have made of people wearing Yale merchandise is very bullshit. It should look like real people. Make it as real as possible.

*Why:* The agent drew the students as a flat cartoon (SVG). For a store front page, I needed photo-real people wearing the merch.

## Problem 11: Site testing (app check)

### Prompts typed

> I am testing the live site now. In problem number 11, site testing (app check), you are supposed to document this in output/app_check.html. I will give you screenshots and short captions that you have to add to this file. The first screenshot proves the usability feature that we added. We can search in the chat and get user recommendations. The third one shows recommended features and recommended products on the basis of the last item that the user added to the bag, increasing average order value and average merchandise produced. This helps the business in selling revenue. The fourth one is a screenshot of the chat checking the inventory level. The second one is also another feature that we added. The size that user 1 selects is saved and is automatically selected when the user selects a similar product. With each screenshot, the rationale should be attached to it. Screenshot image files in output/app_check_images/ and link them from app_check.html with relative paths.
>
> *(Attached: 4 screenshots of the live site: (1) chat search for blue T-shirts putting cards on the Products page, (2) a product page with my saved size S pre-selected, (3) the bag drawer's "Complete the look" recommendations, (4) the chat answering stock by size for the Boola Boola T-shirt.)*

### Follow-up prompts and why I needed them

> This is very important, as it will affect my grade. If you have any questions, ask. Do this step very correctly.

*Why:* The app check is graded, so I wanted the agent to slow down, get every screenshot and caption right, and ask me rather than guess.

## Problem 12: Audit trail, safety, and finishing the harness

### Prompts typed

> Problem 12: Audit Trail Safety Finish Harness
>
> Append only output/audit_trial.json of agent loop activities:
>
> * time
> * tool
> * short args
> * result
> * stop reason
> * processing time
> * number of token use
>
> Do not wipe it between runs.
>
> Some of the safety rules that I am giving you, log them in prompt/prompt.md.
>
> Do not rely on sources other than what you have been given. Do not try to break into any website or cross any firewalls. Keep user data confidential. Create output/harness.md. In that, you have to explain:
>
> * the rationale
> * how the system works
> * why model fields and models.py were chosen
> * why these tools and abilities were given
> * why the safety rules are made this way
> * what the specs, the loop limits, result caps, and models are
> * how to run front and back

### Follow-up prompts and why I needed them

_None yet._

## Problem 13: Push to GitHub and submit the URL

### Prompts typed

> Now, problem 13: push to GitHub and submit the URL.
> Now, after you have made all the changes and completed all the tasks given above, push the website to a public GitHub repository and give me the URL. Do not put real ENV, campus, customs, DB, or product images in the GitHub repo. Use gitignore.

**My answers to the agent's questions:** push to a new public repo, `campus-customs` (only this project, so none of my other class folders can leak in). Leave `output/audit_trail.json` out of the repo, because it holds the chat messages I typed while testing. Problem 1 is called "Vibe coder prompts".

### Follow-up prompts and why I needed them

> There should be a README.md file in the Git repo which would explain how to run the frontend and backend after placing the data pack.

*Why:* The database and product images are kept out of the public repo, so anyone cloning it (like my grader) needs clear steps: where to put the data pack, then how to start the backend and the frontend.
