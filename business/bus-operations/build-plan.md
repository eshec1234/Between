# Build Plan — Weeks 5–14

**Owner:** Business Operations / R&D
**Sprint length:** 1 week
**Status:** Active

---

## Tier 1 (MVP) — Weeks 5–7

All copy/config changes, no complex logic.

| # | Feature | Status | Week |
|---|---|---|---|
| 1 | Rename "reviews" → "experience reports" throughout | ✅ Complete | 5 |
| 2 | Forbidden words list | ✅ Complete | 5 |
| 3 | Onboarding interstitial | ✅ Complete | 5 |
| 4 | What This App Is Not FAQ | ✅ Complete | 5 |
| 5 | AI-Behind-the-Curtain policy | ✅ Complete | 5 |
| 6 | Metaphysical Drift Check | ✅ Complete | 5 |
| 7 | Theophany disclaimer on every place | ✅ Complete | 5 |
| 8 | Tradition + Sensitivity fields in schema | ✅ Complete | 5 |
| 9 | Indigenous Land Policy | ✅ Complete | 5 |
| 10 | Anti-Hallow positioning doc | ✅ Complete | 5 |
| 11 | Discovery framing copy | ✅ Complete | 5 |
| 12 | Partner Custodians framework | ✅ Complete | 5 |

---

## Tier 1.5 (Infrastructure) — Weeks 6–7

| Feature | Status | Week |
|---|---|---|
| Supabase project setup (between-app) | ⬜ Pending env vars | 6 |
| Run 001_initial_schema.sql migration | ⬜ Pending Supabase | 6 |
| Mapbox token configured | ⬜ Pending env vars | 6 |
| Vercel deployment | ⬜ Pending | 7 |
| PWA Lighthouse audit pass | ⬜ Pending deployment | 7 |
| Seed 5–10 initial places (PA/NJ/NY) | ⬜ Pending | 7 |

---

## Tier 2 (Post-MVP) — Weeks 8–11

| Feature | Notes |
|---|---|
| Intensity rating (1–5) | Schema already includes `intensity` field |
| Approach tags | Schema already includes `approach_tags` |
| Flagging system | Schema already includes `flags` field |
| Photo upload | Currently text array of URLs only |
| Admin moderation queue | Simple Supabase dashboard sufficient initially |
| Map clustering | For when DB exceeds ~50 places |

---

## Tier 3 (Future) — Weeks 12–14

| Feature | Notes |
|---|---|
| Offline mode improvements | Service worker expansion |
| Partner custodian listings in-app | Separate from place DB |
| iOS/Android native (Capacitor) | Only if PWA proves insufficient |
| Multi-region expansion (beyond PA/NJ/NY) | State constraint in schema — easy to expand |
