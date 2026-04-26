# Expense Tracker

A multi-user expense tracker built with **React + Vite + Tailwind**, backed by **Supabase** (free Postgres + auth), and deployed to **GitHub Pages** via GitHub Actions.

Features: email/password sign-in, per-user expenses & categories, monthly summaries, category / daily / 12-month trend charts, configurable currency, light/dark theme, JSON & CSV export.

---

## 1. Set up Supabase (free)

1. Go to <https://supabase.com> and sign up. Create a new project — pick a region close to you, set a strong database password (save it), and wait ~1 minute for it to spin up.
2. Open the **SQL Editor** (left sidebar) → **New query**. Paste the contents of [`supabase/schema.sql`](supabase/schema.sql) and click **Run**. This creates the `profiles`, `categories`, `expenses` tables, enables Row Level Security, and adds a trigger that seeds default categories on signup.
3. Go to **Project Settings → API**. Copy:
   - **Project URL** → this is `VITE_SUPABASE_URL`
   - **anon public** key → this is `VITE_SUPABASE_ANON_KEY`
4. (Optional) For local quick testing, you can disable email confirmation: **Authentication → Providers → Email → Confirm email = OFF**. Re-enable for production.

---

## 2. Run locally

Requires Node.js 18+.

```bash
git clone <your-repo-url>
cd expense-tracker-react
cp .env.example .env.local
# edit .env.local and paste in your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```

Open <http://localhost:5173>. Sign up with any email/password, and you should land on the dashboard with your seeded default categories.

---

## 3. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

If you don't have a repo yet, create one at <https://github.com/new> first (no README — this project already has one).

---

## 4. Deploy to GitHub Pages

The repo includes [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), which builds and deploys on every push to `main`.

**One-time setup in your GitHub repo:**

1. **Settings → Pages** → under *Build and deployment*, set **Source = GitHub Actions**.
2. **Settings → Secrets and variables → Actions → New repository secret**. Add two secrets:
   - `VITE_SUPABASE_URL` — your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` — your Supabase anon public key
3. Push any commit to `main` (or open the **Actions** tab and re-run the workflow). After it finishes, your app lives at:

   ```
   https://<your-username>.github.io/<your-repo>/
   ```

4. **Tell Supabase to allow that URL.** In Supabase: **Authentication → URL Configuration**, set
   - **Site URL** = `https://<your-username>.github.io/<your-repo>/`
   - **Redirect URLs** = same value

   Without this, email confirmation links and OAuth callbacks won't return to your app.

---

## How the data is stored

Three tables in your Supabase project:

| Table        | Purpose                                              |
|--------------|------------------------------------------------------|
| `profiles`   | One row per user — currency + theme preferences      |
| `categories` | Per-user list of categories (name + color)           |
| `expenses`   | Per-user expense entries (amount, date, category…)   |

**Row Level Security** is enabled on all three. Each policy says "you can only see/modify rows where `user_id = auth.uid()`," so users can never read or write each other's data — even if they bypass the React client.

The free Supabase tier gives 500 MB of Postgres storage and 50,000 monthly active users, which is plenty for this app.

---

## Project structure

```
expense-tracker-react/
├── .github/workflows/deploy.yml   GitHub Pages deploy
├── supabase/schema.sql            Tables + RLS + trigger
├── src/
│   ├── App.jsx                    Auth gate (signed in → Dashboard, else → Auth)
│   ├── supabaseClient.js          createClient(url, anonKey)
│   ├── lib/format.js              Money/date helpers, currency list
│   └── components/
│       ├── Auth.jsx               Email/password sign in & sign up
│       ├── Dashboard.jsx          Top-level layout + data plumbing
│       ├── SummaryCards.jsx       Monthly/all-time totals + delta
│       ├── AddExpenseForm.jsx     New expense form
│       ├── ExpenseTable.jsx       Sortable / searchable / filterable list
│       ├── EditExpenseModal.jsx   In-place edit
│       ├── Charts.jsx             Recharts: pie, daily bar, 12-mo line
│       ├── CategoryManager.jsx    Add / delete categories
│       └── Toast.jsx              Toast context + provider
├── index.html
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── vite.config.js
```

---

## Troubleshooting

**Blank page on GitHub Pages.** Check the browser console. Usually it's one of:
- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` secrets weren't set before the build ran. Add them and re-run the workflow.
- Asset 404s. Make sure repo name matches the URL — the workflow auto-sets `VITE_BASE_PATH` to `/${repo-name}/`.

**Can sign up but `profiles` row missing.** The `on_auth_user_created` trigger didn't run — re-paste `supabase/schema.sql` in the SQL editor.

**"Email not confirmed" error.** Either click the link in the confirmation email, or disable email confirmation in Supabase Auth settings (dev only).

**RLS errors on insert.** The user isn't logged in, or `user_id` isn't being set to `auth.uid()`. The `Dashboard.jsx` code always passes `user_id: user.id` — make sure you didn't remove it.

---

## License

MIT — do whatever.
