/**
 * So the same place does not appear in both Sanctuary and Theophany home feeds.
 * - DB: mode `both` is split: church-leaning → Sanctuary only, everything else → Theophany.
 * - Church-like places never appear in Theophany; plantation-like never in Sanctuary.
 * - Theophany-only + church: shown only in Sanctuary. Sanctuary-only + plantation: shown only in Theophany.
 */
import { placeReadsAsMemorialOrCemetery } from './intentions.js'

function haystack(place) {
  return [...(place.category_tags || []), place.traditions || '', place.name || ''].join(' ').toLowerCase()
}

const CHURCH_WORSHIP = [
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

/** Christian / formal worship space – excluded from Theophany home; mislabeled theophany rows go to Sanctuary */
export function placeReadsAsChurchWorship(place) {
  const h = haystack(place)
  for (const m of CHURCH_WORSHIP) {
    if (h.includes(m.trim().toLowerCase())) return true
  }
  return false
}

const PLANTATION = [
  'plantation',
  'antebellum plantation',
  'enslaved labor',
  "slave's quarters",
  'slaves,',
  "slave' ",
  "slave's"
]

export function placeReadsAsPlantation(place) {
  const h = haystack(place)
  return PLANTATION.some((m) => h.includes(m))
}

/**
 * What shows on the home feed in Sanctuary mode (after memorial/plantation removal).
 * `both` is split: only church-leaning rows; others belong to Theophany.
 */
export function placeAppearsInSanctuaryHome(place) {
  if (placeReadsAsMemorialOrCemetery(place)) return false
  if (placeReadsAsPlantation(place)) return false
  if (place.mode === 'sanctuary') return true
  if (place.mode === 'theophany' || place.mode === 'both') {
    if (placeReadsAsChurchWorship(place)) return true
  }
  return false
}

/**
 * What shows on the home feed in Theophany mode. No churches; sanctuary-only stays out
 * except plantation-tagged (shown here only, not in Sanctuary).
 */
export function placeAppearsInTheophanyHome(place) {
  if (placeReadsAsChurchWorship(place)) return false
  if (place.mode === 'theophany') return true
  if (place.mode === 'both' && !placeReadsAsChurchWorship(place)) return true
  if (place.mode === 'sanctuary' && placeReadsAsPlantation(place)) return true
  return false
}
