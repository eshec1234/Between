# Between — Claude Working Notes

**Last updated:** 2026-04-16  
**Stack:** Vite + React + Supabase + Mapbox + Vercel  
**Production:** deploys from `main` via Vercel → commit + push after every meaningful change.

---

## ⏰ REMINDER — Tuesday April 21

> **Address map functionality** — see MAP section below for full context.

---

## Recently completed

| Date | What |
|------|------|
| 2026-04-16 | Fixed color-scheme inconsistency: `PlaceDetail` was always applying Theophany purple to `mode='both'` places even when browsing in Sanctuary mode. Now uses the user's active home mode as the tiebreaker. |
| Prior | Theophany home disclaimer, omen, and intensity scale moved to top of scroll stack (above feed). `TheophanyDisclaimer` made embeddable with optional `className`. |

---

## To-do list

### 🔴 Critical — must fix before any public traffic

- [ ] **PWA icons** — `public/icons/` is empty; `manifest.json` + `index.html` reference two PNGs that don't exist (192×192 and 512×512). Browser tab favicons and iOS Add-to-Home-Screen are broken.
- [ ] **ESLint config missing** — `npm run lint` exits code 2. No `.eslintrc.cjs` or `eslint.config.*` exists. Add React + hooks + refresh rules.
- [ ] **SQL runner stale** — `RUN_THIS_IN_SUPABASE_SQL_EDITOR.sql` only runs migrations 001–010. Migration 011 (the full researched places dataset, 8,696 lines) is missing. Anyone bootstrapping a fresh Supabase gets the wrong data.
- [ ] **Verify Vercel env vars** — confirm `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_MAPBOX_TOKEN` are set in Vercel → Settings → Environment Variables. Scope the amber missing-env banner to `import.meta.env.DEV` only so it never hits production users.

---

### 🟠 High — fix before wide release / press demo

- [ ] **Bundle splitting** — entire app is one 2.2 MB / 616 KB gzip chunk. Lazy-load `Map`, `PlaceDetail`, `SubmitPlace`, `PlaceWalkthrough` with `React.lazy`. Target: home shell under 300 KB gzip.
- [ ] **`prefers-reduced-motion`** — `Starfield.jsx` and `ParticleBackground.jsx` run animations unconditionally. Add `@media (prefers-reduced-motion: reduce)` guards.
- [ ] **Theophany disclaimer on SubmitPlace** — when `mode === 'theophany'` or `'both'` is selected, render `<TheophanyDisclaimer />` above the submit button (checkbox acknowledgment optional).
- [ ] **Friendly error copy for RLS failures** — submit handlers in `PlaceDetail` and `SubmitPlace` should map error code `42501` → "We couldn't save that right now — try again in a moment." Add a generic catch-all too.
- [ ] **Mobile path to /about and /faq** — `Home.jsx` uses `hidden sm:flex` for those links. Mobile users have no way to reach them. Add a footer row or overflow menu visible at all breakpoints.
- [ ] **GitHub Actions CI** — no `.github/workflows/` exists. Add a workflow that runs `npm ci && npm run build` on every push to `main` so broken builds don't silently deploy.

---

### 🟡 Medium — fix before press / investor demos

- [ ] **MockAdSlot in production** — three "Sponsor demo" dashed boxes render in the live app. Gate behind `VITE_SHOW_AD_DEMOS=true` or replace with a "submit a place" mission CTA.
- [ ] **miniRoutes.js names may be broken** — `src/data/miniRoutes.js` matches stops by exact `places.name`. Migration 011 replaced those rows — names may have changed. Run `npm run check:api` against prod and validate every `placeNames` entry.
- [ ] **feedKind debug copy** — the "Within ~350 km…" / "Catalog order…" status line reads like internal ops copy. Replace with user-facing language or tuck behind a `?` tooltip.
- [ ] **OG / Twitter meta tags** — `index.html` has no `og:title`, `og:image`, `og:description`, or `twitter:card`. Social shares show nothing.
- [ ] **SPA focus management** — route changes leave focus on the last-clicked element. Screen-reader users get no page-change announcement. Move focus to `<h1>` or an `aria-live` region after each navigation.
- [ ] **TTS Edge Function** — confirm `tts-narration` is deployed (`supabase functions deploy tts-narration`) and `OPENAI_API_KEY` is set as a Supabase Edge Function secret. If `VITE_USE_CLOUD_NARRATION=true` is set in Vercel without a deployed function, all walkthrough narrations silently fall back to device TTS.
- [ ] **Supabase production state** — run `npm run check:api` with prod credentials. Confirm `place_resonance` table (migration 009) and `places_nearby` RPC exist in production.
- [ ] **Mapbox token URL restriction** — add Vercel domain + localhost as allowed URLs in Mapbox dashboard so the token can't be used by other domains for billable tile requests.

---

### 🔵 Low — cleanup and polish

- [ ] **`.cursor/` not in `.gitignore`** — three agent-image files pollute `git status`. Add `.cursor/` to `.gitignore`.
- [ ] **Google Fonts render-blocking** — measure LCP impact; self-hosting is the full fix, but confirm `font-display: swap` is working acceptably first.
- [ ] **`css-animation-experiment` branch** — 3 unmerged commits that swap place cards for SVG node diagrams. Decide: merge, archive, or delete.
- [ ] **`devdir` npm warning** — `npm warn Unknown env config "devdir"` on every npm invocation. Remove from `~/.npmrc` or Vercel env.
- [ ] **Photo pipeline (migration 012)** — `scripts/fetch-place-photos.mjs` is ready but the output SQL has never been run. Many places show the SVG placeholder because `photos` column is empty. Run the script (free Wikimedia mode), review output, commit as migration 012, apply in production.

---

## 🗺️ Map — Tuesday April 21 agenda

From `PRE_LAUNCH_CHECKLIST.md §7` and `UX_IMPROVEMENT_PROPOSAL.md §P2-9`:

- `Map.jsx` cleans up markers with `document.querySelectorAll('.between-marker')` — a **global DOM query** that will conflict if a second map instance ever mounts. Scope cleanup to the map container ref.
- Map height `h-[min(52vh,420px)]` — validate on short phones (landscape, small SE), foldables, and dynamic viewport. Not all containers use `100dvh`.
- Keyboard operability — ensure place pins are reachable and have visible focus for screen-reader / keyboard users.
- Text alternative — add a short accessible description ("map shows sacred and liminal places near you") for non-visual users.
- Mapbox token scope — add allowed-URL restriction in Mapbox dashboard (links to M8 above).
- Lazy-load Mapbox GL — it's the heaviest dependency and loads on every route. Defer until the map section is visible or the user navigates to a map-showing route.

---

## Architecture quick-reference

| Layer | Key files |
|-------|-----------|
| Home feed + mode toggle | `src/pages/Home.jsx`, `src/lib/feed.js`, `src/lib/betweenLocal.js` |
| Place detail + theming | `src/pages/PlaceDetail.jsx` |
| Color tokens | `src/styles/index.css` (`@theme` block) |
| Map | `src/components/Map.jsx` |
| TTS walkthrough | `src/components/PlaceWalkthrough.jsx`, `supabase/functions/tts-narration/` |
| Supabase client + session | `src/lib/supabase.js` |
| Migrations | `supabase/migrations/` (001–011; 012 not yet generated) |
| Ambient audio context | `src/context/AmbientModeContext.jsx` |
