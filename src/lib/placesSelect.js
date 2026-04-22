/**
 * Columns for home list / map / cards when merging catalog rows (avoid select('*')).
 * Keep in sync with PlaceCard, Map, EngagementHub, intentions, and sanctuary tradition filters.
 */
export const PLACES_LIST_SELECT =
  'id, name, city, state, mode, coordinates, category_tags, description, traditions, source, photos, created_at, flags'
