# Technical Specification

**Owner:** R&D
**Version:** 1.0 (Week 5)

---

## Stack

| Layer | Technology | Version | Notes |
|---|---|---|---|
| UI Framework | React | 18.2 | Hooks-based, no class components |
| Build Tool | Vite | 5.x | Fast HMR, ESM-native |
| Styling | Tailwind CSS | 4.x | @import syntax, JIT |
| Routing | React Router | 6.x | Client-side, SPA |
| Database | Supabase (PostgreSQL) | — | Project: between-app |
| Spatial Data | PostGIS | — | GEOGRAPHY(POINT) for coordinates |
| Map Rendering | Mapbox GL JS | 3.x | Public token (pk.*) required |
| Hosting | Vercel | — | SPA rewrite rule in vercel.json |
| PWA | Service Worker + Manifest | — | Cache-first for static, network-first for API |

---

## Architecture

```
Browser (PWA)
  └── React SPA
        ├── react-router-dom (/, /place/:id, /submit)
        ├── Mapbox GL JS (map rendering)
        └── @supabase/supabase-js
              └── Supabase (PostgreSQL + PostGIS)
```

---

## Authentication Model

**No traditional auth.** Between uses anonymous device-based sessions:

- `crypto.randomUUID()` generates a session ID on first visit
- Stored in `localStorage` as `between_session_id`
- Used as `session_id` on all experience report submissions
- Never linked to a user identity

Place submissions require Supabase `authenticated` role — currently gated. Community submissions use the anonymous session approach (future: simple email magic link if moderation requires it).

---

## Database

See `supabase/migrations/001_initial_schema.sql` for full schema.

**Key tables:**
- `places` — core place database with PostGIS coordinates
- `experience_reports` — anonymous human testimony (formerly "reviews")
- `anonymous_sessions` — optional session tracking

**Spatial queries:**
```sql
-- Find places within 10km of a point
SELECT * FROM places
WHERE ST_DWithin(
  coordinates,
  ST_MakePoint(-75.1652, 39.9526)::geography,
  10000
);
```

---

## Environment Variables

```
VITE_SUPABASE_URL       — Supabase project URL
VITE_SUPABASE_ANON_KEY  — Supabase anon/public key
VITE_MAPBOX_TOKEN       — Mapbox public token (pk.*)
```

All prefixed `VITE_` for Vite's client-side env injection. Never use service role key in client.

---

## PWA Requirements

- `manifest.json` with name, icons, display: standalone
- Service worker registered in `index.html`
- Cache strategy: static assets cached, API calls network-first
- Icons: 192x192 and 512x512 (placeholder — replace before launch)

---

## Deployment

```bash
# Local development
npm run dev    # http://localhost:5173

# Production build
npm run build  # outputs to dist/

# Vercel (automatic on push to main)
# vercel.json handles SPA routing rewrites
```
