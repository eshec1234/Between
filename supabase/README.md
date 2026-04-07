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

## Natural narration (OpenAI TTS, optional)

The walkthrough can use **OpenAI `gpt-4o-mini-tts`** (neural voice + style prompts for soft, slow, ASMR-inspired speech) via a **Supabase Edge Function** so your API key never ships to the browser.

1. Install [Supabase CLI](https://supabase.com/docs/guides/cli), link this project.
2. In the Supabase Dashboard → **Edge Functions** → **Secrets**, add `OPENAI_API_KEY` (your OpenAI API key). Voice priority: per-mode `OPENAI_TTS_VOICE_SANCTUARY` / `OPENAI_TTS_VOICE_THEOPHANY` first, then the app sends `VITE_TTS_VOICE_*` from Vercel, then optional global `OPENAI_TTS_VOICE`. Defaults in code: Sanctuary **nova**, Theophany **marin**. Avoid setting only `OPENAI_TTS_VOICE` if you want different voices per mode. Redeploy `tts-narration` after changing the function code.
3. Deploy: `supabase functions deploy tts-narration`
4. In `.env` / Vercel env: `VITE_USE_CLOUD_NARRATION=true` (and existing `VITE_SUPABASE_*` vars).

Without this, narration stays on **device text-to-speech** only. OpenAI’s policy requires disclosing that the voice is AI-generated; the UI includes that when cloud narration is enabled.

## Curated quotes & resonance (optional)

Run migration `009_curated_quotes_resonance.sql` (or the **009** block appended to `RUN_THIS_IN_SUPABASE_SQL_EDITOR.sql`) to add `places.curated_quote` and the `place_resonance` table for anonymous “this stayed with me” tallies. Without it, the app still runs; resonance UI hides if queries fail.

If `CREATE EXTENSION postgis` fails: **Database** → **Extensions** → enable **postgis**, then run the file again.

## Migrations folder

Files `migrations/001_...` through `004_...` are the same logic in order; use them if you use Supabase CLI migrations. For a quick fix, the single file above is enough.
