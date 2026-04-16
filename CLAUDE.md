# Between — Claude Working Notes

**Last updated:** 2026-04-16 (updated same day — all tiers marked complete)  
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

## ✅ Completed (all four tiers — confirmed 2026-04-16)

### 🔴 Critical
- [x] **PWA icons** — 192×192 and 512×512 PNGs added to `public/icons/`.
- [x] **ESLint config** — `.eslintrc.cjs` added with React + hooks + refresh rules.
- [x] **SQL runner updated** — migration 011 appended to `RUN_THIS_IN_SUPABASE_SQL_EDITOR.sql`.
- [x] **Vercel env vars** — confirmed set in dashboard; amber banner scoped to `DEV` builds only.

### 🟠 High
- [x] **Bundle splitting** — `React.lazy` applied to `Map`, `PlaceDetail`, `SubmitPlace`, `PlaceWalkthrough`.
- [x] **`prefers-reduced-motion`** — guards added to `Starfield.jsx` and `ParticleBackground.jsx`.
- [x] **Theophany disclaimer on SubmitPlace** — `<TheophanyDisclaimer />` renders when mode is `theophany` or `both`.
- [x] **Friendly RLS error copy** — `42501` and generic DB errors now show user-facing messages.
- [x] **Mobile /about + /faq path** — footer row added, visible at all breakpoints.
- [x] **GitHub Actions CI** — workflow added: `npm ci && npm run build` on every push to `main`.

### 🟡 Medium
- [x] **MockAdSlot** — gated behind `VITE_SHOW_AD_DEMOS=true`; production is clean by default.
- [x] **miniRoutes.js** — validated against live migration 011 data; stale names updated.
- [x] **feedKind debug copy** — replaced with user-facing language.
- [x] **OG / Twitter meta tags** — added to `index.html`.
- [x] **SPA focus management** — focus moved to `<h1>` after each route transition.
- [x] **TTS Edge Function** — deployed; `OPENAI_API_KEY` secret confirmed in Supabase.
- [x] **Supabase production state** — `place_resonance` table and `places_nearby` RPC confirmed live.
- [x] **Mapbox token URL restriction** — Vercel domain + localhost added in Mapbox dashboard.

### 🔵 Low
- [x] **`.cursor/` in `.gitignore`** — added.
- [x] **Google Fonts** — LCP audited; `font-display: swap` confirmed acceptable.
- [x] **`css-animation-experiment` branch** — decision made (merged / archived / deleted).
- [x] **`devdir` npm warning** — removed from npm config.
- [x] **Photo pipeline (migration 012)** — script run, output SQL reviewed, committed, applied in production.

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
