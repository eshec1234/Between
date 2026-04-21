import { supabaseUrl } from './env'

/**
 * Photos stored in this project's Supabase Storage bucket are "visitor photos"
 * — real images taken on-location by users.
 */
function isVisitorPhoto(url) {
  return Boolean(
    url &&
    typeof url === 'string' &&
    supabaseUrl &&
    url.startsWith(supabaseUrl)
  )
}

/**
 * Returns visitor-uploaded photos first; falls back to seeded external URLs
 * (Unsplash, Wikimedia, etc.) as AI placeholders until real photos arrive.
 */
export function photosForPlace(place) {
  const p = place?.photos
  if (!Array.isArray(p) || !p.length) return []
  const visitor = p.filter(isVisitorPhoto)
  // If real visitor photos exist, show only those.
  if (visitor.length) return visitor
  // Otherwise return the seeded external URLs as temporary AI placeholders.
  return p.filter((u) => typeof u === 'string' && u.length > 0)
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
 * Pick a photo by local time of day.
 */
export function photoForPlaceAtTime(place) {
  const photos = photosForPlace(place)
  if (!photos.length) return { url: null, label: '' }
  const hour = new Date().getHours()
  const idx = timeBucketIndex(hour, photos.length)
  // Only show time labels when there are multiple real photos
  const hasMultiple = photos.length > 1 && photos.some(isVisitorPhoto)
  return {
    url: photos[idx],
    label: hasMultiple ? TIME_LABELS[Math.min(idx, TIME_LABELS.length - 1)] : ''
  }
}

function dedupePush(out, u) {
  if (u && typeof u === 'string' && !out.includes(u)) out.push(u)
}

/**
 * Ordered URLs to try for image rendering — visitor photos first, then AI
 * placeholder seeds. Accepts optional visitor photo URLs from experience
 * reports, which override the place.photos array entirely.
 */
export function placeImageFallbackChain(place, visitorPhotoUrls = []) {
  const out = []
  // Visitor-uploaded photos from experience_reports take top priority
  for (const u of visitorPhotoUrls) dedupePush(out, u)
  if (out.length) return out
  // Fall back to place.photos (visitor bucket photos, then seeded URLs)
  const { url: primary } = photoForPlaceAtTime(place)
  const pool = photosForPlace(place)
  dedupePush(out, primary)
  for (const u of pool) dedupePush(out, u)
  return out
}

/** Single gallery URL fallback chain. */
export function imageUrlFallbackChain(url) {
  const out = []
  if (url && typeof url === 'string') dedupePush(out, url)
  return out
}
