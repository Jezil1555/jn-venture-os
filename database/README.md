# JN Venture OS

Internal operations platform for a holding company: manage portfolio
companies, control which investors can see which company, and track each
investor's stake. This is a real, running application — not a mockup — and
everything described below has been tested against an actual Postgres
database before being handed to you.

## What's built (Session 1)

- **Auth** — JWT login, bcrypt password hashing, no public self-signup
  (admins create accounts).
- **Roles** — `admin` (holding company operator, full access) and
  `investor` (scoped access).
- **Companies** — admins can create, edit, and delete companies.
- **Investor visibility** — an investor only ever sees companies they're
  explicitly linked to, along with their ownership % and capital committed
  for each. This is enforced server-side, not just hidden in the UI: an
  investor requesting a company they aren't linked to gets a 404, not a
  list they have to filter.
- **Dashboard** — role-aware overview and a companies list/detail view,
  including an admin screen for linking investors to a company and setting
  their stake.
- **Account management** — admins can create new admin/investor accounts
  from the Users page (no database access needed), and anyone can change
  their own password from their Account page.
- **Sales** — admins can log dated sales entries per company with a running
  total; investors linked to that company can view (not edit) the same
  list.
- **Currency per company** — each company is priced in USD, INR, or QAR;
  every dollar figure on that company's pages formats in its own currency.
- **Returns received** — admin-only ledger of money the holding company
  gets back from a portfolio company. Never shown to investors directly.
- **Distributions** — admin records money actually paid out to a specific
  investor; each investor sees only their own payouts, never another
  investor's.
- **Investor financial view** — for each company they hold, an investor
  sees their capital committed, a returns %, what they've received so far,
  and what's still pending (computed from returns received × their
  ownership %, minus what's already been distributed to them).
- **Admin dashboard totals** — the Overview page and each company's page
  show total sales, total invested, and total returns received per
  company — visible to admins only.
- **Editable stakes & distributions** — admins can edit an investor's
  ownership % / capital committed after linking them, and edit a past
  distribution entry, not just delete and redo it.
- **Delete a company** — from that company's page, in a clearly separated
  "Danger Zone" section.
- **Sales date filtering + monthly trend chart** — filter a company's
  sales list to a date range, and see a bar chart of sales by month. The
  Overview dashboard shows *this month's* sales per company rather than
  an all-time total.
- **Organization settings** — admins write a tagline, brand story, and
  vision from Settings; investors see it as a hero section at the top of
  their Overview page. This is real content you write yourself, not
  fixed copy.
- **Edit your own name and email** — from Account. This is what makes the
  "Welcome back" greeting personal, and lets you replace the seed
  `.test` email addresses with real ones (the app never sends mail, so
  email here is only a login ID — any real address works).
- **Safer company deletion** — instead of a plain OK/Cancel popup, you
  now have to type the company's exact name to enable the delete button.

## What's not built yet

Sales entry, returns received, distributions, holding expenses, charts, and
date-filtered reports. Their tables already exist in `database/schema.sql`
(see the "forward-looking tables" section) so the next session can build
directly on top of them without a schema rewrite — but there are no API
routes or UI for them yet.

## Stack

- **Client** — React 18 + Vite, React Router, plain CSS (design tokens in
  `client/src/styles/tokens.css`, shared components in
  `client/src/styles/ui.css`). No UI framework dependency.
- **Server** — Express (ESM), `pg` for raw SQL (no ORM — the queries in
  `server/src/models/` are the actual SQL, nothing hidden), JWT auth via
  `jsonwebtoken`, `bcrypt` for password hashing.
- **Database** — PostgreSQL 14+.

## Running it locally

**1. Database.** Either use Docker:

```bash
docker compose up -d
```

...or point at a Postgres instance you already have. Either way, load the
schema and seed data:

```bash
psql postgresql://postgres:postgres@localhost:5432/jn_venture_os -f database/schema.sql
psql postgresql://postgres:postgres@localhost:5432/jn_venture_os -f database/seed.sql
```

**2. Server.**

```bash
cd server
cp .env.example .env
# edit .env: set JWT_SECRET to a real random string
npm install
npm run dev
```

The API listens on `http://localhost:4000` by default. `GET /api/health`
should return `{"status":"ok", ...}`.

**3. Client.**

```bash
cd client
npm install
npm run dev
```

Open `http://localhost:5173`. The Vite dev server proxies `/api/*`
requests to the backend automatically — no CORS setup needed in dev.

## Seed accounts

Both use the password `Passw0rd!`:

| Role     | Email                        |
|----------|-------------------------------|
| admin    | `admin@jnventures.test`      |
| investor | `investor@jnventures.test`   |

The investor seed account is linked to one seed company (Northbeam
Logistics) with a 12.5% stake, so you can see the visibility scoping in
action immediately after logging in as each user.

**Change these before deploying anywhere real** — they're for local
development only.

## Project structure

```
jn-venture-os/
├── client/                 React + Vite frontend
│   └── src/
│       ├── api/            axios client (attaches JWT, handles 401)
│       ├── context/        AuthContext
│       ├── components/     ProtectedRoute, Layout (sidebar/nav)
│       ├── pages/          Login, Dashboard, Companies, CompanyDetail
│       └── styles/         design tokens + shared UI classes
├── server/                 Express backend
│   └── src/
│       ├── config/db.js    Postgres pool
│       ├── middleware/     JWT auth guard, role guard, error handler
│       ├── controllers/    route handlers
│       ├── models/         raw SQL queries
│       └── routes/
├── database/
│   ├── schema.sql
│   └── seed.sql
└── docker-compose.yml       local Postgres only
```

## Notes on how this was built

The schema, auth flow, role scoping, and the client-to-server connection
(through the Vite proxy) were all run and checked against a live database
before this was packaged up — logins, wrong-password rejection, an
investor being blocked from a company they don't hold, and an investor
getting a 403 trying to create a company were all exercised directly, not
just written and assumed to work.
