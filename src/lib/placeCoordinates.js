function finiteNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value)
    return Number.isFinite(n) ? n : null
  }
  return null
}

function normalizeLngLat(candidate) {
  if (!candidate) return null

  if (Array.isArray(candidate) && candidate.length >= 2) {
    const lng = finiteNumber(candidate[0])
    const lat = finiteNumber(candidate[1])
    if (lng != null && lat != null) return [lng, lat]
    return null
  }

  if (typeof candidate !== 'object') return null

  if (Array.isArray(candidate.coordinates)) {
    return normalizeLngLat(candidate.coordinates)
  }

  const lng =
    finiteNumber(candidate.lng) ??
    finiteNumber(candidate.lon) ??
    finiteNumber(candidate.longitude) ??
    finiteNumber(candidate.x)
  const lat =
    finiteNumber(candidate.lat) ??
    finiteNumber(candidate.latitude) ??
    finiteNumber(candidate.y)

  if (lng != null && lat != null) return [lng, lat]
  return null
}

export function placeLngLat(place) {
  if (!place || typeof place !== 'object') return null

  const candidates = [
    place.coordinates,
    place.geometry,
    place.location,
    [place.lng, place.lat],
    [place.lon, place.lat],
    [place.longitude, place.latitude]
  ]

  for (const candidate of candidates) {
    const coords = normalizeLngLat(candidate)
    if (coords) return coords
  }
  return null
}

export function hasPlaceCoordinates(place) {
  return placeLngLat(place) != null
}
