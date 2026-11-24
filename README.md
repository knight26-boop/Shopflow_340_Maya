# ShopFlow Website (CISS 340 project)

> **DRAFT OUTLINE.** The headings and facts below are a starting point. Replace every
> [bracketed prompt] with your own words before you submit. Delete this note when done.

## Purpose

[In your own words: what this site is for and how it relates to the notebook.]

All data is realistic, **instructor-provided fictional data**. There are no real customers, orders or contact details.

## Data flow

Browser → Netlify page → Netlify Function/API → Aiven MySQL → JSON → Browser

[Explain each step in your own words, and why the browser never connects to MySQL directly.]

## Database

Seven tables in the `shopflow` database (MySQL 8.4):

| Table | One row represents |
|---|---|
| customers | one customer |
| products | one sellable product |
| orders | one order |
| order_items | one product line on one order |
| reviews | one customer review of one product (loaded from `product_reviews.csv`) |
| abandoned_carts | one cart that was not completed |
| support_tickets | one support case (its order reference may be NULL) |

Relationships (parent 1 : many child):

- customers → orders
- orders → order_items
- products → order_items
- products → reviews
- customers → reviews
- customers → abandoned_carts
- customers → support_tickets
- orders → support_tickets (optional)

[Add your ERD image and one or two sentences on your schema choices.]

## Cleaning and validation (from the notebook)

[Write 3 to 5 of the most important decisions in your own words, for example how text NULLs, phone
formats, dates, emails and Boolean text were handled, the parent-first load, and the control total.
Do not include any connection details.]

## Selected views and how they were verified

Revenue everywhere means: Delivered orders only, `quantity * unit_price` at the order-item grain.

| Website view | Function / query type | Notebook equivalent | Website result | Notebook result | Match? |
|---|---|---|---|---|---|
| Products catalog | `products` | active-products count | [fill in] | [fill in] | [ ] |
| Top Products | `analytics?query=top-products` | Question 2 | [fill in] | [fill in] | [ ] |
| Customer Segments | `analytics?query=segments` | Question 1 | [fill in] | [fill in] | [ ] |
| Revenue Analysis | `analytics?query=revenue` | category totals | [fill in] | [fill in] | [ ] |
| Order Status | `analytics?query=orders` | Question 7 | [fill in] | [fill in] | [ ] |

[Note any difference in what a column means, for example which customers a count includes.]

## Database roles

[Explain in your own words: `avnadmin` is used only for setup, schema changes, loading and creating the
reader; `shopflow_reader` has SELECT access only and is the only account the website uses.]

## Setup and testing (placeholders only)

1. Install Node.js (version 22.13 or newer) and run `npm install`.
2. Copy `.env.example` to `.env` and replace the placeholders with your own values. Never commit `.env`.
3. Run `npm run dev`, then open `http://localhost:8888`.
4. Test a function directly in the browser, for example `/.netlify/functions/products`.
5. Deploy from GitHub to Netlify, add the six environment variables
   (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_CA_CERT`), and redeploy.

[Describe the states you tested: loading, success, empty result, and error or invalid request.]

## Notebook versus website

The executed Google Colab notebook is the complete analytics deliverable (10 SQL queries and 5
interactive charts). This website shows selected views only.
