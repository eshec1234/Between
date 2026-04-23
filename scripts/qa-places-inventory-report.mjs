/**
 * QA inventory: cross-referenced action queue vs excluded edge cases.
 *
 * Default output emphasizes rows that can break user trust (copy vs map pin).
 * Orphans (home-feed rules), known same-site coordinate pairs, routine seed drift,
 * and generic duplicate cemetery names are summarized separately—not mixed into defects.
 *
 * Usage:
 *   npm run qa:places-inventory
 *   node scripts/qa-places-inventory-report.mjs --csv docs/places.csv
 *   node scripts/qa-places-inventory-report.mjs --csv docs/places.csv --tags-csv docs/audit.csv
 *   node scripts/qa-places-inventory-report.mjs --verbose
 *
 * Main CSV: id, name, address, city, state, mode, lat, lng
 * Tags CSV (export_places_for_qa_audit.sql): + category_tags (|) + traditions
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.join(__dirname, '..')
const DEFAULT_CSV = path.join(
  REPO_ROOT,
  'docs',
  'Supabase Snippet Places Export with Lat_Lng Coordinates.csv'
)
const SEED_SQL = path.join(REPO_ROOT, 'supabase', 'migrations', '011_replace_places_from_research.sql')

/** Pairs that legitimately share one pin (campus / dual listing). Excluded from “duplicate coords” action queue. */
const KNOWN_SAME_SITE_COORDS = [
  ['Harmonist Labyrinth', 'Harmony Society Cemetery'],
  ['Hans Herr House (Cemetery)', 'Hans Herr House (Longhouse)']
]

/** Same display name, different real sites — common for cemeteries / road segments; not surfaced as card confusion. */
const DUPLICATE_NAME_EXCLUDE = new Set([
  'Shades of Death Road',
  'Gurnsey Hollow Cemetery',
  'Machpelah Cemetery',
  'Hollenbeck Cemetery',
  'Mount Hope Cemetery'
])

function parseArgs(argv) {
  let csv = DEFAULT_CSV
  let tagsCsv = null
  let verbose = false
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--csv' && argv[i + 1]) {
      csv = path.resolve(REPO_ROOT, argv[++i])
    } else if (argv[i] === '--tags-csv' && argv[i + 1]) {
      tagsCsv = path.resolve(REPO_ROOT, argv[++i])
    } else if (argv[i] === '--verbose') {
      verbose = true
    }
  }
  return { csv, tagsCsv, verbose }
}

function parseCSVText(text) {
  const rows = []
  let row = []
  let cur = ''
  let inQuote = false
  const s = text.replace(/^\uFEFF/, '')
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (inQuote) {
      if (c === '"') {
        if (s[i + 1] === '"') {
          cur += '"'
          i++
        } else inQuote = false
      } else cur += c
    } else {
      if (c === '"') inQuote = true
      else if (c === ',') {
        row.push(cur)
        cur = ''
      } else if (c === '\n' || (c === '\r' && s[i + 1] === '\n')) {
        if (c === '\r') i++
        row.push(cur)
        rows.push(row)
        row = []
        cur = ''
      } else if (c !== '\r') cur += c
    }
  }
  if (cur.length || row.length) {
    row.push(cur)
    rows.push(row)
  }
  return rows
}

function tableToObjects(table) {
  if (!table.length) return []
  const header = table[0].map((h) => h.trim())
  const idx = Object.fromEntries(header.map((h, j) => [h, j]))
  const need = ['id', 'name', 'address', 'city', 'state', 'mode', 'lat', 'lng']
  for (const k of need) {
    if (idx[k] === undefined) throw new Error(`CSV missing column: ${k}`)
  }
  const out = []
  for (let r = 1; r < table.length; r++) {
    const row = table[r]
    if (!row || row.every((c) => c === '' || c == null)) continue
    const id = row[idx.id]?.trim()
    const name = row[idx.name]?.trim()
    if (!id || !name) continue
    out.push({
      id,
      name,
      address: row[idx.address] ?? '',
      city: row[idx.city] ?? '',
      state: row[idx.state] ?? '',
      mode: row[idx.mode] ?? '',
      lat: Number(row[idx.lat]),
      lng: Number(row[idx.lng]),
      category_tags: idx.category_tags != null ? row[idx.category_tags] : '',
      traditions: idx.traditions != null ? row[idx.traditions] : ''
    })
  }
  return out
}

function dedupeById(places) {
  const m = new Map()
  let duplicateRows = 0
  for (const p of places) {
    if (m.has(p.id)) duplicateRows++
    m.set(p.id, p)
  }
  return { list: [...m.values()], duplicateRows }
}

function parseQuotedLine(line) {
  const t = line.trim()
  const m = t.match(/^'((?:[^']|'')*)',?\s*$/)
  return m ? m[1].replace(/''/g, "'") : null
}

function parseArrayLine(line) {
  const t = line.trim()
  const m = t.match(/^ARRAY\[(.*)\]::TEXT\[\],?\s*$/)
  if (!m) return []
  const parts = []
  let cur = ''
  let q = false
  for (let i = 0; i < m[1].length; i++) {
    const c = m[1][i]
    if (c === "'" && m[1][i + 1] === "'") {
      cur += "'"
      i++
      continue
    }
    if (c === "'") {
      q = !q
      continue
    }
    if (!q && c === ',') {
      parts.push(cur.trim())
      cur = ''
    } else cur += c
  }
  if (cur.trim()) parts.push(cur.trim())
  return parts.filter(Boolean)
}

function loadSeedTagsByKey() {
  const sql = fs.readFileSync(SEED_SQL, 'utf8')
  const lines = sql.split('\n')
  const map = new Map()
  for (let i = 0; i < lines.length; i++) {
    if (!/ST_MakePoint/.test(lines[i])) continue
    const state = parseQuotedLine(lines[i - 1])
    const city = parseQuotedLine(lines[i - 2])
    const name = parseQuotedLine(lines[i - 4])
    const category_tags = parseArrayLine(lines[i + 2] || '')
    const traditions = parseQuotedLine(lines[i + 3] || '') || ''
    if (!name) continue
    map.set(`${name}\t${city}\t${state}`, { category_tags, traditions })
  }
  return map
}

function haystackFromTags(name, category_tags, traditions) {
  const tags = Array.isArray(category_tags) ? category_tags : []
  const tr = traditions || ''
  return [...tags, tr, name].join(' ').toLowerCase()
}

const MEM = [
  'cemetery',
  'graveyard',
  'memorial',
  'battlefield',
  'civil war',
  'national cemetery',
  'memorial park',
  'grave',
  'mourning',
  'fallen',
  'veterans',
  'mausoleum',
  'crypt',
  'interment',
  'burial',
  'tomb',
  'cenotaph'
]

const CHURCH = [
  ' church',
  'churches',
  'church,',
  'chapel',
  'cathedral',
  'basilica',
  'baptist',
  'lutheran',
  'methodist',
  'presbyterian',
  'episcopal',
  'anglican',
  'catholic',
  'congregation',
  'mormon',
  'latter-day',
  'narthex',
  'rectory',
  'steeple',
  'nave',
  'liturg',
  'sermon',
  'eucharist',
  'benediction',
  "god's house",
  'holy trinity',
  "st. peter's",
  "saint peter's",
  'gospel'
]

const PLANTATION = [
  'plantation',
  'antebellum plantation',
  'enslaved labor',
  "slave's quarters",
  'slaves,',
  "slave' ",
  "slave's"
]

function placeReadsAsMemorialOrCemetery(hay) {
  return MEM.some((m) => hay.includes(m))
}

function placeReadsAsChurchWorship(hay) {
  return CHURCH.some((m) => hay.includes(m.trim().toLowerCase()))
}

function placeReadsAsPlantation(hay) {
  return PLANTATION.some((m) => hay.includes(m))
}

function placeAppearsInSanctuaryHome(p, hay) {
  if (placeReadsAsMemorialOrCemetery(hay)) return false
  if (placeReadsAsPlantation(hay)) return false
  if (p.mode === 'sanctuary') return true
  if (p.mode === 'theophany' || p.mode === 'both') {
    if (placeReadsAsChurchWorship(hay)) return true
  }
  return false
}

function placeAppearsInTheophanyHome(p, hay) {
  if (placeReadsAsChurchWorship(hay)) return false
  if (p.mode === 'theophany') return true
  if (p.mode === 'both' && !placeReadsAsChurchWorship(hay)) return true
  if (p.mode === 'sanctuary' && placeReadsAsPlantation(hay)) return true
  return false
}

function crossrefTags(p, tagById, seedByKey) {
  if (tagById.has(p.id)) return 'tags:export'
  if (seedByKey.has(`${p.name}\t${p.city}\t${p.state}`)) return 'tags:seed011'
  return 'tags:none(seed_miss)'
}

function sameSitePair(names) {
  const set = new Set(names)
  for (const [a, b] of KNOWN_SAME_SITE_COORDS) {
    if (set.has(a) && set.has(b)) return true
  }
  return false
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(x)))
}

function main() {
  const { csv, tagsCsv, verbose } = parseArgs(process.argv)

  if (!fs.existsSync(csv)) {
    console.error('CSV not found:', csv)
    process.exit(1)
  }

  const rawPlaces = tableToObjects(parseCSVText(fs.readFileSync(csv, 'utf8')))
  const { list: places, duplicateRows } = dedupeById(rawPlaces)

  const tagById = new Map()
  if (tagsCsv && fs.existsSync(tagsCsv)) {
    const tagged = tableToObjects(parseCSVText(fs.readFileSync(tagsCsv, 'utf8')))
    for (const row of tagged) {
      const tags = row.category_tags
        ? String(row.category_tags)
            .split('|')
            .map((t) => t.trim())
            .filter(Boolean)
        : []
      tagById.set(row.id, { category_tags: tags, traditions: row.traditions || '' })
    }
  }

  const seedByKey = loadSeedTagsByKey()

  function hayFor(p) {
    const live = tagById.get(p.id)
    if (live) return haystackFromTags(p.name, live.category_tags, live.traditions)
    const seed = seedByKey.get(`${p.name}\t${p.city}\t${p.state}`)
    if (seed) return haystackFromTags(p.name, seed.category_tags, seed.traditions)
    return haystackFromTags(p.name, [], '')
  }

  const noSeed = places.filter((p) => !seedByKey.has(`${p.name}\t${p.city}\t${p.state}`))

  const orphans = []
  const sHome = []
  const tHome = []
  for (const p of places) {
    const hay = hayFor(p)
    const s = placeAppearsInSanctuaryHome(p, hay)
    const t = placeAppearsInTheophanyHome(p, hay)
    if (s) sHome.push(p)
    if (t) tHome.push(p)
    if (!s && !t) orphans.push(p)
  }

  const bad = places.filter(
    (p) =>
      !Number.isFinite(p.lat) ||
      !Number.isFinite(p.lng) ||
      p.lat < -90 ||
      p.lat > 90 ||
      p.lng < -180 ||
      p.lng > 180
  )

  const byName = new Map()
  for (const p of places) {
    if (!byName.has(p.name)) byName.set(p.name, [])
    byName.get(p.name).push(p)
  }
  const dupNames = [...byName.entries()].filter(([, arr]) => arr.length > 1)

  const byCoord = new Map()
  for (const p of places) {
    const k = `${p.lng.toFixed(5)},${p.lat.toFixed(5)}`
    if (!byCoord.has(k)) byCoord.set(k, [])
    byCoord.get(k).push(p)
  }
  const dupCoords = [...byCoord.entries()].filter(([, arr]) => arr.length > 1)

  const TRISTATE = new Set(['PA', 'NJ', 'NY'])
  const susCopy = places.filter((p) => {
    if (/court house|^c\.m\./i.test(p.city)) return true
    if (p.city !== p.city.trim()) return true
    if (/\bn\/a\b/i.test(String(p.address).toLowerCase())) return true
    if (/^\s*the dangerous\b/i.test(p.name)) return true
    if (TRISTATE.has(p.state) && Number.isFinite(p.lng) && p.lng > 0) return true
    return false
  })

  /** ------- Action queue (cross-referenced) ------- */
  const actions = []

  for (const p of bad) {
    actions.push({
      severity: 'critical',
      id: p.id,
      name: p.name,
      city: p.city,
      state: p.state,
      lat: p.lat,
      lng: p.lng,
      issue: 'invalid_lat_lng',
      fix: 'Fix coordinates in DB or remove row.',
      crossref: crossrefTags(p, tagById, seedByKey)
    })
  }

  for (const p of susCopy) {
    if (bad.includes(p)) continue
    const bits = []
    if (/court house|^c\.m\./i.test(p.city)) bits.push('city_not_a_municipality')
    if (p.city !== p.city.trim()) bits.push('city_whitespace')
    if (/\bn\/a\b/i.test(String(p.address).toLowerCase())) bits.push('address_na')
    if (/^\s*the dangerous\b/i.test(p.name)) bits.push('sensational_name')
    if (TRISTATE.has(p.state) && Number.isFinite(p.lng) && p.lng > 0) {
      bits.push('lng_positive_tristate_likely_missing_minus')
    }
    actions.push({
      severity: 'major',
      id: p.id,
      name: p.name,
      city: p.city,
      state: p.state,
      lat: p.lat,
      lng: p.lng,
      issue: bits.join('+'),
      fix: 'Normalize city/address/name to match authoritative listing; re-geocode if address changes.',
      crossref: crossrefTags(p, tagById, seedByKey)
    })
  }

  for (const [name, arr] of dupNames) {
    if (DUPLICATE_NAME_EXCLUDE.has(name)) continue
    if (name === "St. Mark's Church in-the-Bowery") {
      actions.push({
        severity: 'major',
        id: arr.map((x) => x.id).join(' | '),
        name,
        city: arr.map((x) => x.city).join(' vs '),
        state: arr[0].state,
        lat: arr.map((x) => x.lat).join(' / '),
        lng: arr.map((x) => x.lng).join(' / '),
        issue: 'duplicate_title_different_sites',
        fix: 'Rename cards: disambiguate borough (e.g. "— Brooklyn" vs "— Manhattan").',
        crossref: arr.map((p) => crossrefTags(p, tagById, seedByKey)).join(' | ')
      })
      continue
    }
    actions.push({
      severity: 'minor',
      id: arr.map((x) => x.id).join(' | '),
      name,
      city: arr.map((x) => x.city).join(' | '),
      state: arr[0].state,
      lat: '',
      lng: '',
      issue: 'duplicate_exact_name',
      fix: 'Confirm both are intentional; add subtitle or merge if duplicate POI.',
      crossref: arr.map((p) => crossrefTags(p, tagById, seedByKey)).join(' | ')
    })
  }

  const bannerman = places.filter((p) => /bannerman/i.test(p.name) && p.state === 'NY')
  if (bannerman.length >= 2) {
    let minKm = Infinity
    for (let i = 0; i < bannerman.length; i++) {
      for (let j = i + 1; j < bannerman.length; j++) {
        minKm = Math.min(
          minKm,
          haversineKm(bannerman[i].lat, bannerman[i].lng, bannerman[j].lat, bannerman[j].lng)
        )
      }
    }
    if (minKm < 3) {
      actions.push({
        severity: 'minor',
        id: bannerman.map((x) => x.id).join(' | '),
        name: bannerman.map((x) => x.name).join(' vs '),
        city: bannerman.map((x) => x.city).join(' | '),
        state: 'NY',
        lat: '',
        lng: `~${minKm.toFixed(1)}km apart`,
        issue: 'near_duplicate_poi_bannerman',
        fix: 'Clarify one canonical Pollepel listing or distinct subtitles.',
        crossref: bannerman.map((p) => crossrefTags(p, tagById, seedByKey)).join(' | ')
      })
    }
  }

  for (const [coordKey, arr] of dupCoords) {
    if (arr.length < 2) continue
    const names = arr.map((x) => x.name)
    if (sameSitePair(names)) continue
    actions.push({
      severity: 'minor',
      id: arr.map((x) => x.id).join(' | '),
      name: names.join(' | '),
      city: arr.map((x) => x.city).join(' | '),
      state: arr[0].state,
      lat: arr[0].lat,
      lng: arr[0].lng,
      issue: `shared_pin:${coordKey}`,
      fix: 'Confirm intentional; otherwise split coordinates.',
      crossref: arr.map((p) => crossrefTags(p, tagById, seedByKey)).join(' | ')
    })
  }

  const tagSource =
    tagsCsv && fs.existsSync(tagsCsv) ? path.relative(REPO_ROOT, tagsCsv) : 'seed 011 (name+city+state)'

  console.log('Places QA — cross-referenced action queue')
  console.log('==========================================')
  console.log('Main CSV:', path.relative(REPO_ROOT, csv))
  console.log('Tag crossref:', tagSource)
  console.log('Unique places (deduped by id):', places.length)
  if (duplicateRows > 0) console.log('Duplicate id rows dropped:', duplicateRows)
  console.log('')

  if (!tagsCsv || !fs.existsSync(tagsCsv)) {
    console.log('Note: pass --tags-csv (export_places_for_qa_audit.sql) for live category_tags crossref.')
    console.log('')
  }

  console.log(`Action items (after excluding edge cases): ${actions.length}`)
  console.log('')
  console.log(
    'severity\tid\tname\tcity\tstate\tlat\tlng\tissue\tcrossref\tfix'
  )
  for (const a of actions.sort((x, y) => x.severity.localeCompare(y.severity))) {
    console.log(
      [
        a.severity,
        a.id,
        a.name.replace(/\t/g, ' '),
        a.city.replace(/\t/g, ' '),
        a.state,
        a.lat,
        a.lng,
        a.issue,
        a.crossref,
        a.fix.replace(/\t/g, ' ')
      ].join('\t')
    )
  }

  console.log('')
  console.log('Excluded from action queue (reference only)')
  console.log('--------------------------------------------')
  console.log(
    `• Home-feed orphans (memorial/church rule, not pin errors): ${orphans.length} rows — adjust modeExclusivity or tags if they should appear on home.`
  )
  console.log(
    `• Known same-site coordinate pairs: ${KNOWN_SAME_SITE_COORDS.length} (Harmony campus; Hans Herr dual listing).`
  )
  console.log(
    `• Duplicate name suppressed (common cemetery/road pattern): ${[...DUPLICATE_NAME_EXCLUDE].filter((n) => byName.has(n)).length} name keys.`
  )
  console.log(
    `• Seed 011 miss (migrations / net-new; verify only if map disagrees with copy): ${noSeed.length} rows.`
  )

  if (verbose) {
    console.log('')
    console.log('--- Verbose: orphans (id | name | city | mode) ---')
    for (const p of orphans) {
      console.log(`  ${p.id}\t${p.name}\t${p.city}\t${p.mode}`)
    }
    console.log('')
    console.log('--- Verbose: no seed 011 match ---')
    for (const p of noSeed) {
      console.log(`  ${p.id}\t${p.name}\t${p.city}\t${p.state}`)
    }
    console.log('')
    console.log('--- Verbose: home counts ---')
    console.log('  Sanctuary home:', sHome.length)
    console.log('  Theophany home:', tHome.length)
  }
}

main()
