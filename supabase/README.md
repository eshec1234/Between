# Supabase database setup

## Why you see “table `places` is missing”

The app talks to **your** Supabase project. Tables are **not** created by Vercel or by a Pro plan — you create them by running SQL in that project.

## Use the correct project

1. In Vercel → Environment Variables, copy `VITE_SUPABASE_URL` (e.g. `https://xxxxx.supabase.co`).
2. In Supabase Dashboard, open the project whose **URL matches** that host.
3. Run SQL only in **that** project.

## One-step setup (recommended)

1. Supabase → **SQL Editor** → New query.
2. Open `RUN_THIS_IN_SUPABASE_SQL_EDITOR.sql` in this repo, copy **all** of it, paste, **Run**.
3. **Table Editor** → confirm `places` exists and has the seed row.

Spatial search and moderation flags require section **005** in that file (or run `migrations/005_spatial_rpc_and_moderation.sql`). Without it, the app falls back to a non-spatial feed.

If `CREATE EXTENSION postgis` fails: **Database** → **Extensions** → enable **postgis**, then run the file again.

## Migrations folder

Files `migrations/001_...` through `004_...` are the same logic in order; use them if you use Supabase CLI migrations. For a quick fix, the single file above is enough.
