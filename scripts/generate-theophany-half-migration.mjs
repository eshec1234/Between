/**
 * Re-geocode the first ~50% of mode=theophany rows from 011 (alphabetical by name) via Nominatim,
 * with manual OSM overrides for places 015 clobbered (e.g. Sayre after 014).
 *
 * Run: node scripts/generate-theophany-half-migration.mjs
 * Output: supabase/migrations/019_regeocode_theophany_half_places.sql
 * Requires: network, ~1.1s * N between Nominatim calls.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const M011 = path.join(__dirname, '..', 'supabase', 'migrations', '011_replace_places_from_research.sql')
const OUT = path.join(__dirname, '..', 'supabase', 'migrations', '019_regeocode_theophany_half_places.sql')

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function sqlStr(s) {
  if (s == null) return ''
  return String(s)
    .replace(/\r\n|\r|\n/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/'/g, "''")
    .trim()
}

function parseQuotedField(line) {
  const t = line.trim()
  const m = t.match(/^'((?:''|[^'])*)'[,]?\s*$/)
  if (!m) return null
  return m[1].replace(/''/g, "'")
}

function parseM011() {
  const lines = fs.readFileSync(M011, 'utf8').split('\n')
  const theophany = []
  for (let i = 0; i < lines.length; i++) {
    if (lines[i] !== "    'theophany',") continue
    const name = parseQuotedField(lines[i - 5] ?? '')
    const address = parseQuotedField(lines[i - 4] ?? '')
    const city = parseQuotedField(lines[i - 3] ?? '')
    const state = parseQuotedField(lines[i - 2] ?? '')
    const mpt = (lines[i - 1] || '').match(/ST_MakePoint\((-?[0-9.]+),\s*([0-9.]+)\)/)
    if (!name || !address || !city || !['PA', 'NJ', 'NY'].includes(state) || !mpt) {
      continue
    }
    theophany.push({ name, address, city, state })
  }
  return theophany
}

const WEAK = /^(see local|unlisted|n\/a|unknown|tbd|various|none|\s*)$/i
function isWeakAddress(a) {
  const s = String(a || '').trim()
  if (!s || s.length < 4) return true
  if (WEAK.test(s) || /^see local listings?/i.test(s)) return true
  return false
}

/** Manual fixes: 014 Sayre, 018 Hotel; 015 bulk overwrote 014. */
const OVERRIDES = {
  "The Sayre Mansion|Bethlehem|PA|250 Wyandotte St": { lat: 40.6121251, lon: -75.3844551 },
  "Historic Hotel Bethlehem|Bethlehem|PA|437 Main St": { lat: 40.6201695, lon: -75.3824373 }
}

async function geocodeNominatim(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'BetweenApp-theophany-migration/1.0' }
  })
  if (!res.ok) return null
  const j = await res.json()
  if (!j?.[0]) return null
  return { lat: parseFloat(j[0].lat), lon: parseFloat(j[0].lon) }
}

async function geocodeRow(row) {
  const key = `${row.name}|${row.city}|${row.state}|${row.address}`
  if (OVERRIDES[key]) return OVERRIDES[key]

  if (!isWeakAddress(row.address)) {
    const p = new URLSearchParams({
      street: String(row.address).trim(),
      city: row.city,
      state: row.state,
      country: 'United States',
      countrycodes: 'us',
      format: 'json',
      limit: '1'
    })
    let g = await geocodeNominatim(
      `https://nominatim.openstreetmap.org/search?${p.toString()}`
    )
    await sleep(1100)
    if (g) return g
  }
  const q1 = `${row.address}, ${row.city}, ${row.state}, USA`
  let g2 = await geocodeNominatim(
    `https://nominatim.openstreetmap.org/search?${new URLSearchParams({ q: q1, format: 'json', limit: '1' }).toString()}`
  )
  await sleep(1100)
  if (g2) return g2

  const q2 = `${row.name}, ${row.city}, ${row.state}, USA`
  g2 = await geocodeNominatim(
    `https://nominatim.openstreetmap.org/search?${new URLSearchParams({ q: q2, format: 'json', limit: '1' }).toString()}`
  )
  await sleep(1100)
  return g2
}

function rowToUpdateSql(row) {
  return `UPDATE public.places SET coordinates = ST_SetSRID(ST_MakePoint(${row.lon}, ${row.lat}), 4326)::geography WHERE name = '${sqlStr(row.name)}' AND city = '${sqlStr(row.city)}' AND state = '${row.state}' AND address = '${sqlStr(row.address)}';`
}

async function main() {
  const all = parseM011()
  const sorted = [...all].sort((a, b) => a.name.localeCompare(b.name, 'en'))
  const n = Math.ceil(sorted.length / 2)
  let slice = sorted.slice(0, n)
  const keys = (r) => `${r.name}|${r.city}|${r.state}|${r.address}`

  const inSlice = new Set(slice.map(keys))
  for (const o of [
    { name: 'The Sayre Mansion', address: '250 Wyandotte St', city: 'Bethlehem', state: 'PA' },
    { name: 'Historic Hotel Bethlehem', address: '437 Main St', city: 'Bethlehem', state: 'PA' }
  ]) {
    if (!inSlice.has(keys(o))) {
      slice.push(o)
    }
  }
  slice = slice.filter((r, i, a) => a.findIndex((x) => keys(x) === keys(r)) === i)

  console.log('theophany total in 011:', all.length, '| batch size:', slice.length)

  const updates = []
  for (const row of slice) {
    const g = await geocodeRow(row)
    if (!g) {
      console.warn('Geocode miss:', row.name, row.city)
      continue
    }
    updates.push({ ...row, lat: g.lat, lon: g.lon })
  }

  const header = `-- Auto-generated: node scripts/generate-theophany-half-migration.mjs
-- First half of theophany (by name) + required overrides (Sayre, Historic Hotel) if not in that half.
-- 015 re-geocoding clobbered 014 (Sayre); this restores vetted + fresh Nominatim.
BEGIN;

${updates.map(rowToUpdateSql).join('\n')}

COMMIT;
`
  fs.writeFileSync(OUT, header, 'utf8')
  console.log('Wrote', OUT, 'updates:', updates.length)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
