import { supabaseUrl } from './env'

/**
 * Only photos stored in this project's Supabase Storage bucket are real
 * visitor photos. Seeded external URLs (Unsplash, Wikimedia, etc.) are
 * intentionally excluded — the custom SVG PlaceholderImage is the default
 * until a real visitor photo is uploaded through the app.
 */
function isVisitorPhoto(url) {
  return Boolean(
    url &&
    typeof url === 'string' &&
    supabaseUrl &&
    url.startsWith(supabaseUrl)
  )
}

/** Returns only visitor-uploaded (Supabase Storage) photos for a place. */
export function photosForPlace(place) {
  const p = place?.photos
  if (Array.isArray(p) && p.length > 0) return p.filter(isVisitorPhoto)
  return []
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

/** Pick a visitor photo by local time of day. */
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

function dedupePush(out, u) {
  if (u && typeof u === 'string' && !out.includes(u)) out.push(u)
}

/**
 * Ordered URLs to try — visitor-uploaded Supabase photos first (from both
 * place.photos and any experience_report photo_url values). Empty array
 * means PlaceImage falls through to the SVG PlaceholderImage.
 */
export function placeImageFallbackChain(place, visitorPhotoUrls = []) {
  const out = []
  for (const u of visitorPhotoUrls) dedupePush(out, u)
  if (out.length) return out
  const { url: primary } = photoForPlaceAtTime(place)
  const pool = photosForPlace(place)
  dedupePush(out, primary)
  for (const u of pool) dedupePush(out, u)
  return out
}

/** Single gallery URL — only passes through if it is a visitor Supabase photo. */
export function imageUrlFallbackChain(url) {
  const out = []
  if (isVisitorPhoto(url)) dedupePush(out, url)
  return out
}
