/**
 * [lng, lat] from PostgREST / PostGIS GeoJSON, or null if unusable.
 * Shared by Map markers and "Locate on map" so fly-to never depends on Map internal state alone.
 */
export function lngLatFromPlace(place) {
  let c = place?.coordinates
  if (c == null) return null
  if (typeof c === 'string') {
    try {
      c = JSON.parse(c)
    } catch {
      return null
    }
  }
  let arr = null
  if (c && typeof c === 'object') {
    if (c.type === 'Point' && Array.isArray(c.coordinates) && c.coordinates.length >= 2) {
      arr = c.coordinates
    } else if (Array.isArray(c.coordinates) && c.coordinates.length >= 2) {
      arr = c.coordinates
    }
  }
  if (!arr && Array.isArray(c) && c.length >= 2) arr = c
  if (!arr || arr.length < 2) return null
  const lng = Number(arr[0])
  const lat = Number(arr[1])
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null
  if (lng < -180 || lng > 180 || lat < -90 || lat > 90) return null
  return [lng, lat]
}
