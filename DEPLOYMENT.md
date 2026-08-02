# Getting JN Venture OS Online — Step by Step

This gets you a real web address you and your investors can each log into
separately, from any device. Everything here happens by clicking around in
a web browser — there is no terminal, no command line, nothing to install.

It uses three free services:

- **GitHub** — holds your code (required by the hosting service below)
- **Neon** — hosts your database, free forever
- **Render** — runs your app and serves it at a web address, free tier

Total time: 30–45 minutes the first time. After that, it just runs.

> **One thing to know upfront:** on Render's free tier, if nobody visits
> the app for 15 minutes, it goes to sleep. The next person to visit waits
> about 30–60 seconds for it to wake up, then it's normal speed again.
> That's the trade-off for free hosting. If that's ever annoying, there's
> a $7/month plan that removes it — no code changes needed, just a click
> in Render's dashboard.

---

## Part 1 — Put your code on GitHub

1. Go to **github.com** and sign up for a free account (skip if you already have one).
2. Click the **+** icon in the top-right corner → **New repository**.
3. Name it `jn-venture-os`. Leave everything else as-is. Click **Create repository**.
4. On the new (empty) repository page, click the link that says
   **uploading an existing file**.
5. Open the folder where you extracted the zip on your computer. Drag the
   whole `jn-venture-os` folder (with `client`, `server`, `database` inside
   it) into the upload area in your browser.
6. Scroll down, type a commit message like `Initial upload`, and click
   **Commit changes**.

You now have your code on GitHub. You won't need to touch this again
unless you want to update the app later.

---

## Part 2 — Create your database (Neon)

1. Go to **neon.tech** and sign up free — "Continue with GitHub" is the
   fastest option since you already made a GitHub account.
2. Create a new project. Call it `jn-venture-os`.
3. Neon shows you a **connection string** right away — a line starting
   with `postgresql://...`. Click to copy it and paste it somewhere safe
   (a notes app) — you'll need it in Part 3.
4. In the left sidebar, click **SQL Editor**.
5. Open `database/schema.sql` from your extracted folder in any text
   editor (Notepad works), select all, copy it, paste it into the Neon
   SQL Editor, and click **Run**.
6. Do the same with `database/seed.sql` — copy its contents, paste, **Run**.

Your database now exists and has two starter accounts in it (you'll
replace these in Part 6).

---

## Part 3 — Deploy the backend (Render Web Service)

1. Go to **render.com** and sign up free using **"Sign up with GitHub."**
2. Click **New +** → **Web Service**.
3. Connect your `jn-venture-os` repository (Render will ask permission to
   access your GitHub — allow it).
4. Fill in:
   - **Name:** `jn-venture-os-api`
   - **Root Directory:** `server`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
5. Scroll to **Environment Variables** and add these four:

   | Key | Value |
   |---|---|
   | `JWT_SECRET` | `24d6981c5f66fd9786447306bc820aac726b10d551b4ec044c21f337bdbd2275f80338cd78314c52b796dab20fa6c05d` |
   | `DATABASE_URL` | *(paste the Neon connection string from Part 2)* |
   | `DB_SSL` | `true` |
   | `CLIENT_ORIGIN` | `http://localhost:5173` *(placeholder — you'll fix this in Part 5)* |

   The `JWT_SECRET` value above was generated freshly for you — it's not
   used anywhere else, so it's safe to paste as-is.

6. Click **Create Web Service**. Render will build and deploy — this takes
   a few minutes. When it's done, you'll see a URL at the top of the page
   that looks like `https://jn-venture-os-api.onrender.com`. **Copy this
   URL** — you need it in Part 4.

---

## Part 4 — Deploy the frontend (Render Static Site)

1. Back on Render, click **New +** → **Static Site**.
2. Connect the same `jn-venture-os` repository.
3. Fill in:
   - **Name:** `jn-venture-os`
   - **Root Directory:** `client`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
4. Add one environment variable:

   | Key | Value |
   |---|---|
   | `VITE_API_BASE_URL` | *(the backend URL from Part 3, with `/api` on the end — e.g. `https://jn-venture-os-api.onrender.com/api`)* |

5. Click **Create Static Site**. When it finishes, you'll get a second URL
   — something like `https://jn-venture-os.onrender.com`. **This is the
   address you'll actually give your investors.**

---

## Part 5 — Connect the two

1. Go back to your **backend** service (`jn-venture-os-api`) → the
   **Environment** tab.
2. Change `CLIENT_ORIGIN` from the placeholder to your real frontend URL
   from Part 4 (e.g. `https://jn-venture-os.onrender.com`).
3. Save. Render will redeploy the backend automatically — wait a minute
   for it to finish.

---

## Part 6 — Test it, then make it yours

1. Visit your frontend URL. First load may take up to a minute (the free
   backend is waking up) — that's normal.
2. Log in with the seed admin account: `admin@jnventures.test` /
   `Passw0rd!`
3. Go to **Account** in the sidebar and change that password to something
   only you know.
4. Go to **Users** in the sidebar and create a real account for each
   investor, with a temporary password you send them directly. They can
   change it themselves from their own Account page after logging in.
5. Go to **Companies**, add your real companies, and open each one to link
   the right investors with their actual ownership percentage.
6. Optional cleanup: once you've made your own accounts, you can remove
   the seed `investor@jnventures.test` account from the Users page — there's
   no delete button yet, so for now just don't use it, or ask me to add
   account deletion.

That's it — from here, it's a normal web app. Nobody needs to touch code,
GitHub, Neon, or Render again unless you want to change something.

---

## If something goes wrong

Paste the exact error message back to me — from the browser, or from the
**Logs** tab on the relevant Render service — and I'll tell you exactly
what to fix.

Common early hiccups:

- **"Something went wrong on our end" when logging in** → usually means
  `DATABASE_URL` or `DB_SSL` is wrong on the backend service. Double-check
  both in Render's Environment tab.
- **Blank page or login works but nothing loads after** → usually means
  `VITE_API_BASE_URL` on the frontend doesn't match your backend's real
  URL, or `CLIENT_ORIGIN` on the backend doesn't match your frontend's
  real URL. They have to match exactly, including `https://`.
- **Page takes ~45 seconds the first time someone visits after a while** →
  expected on the free tier (see the note at the top of this guide), not
  a bug.
