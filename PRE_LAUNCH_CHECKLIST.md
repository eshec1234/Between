# Between — pre-launch QA checklist

This document inventories **routes**, **data/API surfaces**, and **launch risks** observed in the current Vite + React build (March 2026). Use it as a working list: check items off, add owners and dates, and file issues for anything that blocks release.

---

## 1. Release criteria (suggested)

| Gate | Target |
|------|--------|
| Critical defects | 0 open (data loss, security, broken core flows) |
| Production env | `VITE_SUPABASE_*`, `VITE_MAPBOX_*` set in Vercel; Supabase SQL + RLS verified |
| Smoke pass | All routes load on mobile + desktop; place open → walkthrough → reflection stub |
| Performance | Home and place detail feel responsive on 4G; no unbounded or N+1 query growth |

---

## 2. Route inventory (manual pass)

Test each path on **at least one iOS Safari**, **one Android Chrome**, and **desktop**. Record Time-to-Interactive and any layout breaks.

| Path | Page | Launch actions |
|------|------|----------------|
| `/` | `Home.jsx` (Sanctuary / Theophany) | Toggle modes; scroll full length; open map; use filters, intention, tradition bar, “Surprise me”; confirm list + map markers; verify onboarding overlay once |
| `/place/:id` | `PlaceDetail.jsx` | Load valid UUID; invalid id → “Place not found”; `?surprise=1`; `?walkthrough=1`; gallery + walkthrough TTS; post tip + review; flag; resonance button |
| `/submit` | `SubmitPlace.jsx` | Full validation; anon insert success + RLS error messages; navigation after success |
| `/about` | `About.jsx` | Back link; typography on narrow screens |
| `/faq` | `FAQPage.jsx` | Accordions; keyboard + screen reader spot check |

**Routing note:** `About` and `FAQ` sit **outside** the main `MainApp` shell (no shared header with mode toggle). That is intentional for a simple marketing mini-site, but confirm navigation is obvious on mobile (see §5 — About/FAQ are `hidden` in the home header below `sm`).

---

## 3. In-app navigation & deep links

| Link target | Where used | Launch check |
|-------------|------------|--------------|
| `/place/{id}` | Home cards, Activity feed, trending strip, Dark horse, EngagementHub, Map popups (via marker) | Every surfaced `id` resolves to a row in `places`; no stale seed IDs after data changes |
| `/submit` | FAB `+` on home | Not obscured by OS home indicator / notches (see §5) |
| `/about`, `/faq` | Home header (≥sm only) | Add a mobile-visible path if those pages must be discoverable without guessing URLs |

**Mini-routes:** `src/data/miniRoutes.js` resolves stops by **exact** `places.name` against the **current** `places` array (capped list on home). Verify seed data names match; after edits in Supabase, mini-routes can silently drop stops or whole routes.

---

## 4. Supabase: tables, RPC, and Edge Functions

**Client writes/reads (audit RLS, indexes, and row counts at scale):**

| Surface | Operation | File / context | Performance / launch notes |
|---------|-----------|----------------|----------------------------|
| `anonymous_sessions` | upsert on load + visibility | `src/lib/supabase.js` | Volume OK; watch rate if you add analytics |
| `places` | select `*`, insert | `Home.jsx`, `PlaceDetail.jsx`, `SubmitPlace.jsx` | Home fallback query uses `select('*').limit(80)` — **heavy** if rows are wide; consider explicit columns + indexes on `mode`, `created_at`, geospatial |
| `places_nearby` | RPC | `Home.jsx` | Must exist and be fast; **document** says fallback if RPC missing — run production SQL and EXPLAIN |
| `experience_reports` | select, insert (with/without extended columns) | `PlaceDetail.jsx`, `feed.js` | Feed does multiple queries + `in('id', ids)` — OK at small scale; index `place_id`, `created_at` |
| `place_resonance` | count + insert | `PlaceDetail.jsx` | Code catches missing table — **ensure migration 009** applied in prod |
| `report_place_flag` | RPC | `PlaceDetail.jsx` | Must exist; verify idempotent / abuse limits |

**Edge Function**

| Name | Trigger | Launch actions |
|------|---------|----------------|
| `tts-narration` | POST from browser when `VITE_USE_CLOUD_NARRATION=true` | Deploy function; set `OPENAI_API_KEY` (and optional voice env vars) in Supabase secrets; load-test latency; verify CORS/403 behavior; disclose AI audio in UI (already surfaced in walkthrough copy) |

---

## 5. Mobile, viewport, and aspect ratio

**Observed UI risks**

- **Map height:** `h-[min(52vh,420px)]` — validate on **short** phones (landscape, small SE), **foldables**, and **dynamic viewport** (`100dvh` used in some overlays; not all containers use it).
- **Fixed header (Theophany):** `fixed` top bar + `pt-24` on content — confirm no overlap with iOS safe area / notch (`env(safe-area-inset-*)` not wired globally).
- **FAB:** `absolute bottom-6 right-6` submit button may clash with **home indicator**; add `padding-bottom: max(1.5rem, env(safe-area-inset-bottom))` pattern if needed.
- **About/FAQ discovery:** `Home.jsx` uses `hidden … sm:flex` for About/FAQ links — **mobile users may never see them** unless you add a menu or footer links.
- **Touch targets:** Audit chips, streak button, and map controls for ≥44px where feasible.
- **Images:** `aspect-[4/3]` cards and hero heights — spot-check ultra-wide and very tall aspect-ratio devices.

**Suggested pass:** Chrome DevTools device mode + two real devices; rotate portrait/landscape on place detail (gallery + long forms).

---

## 6. Third-party & network performance

| Dependency | Risk | Launch check |
|------------|------|--------------|
| **Mapbox GL** | Large JS + style/token | Lazy consideration for non-map routes; token restrictions in Mapbox dashboard |
| **Google Fonts** | Render-blocking | CDN preconnect exists — measure LCP; consider `font-display: swap` in hosted CSS or self-host |
| **External photos** | `PlaceImage` / URLs in `photos` | Validate HTTPS, CORS, and broken image fallbacks under slow network |
| **OpenAI (TTS)** | Cost + latency | Time `fetchNarrationTts`; handle 503 when secret missing |

---

## 7. Map component (quality note)

`Map.jsx` removes markers with `document.querySelectorAll('.between-marker')` — **global DOM query**. If a second map instance is ever added, markers could conflict. Before launch, confirm only one map mounts; or scope cleanup to the map container.

---

## 8. PWA, offline, and caching

| Asset | Location | Launch check |
|-------|----------|--------------|
| `manifest.json` | `public/` | Icons, name, theme colors |
| `service-worker.js` | `public/` | Update strategy (`updateViaCache: 'none'` in `index.html`); verify stale bundle behavior after deploy |
| `InstallPwaPrompt` | component | Prompt copy and dismissal persistence |

---

## 9. Security, privacy, and abuse

- **Anon key exposure:** Expected for Supabase anon; **RLS must enforce** all writes/reads.
- **User-generated content:** Tips/reviews — moderation story (flag flow exists; define SLAs).
- **Geolocation:** Privacy copy is present — ensure it matches actual behavior (watch vs one-shot).
- **Character.AI link:** Optional `VITE_CHARACTER_AI_URL` — validate URL is https and not mistaken for an API.

---

## 10. Accessibility (baseline)

- Focus order on modals (`Onboarding`, `LocationConsentModal` if shown), FAQ accordions, and forms on `/submit`.
- Color contrast on Theophany purple-on-black blocks.
- Walkthrough: audio-only users — ensure text beats are visible (they are); TTS failures should degrade gracefully (`PlaceWalkthrough`).

---

## 11. Testing & automation gap

There is **no** `jest`/`vitest`/`playwright` suite in-repo today. Before launch, at minimum:

1. **Smoke script** (manual or Playwright): home → place → submit.
2. **API contract checks:** RPCs and critical tables exist on production project.
3. Optional: Lighthouse CI on `/` and `/place/:sampleId`.

---

## 12. Data & content readiness

- Run production **`RUN_THIS_IN_SUPABASE_SQL_EDITOR.sql`** (or equivalent migrations) and confirm `places_nearby`, flags, resonance, reports schema.
- Reconcile **mini-route** place names with live `places.name`.
- Replace **MockAdSlot** if advertising is not part of v1 (or keep as explicit “sponsored” placeholder with legal review).

---

## 13. Environment checklist (Vercel + Supabase)

See `.env.example`. Production needs at minimum:

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- `VITE_MAPBOX_TOKEN` (or documented alias)
- Optional: `VITE_USE_CLOUD_NARRATION`, Edge Function secrets, `VITE_CHARACTER_AI_URL`

---

## 14. Sign-off block

| Area | Owner | Sign-off date |
|------|-------|---------------|
| Routes / mobile layout | | |
| Supabase RLS & migrations | | |
| Map + geolocation | | |
| TTS / Edge function | | |
| Legal / school branding | | |

---

*Generated from static codebase review. Treat performance figures as “to be measured” unless you have traces attached.*
