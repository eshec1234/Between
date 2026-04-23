/**
 * [lng, lat] from PostgREST / PostGIS GeoJSON, or null if unusable.
 * Shared by Map markers and "Locate on map" so fly-to never depends on Map internal state alone.
 */
function parseWktPoint(s) {
  if (typeof s !== 'string') return null
  const m = s.match(/POINT\s*\(\s*([+-]?(?:\d+\.?\d*|\d*\.?\d+))\s+([+-]?(?:\d+\.?\d*|\d*\.?\d+))\s*\)/i)
  if (!m) return null
  const lng = Number(m[1])
  const lat = Number(m[2])
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null
  return [lng, lat]
}

export function lngLatFromPlace(place) {
  if (!place || typeof place !== 'object') return null

  const n = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null)
  const directLng = n(place.lng) ?? n(place.longitude) ?? n(place.lon)
  const directLat = n(place.lat) ?? n(place.latitude)
  if (directLng != null && directLat != null) {
    if (directLng < -180 || directLng > 180 || directLat < -90 || directLat > 90) return null
    return [directLng, directLat]
  }

  let c = place.coordinates
  if (c == null) return null
  if (typeof c === 'string') {
    const wkt = parseWktPoint(c)
    if (wkt) return wkt
    try {
      c = JSON.parse(c)
    } catch {
      return null
    }
  }
  let arr = null
  if (c && typeof c === 'object') {
    if (c.type === 'Feature' && c.geometry?.type === 'Point' && Array.isArray(c.geometry?.coordinates) && c.geometry.coordinates.length >= 2) {
      arr = c.geometry.coordinates
    } else if (c.type === 'Point' && Array.isArray(c.coordinates) && c.coordinates.length >= 2) {
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
