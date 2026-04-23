/**
 * [lng, lat] from PostgREST / PostGIS GeoJSON, or null if unusable.
 * Shared by Map markers and "Locate on map" so fly-to never depends on Map internal state alone.
 */
function parseWktPoint(s) {
  if (typeof s !== 'string') return null
  // Handles "SRID=4326;POINT(-75.3 40.5)" and bare "POINT( ... )"
  const u = s.toUpperCase()
  const p = u.indexOf('POINT(')
  if (p < 0) return null
  const m = s.slice(p).match(/POINT\s*\(\s*([+-]?(?:\d+\.?\d*|\d*\.?\d+))\s+([+-]?(?:\d+\.?\d*|\d*\.?\d+))\s*\)/i)
  if (!m) return null
  const lng = Number(m[1])
  const lat = Number(m[2])
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null
  return [lng, lat]
}

/** PostGIS EWKB as hex (some APIs return geography as a hex string, not GeoJSON). */
function tryLngLatFromHexEwkb(s) {
  if (typeof s !== 'string') return null
  const clean = s.replace(/^\s*\\?x?/i, '').replace(/[\s\n]/g, '')
  if (clean.length < 32 || !/^[0-9a-fA-F]+$/i.test(clean)) return null
  const n = Math.floor(clean.length / 2)
  const ab = new ArrayBuffer(n)
  const u8 = new Uint8Array(ab)
  for (let i = 0; i < n; i++) u8[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16)
  if (n < 25) return null
  const le = u8[0] === 1
  const view = new DataView(ab)
  // PostGIS EWKB: Point+SRID → coords at byte 9; 2D Point without SRID at byte 5. Avoid scanning
  // random offsets (wrong doubles can look “valid” and shift pins by km).
  for (const off of [9, 5]) {
    if (off + 16 > n) continue
    const x = view.getFloat64(off, le)
    const y = view.getFloat64(off + 8, le)
    if (Number.isFinite(x) && Number.isFinite(y) && x >= -180 && x <= 180 && y >= -90 && y <= 90) {
      return [x, y]
    }
  }
  return null
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
    const fromHex = tryLngLatFromHexEwkb(c)
    if (fromHex) return fromHex
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
