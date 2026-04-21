import { supabaseUrl } from './env'

/**
 * Only photos that live in this project's Supabase Storage bucket are
 * considered "user-uploaded" and shown as real images. All seeded external
 * URLs (Unsplash, Wikimedia, Flickr, Wikipedia, etc.) are intentionally
 * ignored so that the SVG placeholder templates are the default display —
 * a real photo only appears once a user has uploaded one through the app.
 */
function isUserPhoto(url) {
  return Boolean(
    url &&
    typeof url === 'string' &&
    supabaseUrl &&
    url.startsWith(supabaseUrl)
  )
}

/** Generic fallbacks — intentionally empty; SVG templates are the default. */
export const DEFAULT_PLACE_PHOTOS = []

export function photosForPlace(place) {
  const p = place?.photos
  if (Array.isArray(p) && p.length > 0) return p.filter(isUserPhoto)
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

/**
 * Pick a user-uploaded photo by local time of day.
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

function dedupePush(out, u) {
  if (u && typeof u === 'string' && !out.includes(u)) out.push(u)
}

/** Ordered URLs to try — only user-uploaded Supabase photos; empty → SVG renders. */
export function placeImageFallbackChain(place) {
  const { url: primary } = photoForPlaceAtTime(place)
  const pool = photosForPlace(place)
  const out = []
  dedupePush(out, primary)
  for (const u of pool) dedupePush(out, u)
  return out
}

/** Single gallery URL — only passes through if it is a user-uploaded Supabase photo. */
export function imageUrlFallbackChain(url) {
  const out = []
  if (isUserPhoto(url)) dedupePush(out, url)
  return out
}
