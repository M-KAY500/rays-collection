# Connecting Ray's Collection to Supabase

## 1. Create a project
Go to supabase.com → New project. Wait for it to finish provisioning.

## 2. Run the SQL
Dashboard → **SQL Editor** → New query → paste the contents of
`supabase-setup.sql` → **Run**.

This creates:
- a `products` table with RLS enabled
- policies so **anyone** can read the catalog, but only the account
  with email `yeboahrachel383@gmail.com` can insert/update/delete
- a public `product-images` storage bucket with the same
  admin-only write rule
- the 15 starting fragrances (only if the table is empty)

## 3. Plug in your API keys
Dashboard → **Project Settings → API**. Copy:
- **Project URL**
- **anon / public key**

Paste them into `js/supabase-config.js`:
```js
const SUPABASE_URL = "https://xxxxxxxx.supabase.co";
const SUPABASE_ANON_KEY = "eyJ...";
```
The anon key is meant to be public — it's safe in frontend code because
the RLS policies above are what actually control access, not the key.

## 4. Create the admin account
Open `admin-signup.html` on your live site once and sign up with
`yeboahrachel383@gmail.com`. That's the only email the RLS policies
and the frontend allow-list will accept.

## 5. Turn off "Confirm email"
By default Supabase makes new users click a confirmation link before
they can sign in. For a single, trusted admin account that extra step
just gets in the way, so turn it off:

**Dashboard (simplest):**
Dashboard → **Authentication → Sign In / Providers → Email** →
toggle **"Confirm email"** off → Save.

**Or via the Management API (scriptable):**
```bash
curl -X PATCH "https://api.supabase.com/v1/projects/YOUR-PROJECT-REF/config/auth" \
  -H "Authorization: Bearer YOUR-SUPABASE-ACCESS-TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mailer_autoconfirm": true}'
```
- `YOUR-PROJECT-REF` — the short ID in your project URL
  (`https://<ref>.supabase.co`).
- `YOUR-SUPABASE-ACCESS-TOKEN` — a personal access token from
  Dashboard → Account → **Access Tokens** (not the anon key).

After this, `admin-signup.html` logs the admin in immediately, with
no email step.

## That's it
- The public site (`index.html`, `catalog.html`) reads products
  straight from Supabase — no localStorage involved anymore.
- The admin dashboard (`admin-dashboard.html`) writes to Supabase,
  and product photos upload to the `product-images` storage bucket
  instead of being embedded as base64 data URLs.
- Since RLS enforces the admin-only email server-side, the write
  policies hold even if someone reads the frontend source.
