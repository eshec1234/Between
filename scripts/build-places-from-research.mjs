/**
 * One-off: merge Place Research/*.xlsx → SQL for places table.
 * Run: node scripts/build-places-from-research.mjs
 * Requires network for Nominatim (PA4/PA5 rows only).
 */
import XLSX from 'xlsx'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const RESEARCH_DIR = path.join(__dirname, 'place-research-import', 'Place Research')
const OUT_SQL = path.join(__dirname, '..', 'supabase', 'migrations', '011_replace_places_from_research.sql')

const DEFAULT_PHOTOS = [
  'https://images.unsplash.com/photo-1438032005730-c779502df39b?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1504052434569-70add5ae4832?auto=format&fit=crop&w=1400&q=80'
]

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
  if (!j?.[0]) return null
  return { lat: parseFloat(j[0].lat), lon: parseFloat(j[0].lon) }
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

    let lat = parseNum(getField(m, 'latitude', 'lat'))
    let lon = parseNum(getField(m, 'longitude', 'lng', 'lon'))
    const state = String(getField(m, 'state') || '')
      .trim()
      .toUpperCase()
    if (!['PA', 'NJ', 'NY'].includes(state)) continue
    if (lat == null || lon == null) continue

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

    const photos = photoUrl ? [photoUrl] : [...DEFAULT_PHOTOS]

    out.push({
      name,
      address,
      city,
      state,
      lat,
      lon,
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
      _source: sourceFile
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
    if (!prev || String(row.description).length > String(prev.description).length) {
      map.set(k, row)
    }
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

async function main() {
  const all = []
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

  // PA4 + PA5 (no lat/lon in sheet)
  const paPath = path.join(RESEARCH_DIR, 'PA4 and PA5.xlsx')
  const paWb = XLSX.readFile(paPath)
  const paPending = [...collectPa4Pa5(paWb, 'PA-4', 'PA4'), ...collectPa4Pa5(paWb, 'PA-5', 'PA5')]

  console.log('Standard rows (pre-dedupe):', all.length)
  console.log('PA4/PA5 pending geocode:', paPending.length)

  for (const p of paPending) {
    const query = p.addressLine.includes('PA') ? p.addressLine : `${p.addressLine}, PA`
    const g = await geocodeNominatim(query)
    await sleep(1100)
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
      photos: [...DEFAULT_PHOTOS],
      intensity: null,
      approach_tags: ['historic', 'tasteful'],
      _key: `${p.name.toLowerCase()}|${city.toLowerCase()}|PA`,
      _source: p._source
    })
  }

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
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
