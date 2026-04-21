function isIOS(forceAppleMaps) {
  if (forceAppleMaps === true) return true
  if (forceAppleMaps === false) return false
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  return /iPad|iPhone|iPod/.test(ua)
}

function hasOrigin(origin) {
  return Array.isArray(origin) && origin.length === 2 && Number.isFinite(origin[0]) && Number.isFinite(origin[1])
}

/**
 * Build an external directions URL.
 * @param {{ destination:[number,number], origin?:[number,number], label?:string, forceAppleMaps?: boolean, forceIOS?: boolean }} args
 */
export function buildDirectionsUrl({
  destination,
  origin = null,
  label = '',
  forceAppleMaps,
  forceIOS
} = {}) {
  if (!Array.isArray(destination) || destination.length !== 2) return null
  const [destLng, destLat] = destination
  if (!Number.isFinite(destLng) || !Number.isFinite(destLat)) return null

  const encodedLabel = encodeURIComponent(label || 'Destination')
  const encodedDest = `${destLat},${destLng}`
  const preferApple = forceAppleMaps ?? forceIOS

  if (isIOS(preferApple)) {
    const base = `https://maps.apple.com/?daddr=${encodedDest}&q=${encodedLabel}&dirflg=d`
    if (hasOrigin(origin)) {
      const [originLng, originLat] = origin
      return `${base}&saddr=${originLat},${originLng}`
    }
    return base
  }

  const base = `https://www.google.com/maps/dir/?api=1&destination=${encodedDest}&travelmode=driving`
  if (hasOrigin(origin)) {
    const [originLng, originLat] = origin
    return `${base}&origin=${originLat},${originLng}`
  }
  return base
}

export function openDirections({
  placeName = '',
  destLng,
  destLat,
  originLng,
  originLat
} = {}) {
  const url = buildDirectionsUrl({
    destination: [destLng, destLat],
    origin: Number.isFinite(originLng) && Number.isFinite(originLat) ? [originLng, originLat] : null,
    label: placeName
  })
  if (!url) return false
  if (typeof window === 'undefined') return true
  const opened = window.open(url, '_blank', 'noopener,noreferrer')
  if (!opened) window.location.href = url
  return true
}
