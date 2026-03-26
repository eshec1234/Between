# Dependency Tracker

**Owner:** Business Operations
**Updated:** Week 5

---

## External Services Required Before Launch

| Service | Purpose | Status | Action Needed |
|---|---|---|---|
| Supabase | Database + auth | ⬜ Account exists? | Create project "between-app", run migration |
| Mapbox | Map rendering | ⬜ Token exists? | Add public token to .env |
| Vercel | Hosting | ⬜ Account exists? | Connect repo, add env vars |
| Google Fonts | Typography (Cinzel, Cormorant Garamond, Didact Gothic) | ✅ CDN in index.html | None — loads from Google CDN |

---

## npm Dependencies

| Package | Version | Purpose |
|---|---|---|
| react | ^18.2.0 | UI framework |
| react-dom | ^18.2.0 | DOM rendering |
| react-router-dom | ^6.21.0 | Client-side routing |
| @supabase/supabase-js | ^2.39.0 | Database client |
| mapbox-gl | ^3.1.0 | Map rendering |
| tailwindcss | ^4.0.0 | Styling |
| @tailwindcss/vite | ^4.0.0 | Tailwind Vite plugin |
| clsx | ^2.1.0 | Conditional class names |
| vite | ^5.0.8 | Build tool |
| @vitejs/plugin-react | ^4.2.1 | React Vite plugin |

---

## Known Risks

- Mapbox GL v3 has breaking changes from v2 — ensure token is a public token (pk.*), not secret
- Tailwind v4 has significant breaking changes from v3 — @import syntax differs
- Supabase PostGIS requires pg_extension enabled — verify on project creation
