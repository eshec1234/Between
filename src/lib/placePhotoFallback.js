/** When DB `photos` is empty, still show calm spiritual imagery (matches SQL 008 defaults). */
export const DEFAULT_PLACE_PHOTOS = [
  'https://images.unsplash.com/photo-1438032005730-c779502df39b?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1478147427282-58a87a120781?auto=format&fit=crop&w=1400&q=80'
]

export function photosForPlace(place) {
  const p = place?.photos
  if (Array.isArray(p) && p.length > 0 && p.some(Boolean)) return p.filter(Boolean)
  return DEFAULT_PLACE_PHOTOS
}

const TIME_LABELS = ['Dawn', 'Midday', 'Dusk', 'Night']

function timeBucketIndex(hour, len) {
  if (len <= 1) return 0
  if (len === 2) return hour >= 5 && hour < 17 ? 0 : 1
  if (len === 3) {
    if (hour >= 5 && hour < 11) return 0
    if (hour >= 11 && hour < 17) return 1
    return 2
  }
  if (hour >= 5 && hour < 11) return 0
  if (hour >= 11 && hour < 16) return 1
  if (hour >= 16 && hour < 21) return 2
  return Math.min(3, len - 1)
}

/**
 * Pick a photo by local time of day (same place can read differently at dawn vs dusk when multiple photos exist).
 */
export function photoForPlaceAtTime(place) {
  const photos = photosForPlace(place)
  if (!photos.length) return { url: null, label: '' }
  const hour = new Date().getHours()
  const idx = timeBucketIndex(hour, photos.length)
  return {
    url: photos[idx],
    label: photos.length > 1 ? TIME_LABELS[Math.min(idx, TIME_LABELS.length - 1)] : ''
  }
}
