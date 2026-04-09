/**
 * Fetches a primary (and optional second) image per place — same sources Google uses for place photos:
 * - Google Places API (New): text search + Place Photo media (needs GOOGLE_PLACES_API_KEY + billing).
 * - Fallbacks (no Google key): Wikidata P18 → Wikipedia pageimage → Commons file search.
 *
 * Outputs SQL you can run in Supabase SQL Editor (anon cannot UPDATE places).
 *
 * Usage:
 *   GOOGLE_PLACES_API_KEY=... VITE_SUPABASE_URL=... VITE_SUPABASE_ANON_KEY=... node scripts/fetch-place-photos.mjs
 *   node scripts/fetch-place-photos.mjs --limit=5 --dry-run
 *
 * @see https://developers.google.com/maps/documentation/places/web-service/place-photos
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_SQL = path.join(__dirname, '..', 'supabase', 'migrations', '012_update_place_photos_from_apis.sql')

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const limitArg = args.find((a) => a.startsWith('--limit='))
const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : null
const force = args.includes('--force')

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
const googleKey = process.env.GOOGLE_PLACES_API_KEY || ''

const PLACES_FIELD_MASK =
  'places.id,places.displayName,places.formattedAddress,places.location,places.photos'

function sqlStr(s) {
  if (s == null) return ''
  return String(s).replace(/'/g, "''")
}

function parsePoint(coords) {
  if (!coords) return null
  if (typeof coords === 'object' && coords.coordinates && Array.isArray(coords.coordinates)) {
    const [lng, lat] = coords.coordinates
    return { lat, lng }
  }
  return null
}

function distanceKm(a, b) {
  if (!a || !b) return 0
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * (2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)))
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

/** Follow Places Photo redirect; return final image URL (often lh3.googleusercontent.com). */
async function googlePlacePhotoMediaUrl(photoResourceName, maxWidthPx = 1400) {
  if (!googleKey || !photoResourceName) return null
  const u = `https://places.googleapis.com/v1/${photoResourceName}/media?maxWidthPx=${maxWidthPx}&key=${googleKey}`
  const res = await fetch(u, { redirect: 'follow' })
  if (!res.ok) return null
  const ct = res.headers.get('content-type') || ''
  if (ct.startsWith('image/')) {
    return res.url
  }
  return res.url
}

async function googleTextSearch(place) {
  if (!googleKey) return null
  const { name, address, city, state } = place
  const textQuery = [name, address, city, state].filter(Boolean).join(' ')
  const pt = parsePoint(place.coordinates)
  const body = {
    textQuery,
    languageCode: 'en',
    ...(pt
      ? {
          locationBias: {
            circle: {
              center: { latitude: pt.lat, longitude: pt.lng },
              radius: 80000
            }
          }
        }
      : {})
  }

  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': googleKey,
      'X-Goog-FieldMask': PLACES_FIELD_MASK
    },
    body: JSON.stringify(body)
  })
  if (!res.ok) {
    const t = await res.text()
    console.warn('Google searchText failed', res.status, t.slice(0, 200))
    return null
  }
  const data = await res.json()
  const places = data.places || []
  if (!places.length) return null

  let best = places[0]
  if (pt && places.length > 1) {
    for (const p of places) {
      const loc = p.location
      if (!loc) continue
      const d = distanceKm(pt, { lat: loc.latitude, lng: loc.longitude })
      const bd = distanceKm(pt, {
        lat: best.location?.latitude,
        lng: best.location?.longitude
      })
      if (d < bd) best = p
    }
    const loc = best.location
    if (loc && distanceKm(pt, { lat: loc.latitude, lng: loc.longitude }) > 85) {
      console.warn('Google match far from catalog coords, still using:', place.name)
    }
  }

  const photos = best.photos || []
  if (!photos.length) return null

  const urls = []
  for (const ph of photos.slice(0, 2)) {
    const url = await googlePlacePhotoMediaUrl(ph.name, 1400)
    if (url) urls.push(url)
    await sleep(120)
  }
  return urls.length ? urls : null
}

async function wikidataP18(name, city) {
  const search = `${name} ${city}`.slice(0, 300)
  const u = new URL('https://www.wikidata.org/w/api.php')
  u.searchParams.set('action', 'wbsearchentities')
  u.searchParams.set('search', search)
  u.searchParams.set('language', 'en')
  u.searchParams.set('limit', '5')
  u.searchParams.set('format', 'json')
  const res = await fetch(u)
  if (!res.ok) return null
  const data = await res.json()
  const hit = data.search?.[0]
  if (!hit) return null

  const u2 = new URL('https://www.wikidata.org/w/api.php')
  u2.searchParams.set('action', 'wbgetentities')
  u2.searchParams.set('ids', hit.id)
  u2.searchParams.set('format', 'json')
  u2.searchParams.set('props', 'claims')
  const r2 = await fetch(u2)
  if (!r2.ok) return null
  const ent = await r2.json()
  const claims = ent.entities?.[hit.id]?.claims?.P18
  if (!claims?.[0]?.mainsnak?.datavalue?.value) return null
  const filename = claims[0].mainsnak.datavalue.value
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}`
}

async function wikipediaThumb(name) {
  const u = new URL('https://en.wikipedia.org/w/api.php')
  u.searchParams.set('action', 'query')
  u.searchParams.set('titles', name.slice(0, 300))
  u.searchParams.set('prop', 'pageimages')
  u.searchParams.set('format', 'json')
  u.searchParams.set('pithumbsize', '1200')
  const res = await fetch(u)
  if (!res.ok) return null
  const data = await res.json()
  const pages = data.query?.pages
  if (!pages) return null
  const p = pages[Object.keys(pages)[0]]
  if (p?.missing) return null
  return p?.thumbnail?.source || null
}

async function commonsFileSearch(name, city) {
  const u = new URL('https://commons.wikimedia.org/w/api.php')
  u.searchParams.set('action', 'query')
  u.searchParams.set('generator', 'search')
  u.searchParams.set('gsrsearch', `${name} ${city}`.slice(0, 240))
  u.searchParams.set('gsrnamespace', '6')
  u.searchParams.set('prop', 'imageinfo')
  u.searchParams.set('iiprop', 'url')
  u.searchParams.set('iiurlwidth', '1400')
  u.searchParams.set('format', 'json')
  const res = await fetch(u)
  if (!res.ok) return null
  const data = await res.json()
  const pages = data.query?.pages
  if (!pages) return null
  const first = Object.values(pages)[0]
  const ii = first?.imageinfo?.[0]
  return ii?.url || ii?.thumburl || null
}

async function fallbackPhotos(place) {
  const { name, city } = place
  await sleep(200)
  let u = await wikidataP18(name, city)
  if (u) return [u]
  await sleep(150)
  u = await wikipediaThumb(name)
  if (u) return [u]
  await sleep(150)
  u = await commonsFileSearch(name, city)
  if (u) return [u]
  return null
}

function shouldSkip(place) {
  if (force) return false
  const p = place.photos
  if (!Array.isArray(p) || !p[0]) return false
  const s = String(p[0])
  if (s.includes('googleusercontent.com') || s.includes('lh3.google')) return true
  return false
}

async function resolvePhotosForPlace(place) {
  if (shouldSkip(place)) {
    console.log('skip (already Google):', place.name)
    return null
  }

  let urls = await googleTextSearch(place)
  if (urls?.length) {
    console.log('Google:', place.name, urls[0].slice(0, 80) + '…')
    return urls
  }
  await sleep(250)
  urls = await fallbackPhotos(place)
  if (urls?.length) {
    console.log('Wiki/Commons:', place.name, urls[0].slice(0, 80) + '…')
    return urls
  }
  console.warn('No image found:', place.name)
  return null
}

async function main() {
  if (!supabaseUrl || !supabaseKey) {
    console.error('Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or SUPABASE_*)')
    process.exit(1)
  }
  if (!googleKey) {
    console.warn('GOOGLE_PLACES_API_KEY not set — using Wikidata/Wikipedia/Commons only (less like Google).')
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  let q = supabase
    .from('places')
    .select('id, name, address, city, state, coordinates, photos')
    .order('state')
    .order('name')

  if (limit && Number.isFinite(limit)) {
    q = q.limit(limit)
  }

  const { data: places, error } = await q
  if (error) {
    console.error(error)
    process.exit(1)
  }
  if (!places?.length) {
    console.error('No places returned')
    process.exit(1)
  }

  console.log('Places to process:', places.length, dryRun ? '(dry-run)' : '')

  const updates = []
  for (const place of places) {
    if (dryRun) {
      console.log('[dry-run]', place.name, place.city, place.state)
      continue
    }
    const urls = await resolvePhotosForPlace(place)
    if (urls?.length) {
      updates.push({ id: place.id, urls })
    }
    await sleep(googleKey ? 400 : 300)
  }

  if (dryRun) {
    console.log('Dry run done.')
    return
  }

  const lines = [
    '-- Auto-generated by scripts/fetch-place-photos.mjs',
    '-- Run in Supabase SQL Editor. Requires Places Photos + Search billing if using Google URLs.',
    '-- Attribution: show "Google Maps" / Google attribution in the UI when using googleusercontent URLs (see PlaceDetail).',
    '',
    'BEGIN;',
    ''
  ]

  for (const { id, urls } of updates) {
    const arr = urls.map((u) => `'${sqlStr(u)}'`).join(', ')
    lines.push(`UPDATE places SET photos = ARRAY[${arr}]::TEXT[] WHERE id = '${id}';`)
  }

  lines.push('', 'COMMIT;', '')
  fs.writeFileSync(OUT_SQL, lines.join('\n'), 'utf8')
  console.log('Wrote', OUT_SQL, '—', updates.length, 'updates')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
