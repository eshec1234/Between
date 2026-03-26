# Database Schema Reference

**Owner:** R&D
**Supabase Project:** between-app
**Migration file:** supabase/migrations/001_initial_schema.sql

---

## Tables

### `places`

| Column | Type | Required | Notes |
|---|---|---|---|
| id | UUID | Auto | Primary key |
| name | TEXT | Yes | Place name |
| address | TEXT | Yes | Street address |
| city | TEXT | Yes | City |
| state | TEXT | Yes | PA, NJ, or NY only |
| coordinates | GEOGRAPHY(POINT) | Yes | PostGIS spatial type |
| mode | TEXT | Yes | sanctuary, theophany, or both |
| category_tags | TEXT[] | No | Free-form tags |
| traditions | TEXT | No | Tier 1: religious/spiritual traditions |
| cultural_sensitivities | TEXT | No | Tier 1: sensitivity notes |
| access_protocols | TEXT | No | Tier 1: how to access respectfully |
| source | TEXT | Yes | verified or community |
| description | TEXT | Yes | Human-written only |
| photos | TEXT[] | No | Array of image URLs |
| created_at | TIMESTAMPTZ | Auto | UTC |
| created_by | UUID | No | References auth.users — null for community |
| intensity | INTEGER | No | Tier 2: 1–5 scale (schema only) |
| approach_tags | TEXT[] | No | Tier 2: approach style tags (schema only) |
| flags | INTEGER | No | Tier 2: moderation flags count (schema only) |

### `experience_reports`

| Column | Type | Required | Notes |
|---|---|---|---|
| id | UUID | Auto | Primary key |
| place_id | UUID | Yes | References places(id) |
| session_id | TEXT | Yes | Anonymous device session |
| content | TEXT | Yes | Human testimony |
| reflection_tag | TEXT | No | One of 4 enum values |
| created_at | TIMESTAMPTZ | Auto | UTC |

**Reflection tag enum:**
- Helped me slow down
- Felt intense
- Made me reflect
- Not what I expected

### `anonymous_sessions`

| Column | Type | Notes |
|---|---|---|
| id | TEXT | PK — the UUID from localStorage |
| created_at | TIMESTAMPTZ | First visit |
| last_active | TIMESTAMPTZ | Most recent activity |

---

## Spatial Queries

```sql
-- Places within radius (meters) of a point
SELECT *, ST_Distance(coordinates, ST_MakePoint($lng, $lat)::geography) as distance_m
FROM places
WHERE ST_DWithin(coordinates, ST_MakePoint($lng, $lat)::geography, $radius_m)
ORDER BY distance_m;

-- Count experience reports per place
SELECT place_id, COUNT(*) as report_count
FROM experience_reports
GROUP BY place_id;
```

---

## RLS Summary

| Table | Read | Insert | Update | Delete |
|---|---|---|---|---|
| places | Public | Authenticated only | — | — |
| experience_reports | Public | Anyone (anon OK) | — | — |
| anonymous_sessions | Anyone | Anyone | Anyone | Anyone |
