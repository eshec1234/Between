/**
 * One-off: merge Place Research/*.xlsx → SQL for places table.
 * Run: node scripts/build-places-from-research.mjs
 * Optional: node scripts/build-places-from-research.mjs --write-update-migration
 *   → also writes 015_regeocode_places_coordinates.sql (UPDATEs for existing DBs)
 * Requires network for Nominatim (all standard rows + PA4/PA5). ~1.1s between requests.
 */
import XLSX from 'xlsx'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const RESEARCH_DIR = path.join(__dirname, 'place-research-import', 'Place Research')
const OUT_SQL = path.join(__dirname, '..', 'supabase', 'migrations', '011_replace_places_from_research.sql')
const UPDATE_MIGRATION_SQL = path.join(
  __dirname,
  '..',
  'supabase',
  'migrations',
  '015_regeocode_places_coordinates.sql'
)
const GEO_CACHE_PATH = path.join(__dirname, 'pa-geocode-cache.json')
const WRITE_UPDATE_MIGRATION = process.argv.includes('--write-update-migration')

function loadGeoCache() {
  try {
    return JSON.parse(fs.readFileSync(GEO_CACHE_PATH, 'utf8'))
  } catch {
    return {}
  }
}

function saveGeoCache(cache) {
  fs.writeFileSync(GEO_CACHE_PATH, JSON.stringify(cache, null, 2), 'utf8')
}

/** Diverse stock images (Unsplash) — two per place chosen by hash so lists don’t all look identical. */
const FALLBACK_PHOTO_POOL = [
  'https://images.unsplash.com/photo-1438032005730-c779502df39b?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1504052434569-70add5ae4832?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1548625149-fc4a29d70959?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1478147427282-58a87a120781?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1511818966892-d7d671c67e2b?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1501785884341-85fb45bd7d93?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1518173946689-a252907891f2?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1518709268805-4e9042af2176?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1493246507139-2e8e07d7e8e7?auto=format&fit=crop&w=1400&q=80'
]

function hashPick(str, mod) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0
  return Math.abs(h) % mod
}

/**
 * Turn Wikimedia Commons / Wikipedia file links into a URL that resolves to an image (Special:FilePath).
 */
function normalizePhotoUrl(raw) {
  if (raw == null || raw === '') return null
  let s = String(raw).trim()
  if (!/^https?:\/\//i.test(s)) return null
  s = s.split('#')[0]
  if (/upload\.wikimedia\.org/i.test(s)) return s.split('?')[0]
  // commons File: page → direct file path (redirects to upload.*)
  const m1 = s.match(/commons\.wikimedia\.org\/wiki\/File:([^?#]+)/i)
  if (m1) {
    const fn = decodeURIComponent(m1[1].replace(/_/g, ' '))
    return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fn.replace(/ /g, '_'))}`
  }
  // #/media/File:... or /wiki/File:
  const m2 = s.match(/File:([^?#&]+)/i)
  if (m2 && /wikimedia\.org|wikipedia\.org/i.test(s)) {
    const fn = decodeURIComponent(m2[1].replace(/_/g, ' '))
    return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fn.replace(/ /g, '_'))}`
  }
  if (/commons\.wikimedia\.org\/wiki\/Special:FilePath\//i.test(s)) return s.split('?')[0]
  if (/images\.unsplash\.com|unsplash\.com\/photo/i.test(s)) return s
  return s
}

function pickFallbackPair(name, city, state) {
  const key = `${name}|${city}|${state}`
  const n = FALLBACK_PHOTO_POOL.length
  const a = hashPick(key, n)
  let b = (a + 7 + hashPick(`${key}2`, Math.max(1, n - 1))) % n
  if (b === a) b = (a + 1) % n
  return [FALLBACK_PHOTO_POOL[a], FALLBACK_PHOTO_POOL[b]]
}

/** Build 1–2 photo URLs: prefer real link from sheet; pair with a second (fallback or pool). */
function resolvePhotos(rawPhotoUrl, name, city, state) {
  const primary = normalizePhotoUrl(rawPhotoUrl)
  const [f1, f2] = pickFallbackPair(name, city, state)
  if (primary) {
    const second = primary === f1 ? f2 : f1
    return [primary, second]
  }
  return [f1, f2]
}

function rowPhotoScore(row) {
  const raw = row._photoRaw
  if (raw && String(raw).trim()) return 2
  return 0
}

function sqlStr(s) {
  if (s == null) return ''
  return String(s)
    .replace(/\r\n|\r|\n/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/'/g, "''")
    .trim()
}

function normKey(k) {
  return String(k || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
}

/** @returns {Record<string, string>} */
function rowToMap(row, headers) {
  const m = {}
  if (Array.isArray(row)) {
    headers.forEach((h, i) => {
      const key = normKey(h)
      if (key) m[key] = row[i]
    })
    return m
  }
  for (const [k, v] of Object.entries(row)) {
    m[normKey(k)] = v
  }
  return m
}

function getField(m, ...keys) {
  for (const k of keys) {
    const v = m[normKey(k)]
    if (v !== undefined && v !== null && String(v).trim() !== '') return v
  }
  return ''
}

function parseTags(raw) {
  const s = String(raw || '').trim()
  if (!s) return []
  return s
    .split(/[,;]/)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 12)
}

function parseNum(v) {
  if (v === '' || v == null) return null
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/,/g, ''))
  return Number.isFinite(n) ? n : null
}

function normalizeMode(m) {
  const x = String(m || '')
    .trim()
    .toLowerCase()
  if (['sanctuary', 'theophany', 'both'].includes(x)) return x
  return 'both'
}

function normalizeSource(s) {
  const x = String(s || '')
    .trim()
    .toLowerCase()
  if (x === 'community') return 'community'
  return 'verified'
}

function approachFromTags(tags) {
  if (!tags.length) return ['tasteful', 'quiet']
  const t = tags.map((x) => x.toLowerCase())
  const out = []
  for (const w of ['historic', 'quiet', 'tasteful', 'respectful', 'nature']) {
    if (t.some((tag) => tag.includes(w))) out.push(w)
  }
  if (out.length < 2) out.push('tasteful', 'quiet')
  return [...new Set(out)].slice(0, 4)
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function nominatimFirstHit(json) {
  if (!json?.[0]) return null
  return { lat: parseFloat(json[0].lat), lon: parseFloat(json[0].lon) }
}

async function geocodeNominatim(query) {
  const q = encodeURIComponent(query)
  const url = `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'BetweenApp-places-import/1.0'
    }
  })
  if (!res.ok) return null
  const j = await res.json()
  return nominatimFirstHit(j)
}

/**
 * Nominatim structured search (no q=) — often matches street addresses the free-form query misses.
 */
async function geocodeNominatimStructuredAddress(row) {
  if (isWeakAddress(row.address)) return null
  const params = new URLSearchParams({
    street: String(row.address).trim(),
    city: row.city,
    state: row.state,
    country: 'United States',
    countrycodes: 'us',
    format: 'json',
    limit: '1'
  })
  const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'BetweenApp-places-import/1.0'
    }
  })
  if (!res.ok) return null
  const j = await res.json()
  return nominatimFirstHit(j)
}

const WEAK_ADDRESS = /^(see local|unlisted|n\/a|unknown|tbd|various|none|\s*)$/i

function isWeakAddress(addr) {
  const s = String(addr || '').trim()
  if (!s || s.length < 4) return true
  if (WEAK_ADDRESS.test(s)) return true
  if (/^see local listings?/i.test(s)) return true
  return false
}

function addressFirstQuery(row) {
  if (isWeakAddress(row.address)) return null
  return `${row.address}, ${row.city}, ${row.state}, USA`
}

function nameFallbackQuery(row) {
  return `${row.name}, ${row.city}, ${row.state}, USA`
}

/**
 * Nominatim (address, then name+place, then spreadsheet) — sheet lat/lon is untrusted.
 */
async function geocodeStandardRow(row, geoCache) {
  let g = null
  if (!isWeakAddress(row.address)) {
    const sk = `struct|${String(row.address).trim()}|${row.city}|${row.state}`
    g = geoCache[sk]
    if (!g) {
      g = await geocodeNominatimStructuredAddress(row)
      await sleep(1100)
      if (g) geoCache[sk] = g
    }
  }
  if (g) return g

  const q1 = addressFirstQuery(row)
  if (q1) {
    g = geoCache[q1]
    if (!g) {
      g = await geocodeNominatim(q1)
      await sleep(1100)
      if (g) geoCache[q1] = g
    }
  }
  if (!g) {
    const q2 = nameFallbackQuery(row)
    g = geoCache[q2]
    if (!g) {
      g = await geocodeNominatim(q2)
      await sleep(1100)
      if (g) geoCache[q2] = g
    }
  }
  if (!g && row._sheetLat != null && row._sheetLon != null) {
    console.warn('Using spreadsheet coords (Nominatim miss):', row.name, row.city)
    g = { lat: row._sheetLat, lon: row._sheetLon }
  }
  return g
}

function collectStandardSheet(wb, sheetName, sourceFile) {
  const ws = wb.Sheets[sheetName]
  if (!ws) return []
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
  if (data.length < 2) return []
  const headers = data[0].map((h) => String(h || '').trim())
  const hjoin = headers.join('|').toLowerCase()
  if (!hjoin.includes('name') || !hjoin.includes('latitude')) return []

  const out = []
  for (let r = 1; r < data.length; r++) {
    const m = rowToMap(data[r], headers)
    const name = String(getField(m, 'name') || '').trim()
    if (!name) continue

    const sheetLat = parseNum(getField(m, 'latitude', 'lat'))
    const sheetLon = parseNum(getField(m, 'longitude', 'lng', 'lon'))
    const state = String(getField(m, 'state') || '')
      .trim()
      .toUpperCase()
    if (!['PA', 'NJ', 'NY'].includes(state)) continue

    const city = String(getField(m, 'city') || '').trim() || 'Unknown'
    const address = String(getField(m, 'address', 'location') || '').trim() || 'See local listings'
    const mode = normalizeMode(getField(m, 'mode'))
    const tags = parseTags(getField(m, 'category_tags', 'tags'))
    const description = String(getField(m, 'description') || '').trim()
    if (!description) continue

    const traditions = String(getField(m, 'traditions') || '').trim()
    let cultural = String(getField(m, 'cultural_sensitivities') || '').trim()
    const indigenous = String(getField(m, 'indigenous_flag') || '').trim()
    if (/^(yes|true|1)$/i.test(indigenous) && cultural && !/indigenous/i.test(cultural)) {
      cultural = `Indigenous context: ${cultural}`
    } else if (/^(yes|true|1)$/i.test(indigenous) && !cultural) {
      cultural = 'Indigenous lands or sacred context may apply; visit with respect.'
    }

    const access = String(getField(m, 'access_protocols', 'access') || '').trim()
    const source = normalizeSource(getField(m, 'source', 'data_source'))

    let photoUrl = String(
      getField(m, 'photo_url', 'photo', 'picture_links', 'picture links') || ''
    ).trim()
    if (photoUrl && !/^https?:\/\//i.test(photoUrl)) {
      photoUrl = ''
    }

    const photos = resolvePhotos(photoUrl, name, city, state)

    out.push({
      name,
      address,
      city,
      state,
      lat: null,
      lon: null,
      _sheetLat: sheetLat,
      _sheetLon: sheetLon,
      _fromStandard: true,
      mode,
      category_tags: tags,
      traditions: traditions || 'Various / see description',
      cultural_sensitivities: cultural || 'Visit respectfully; follow posted rules.',
      access_protocols: access || 'Check official hours before visiting.',
      source,
      description,
      photos,
      intensity: null,
      approach_tags: approachFromTags(tags),
      _key: `${name.toLowerCase()}|${city.toLowerCase()}|${state}`,
      _source: sourceFile,
      _photoRaw: photoUrl
    })
  }
  return out
}

function collectPa4Pa5(wb, sheetName, sourceFile) {
  const ws = wb.Sheets[sheetName]
  if (!ws) return []
  const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
  if (data.length < 2) return []
  const out = []
  for (let r = 1; r < data.length; r++) {
    const row = data[r]
    const county = String(row[0] || '').trim()
    const name = String(row[1] || '').trim()
    const addr = String(row[2] || '').trim()
    if (!name || !addr) continue
    out.push({
      county,
      name,
      addressLine: addr,
      _source: sourceFile,
      _sheet: sheetName
    })
  }
  return out
}

function dedupePlaces(rows) {
  const map = new Map()
  for (const row of rows) {
    const k = row._key
    const prev = map.get(k)
    if (!prev) {
      map.set(k, row)
      continue
    }
    const score = (r) => rowPhotoScore(r) * 1_000_000 + String(r.description).length
    if (score(row) > score(prev)) map.set(k, row)
  }
  return [...map.values()].sort((a, b) => a.state.localeCompare(b.state) || a.city.localeCompare(b.city) || a.name.localeCompare(b.name))
}

function rowToSqlValues(row) {
  const tags = row.category_tags.length
    ? `ARRAY[${row.category_tags.map((t) => `'${sqlStr(t)}'`).join(', ')}]::TEXT[]`
    : `ARRAY[]::TEXT[]`
  const photos = `ARRAY[${row.photos.map((p) => `'${sqlStr(p)}'`).join(', ')}]::TEXT[]`
  const approach = `ARRAY[${row.approach_tags.map((t) => `'${sqlStr(t)}'`).join(', ')}]::TEXT[]`
  const intensity = row.intensity == null ? 'NULL::INTEGER' : String(row.intensity)

  return `  (
    '${sqlStr(row.name)}',
    '${sqlStr(row.address)}',
    '${sqlStr(row.city)}',
    '${row.state}',
    ST_SetSRID(ST_MakePoint(${row.lon}, ${row.lat}), 4326)::geography,
    '${row.mode}',
    ${tags},
    '${sqlStr(row.traditions)}',
    '${sqlStr(row.cultural_sensitivities)}',
    '${sqlStr(row.access_protocols)}',
    '${row.source}',
    '${sqlStr(row.description)}',
    ${photos},
    ${intensity},
    ${approach}
  )`
}

function rowToUpdateSql(row) {
  return `UPDATE places SET coordinates = ST_SetSRID(ST_MakePoint(${row.lon}, ${row.lat}), 4326)::geography WHERE name = '${sqlStr(row.name)}' AND city = '${sqlStr(row.city)}' AND state = '${row.state}' AND address = '${sqlStr(row.address)}';`
}

async function main() {
  let all = []
  const files = fs.readdirSync(RESEARCH_DIR).filter((f) => f.endsWith('.xlsx') && !f.startsWith('~$'))

  for (const fn of files) {
    if (fn === 'PA4 and PA5.xlsx') continue
    const fp = path.join(RESEARCH_DIR, fn)
    let wb
    try {
      wb = XLSX.readFile(fp)
    } catch {
      continue
    }
    for (const sheetName of wb.SheetNames) {
      const standard = collectStandardSheet(wb, sheetName, `${fn}::${sheetName}`)
      all.push(...standard)
    }
  }

  console.log('Standard rows (pre-geocode):', all.length)

  const geoCache = loadGeoCache()
  const afterStandard = []
  for (const row of all) {
    const g = await geocodeStandardRow(row, geoCache)
    if (!g) {
      console.warn('Geocode failed (skipping place):', row.name, row.city, row.state)
      continue
    }
    row.lat = g.lat
    row.lon = g.lon
    delete row._fromStandard
    delete row._sheetLat
    delete row._sheetLon
    afterStandard.push(row)
  }
  all = afterStandard

  // PA4 + PA5 (no lat/lon in sheet)
  const paPath = path.join(RESEARCH_DIR, 'PA4 and PA5.xlsx')
  const paWb = XLSX.readFile(paPath)
  const paPending = [...collectPa4Pa5(paWb, 'PA-4', 'PA4'), ...collectPa4Pa5(paWb, 'PA-5', 'PA5')]

  console.log('Standard rows (after geocode, pre-PA4):', all.length)
  console.log('PA4/PA5 pending geocode:', paPending.length)
  for (const p of paPending) {
    const query = p.addressLine.includes('PA') ? p.addressLine : `${p.addressLine}, PA`
    let g = geoCache[query]
    if (!g) {
      g = await geocodeNominatim(query)
      await sleep(1100)
      if (g) geoCache[query] = g
    }
    if (!g) {
      console.warn('Geocode failed:', p.name, query)
      continue
    }
    const m = p.addressLine.match(/,\s*([^,]+),\s*PA\s*(\d{5})/i)
    const city = m ? m[1].trim() : p.county || 'Unknown'
    all.push({
      name: p.name,
      address: p.addressLine.split(',')[0]?.trim() || p.addressLine,
      city,
      state: 'PA',
      lat: g.lat,
      lon: g.lon,
      mode: 'both',
      category_tags: ['historic', 'pennsylvania', p.county.toLowerCase()].filter(Boolean),
      traditions: 'Various / see description',
      cultural_sensitivities: 'Visit respectfully; follow posted rules.',
      access_protocols: 'Confirm hours and access before visiting.',
      source: 'verified',
      description: `${p.name} (${p.county} County, PA). Listed in regional research; atmosphere and access vary by site—check local guidance before going.`,
      photos: resolvePhotos('', p.name, city, 'PA'),
      intensity: null,
      approach_tags: ['historic', 'tasteful'],
      _key: `${p.name.toLowerCase()}|${city.toLowerCase()}|PA`,
      _source: p._source
    })
  }

  saveGeoCache(geoCache)

  const unique = dedupePlaces(all)
  console.log('Unique places:', unique.length)

  const values = unique.map(rowToSqlValues).join(',\n')

  const header = `-- Generated by scripts/build-places-from-research.mjs — do not hand-edit rows.
-- Replaces all rows in \`places\` (clears dependent experience_reports via CASCADE).

DELETE FROM places;

INSERT INTO places (
  name,
  address,
  city,
  state,
  coordinates,
  mode,
  category_tags,
  traditions,
  cultural_sensitivities,
  access_protocols,
  source,
  description,
  photos,
  intensity,
  approach_tags
)
VALUES
${values};

`

  fs.writeFileSync(OUT_SQL, header, 'utf8')
  console.log('Wrote', OUT_SQL)

  if (WRITE_UPDATE_MIGRATION) {
    const upHeader = `-- Generated by: node scripts/build-places-from-research.mjs --write-update-migration
-- Nominatim-reconciled coordinates; matches rows by name, city, state, address.
BEGIN;

${unique.map(rowToUpdateSql).join('\n')}

COMMIT;
`
    fs.writeFileSync(UPDATE_MIGRATION_SQL, upHeader, 'utf8')
    console.log('Wrote', UPDATE_MIGRATION_SQL)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
