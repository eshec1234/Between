/** Intention chips → loose substring match on category_tags, traditions, and name */

function intentionHaystack(place) {
  return [...(place.category_tags || []), place.traditions || '', place.name || ''].join(' ').toLowerCase()
}

/** Substrings for “Memorials & remembrance” (Theophany); also used to drop these from Sanctuary entirely */
export const MEMORIAL_REMEMBRANCE_MATCH = [
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

/** True when a place reads as cemetery / memorial / battlefield grief — Theophany-only in the product */
export function placeReadsAsMemorialOrCemetery(place) {
  const hay = intentionHaystack(place)
  return MEMORIAL_REMEMBRANCE_MATCH.some((m) => hay.includes(m))
}

export const INTENTIONS = [
  { id: '', label: 'All locations' },
  {
    id: 'memorials',
    label: 'Memorials & remembrance',
    match: MEMORIAL_REMEMBRANCE_MATCH
  },
  { id: 'edge', label: 'Edge / liminal', match: ['anomalous', 'liminal', 'ruins', 'abandoned', 'forest', 'folklore'] },
  {
    id: 'calm',
    label: 'Calm',
    match: [
      'chapel',
      'gothic',
      'university',
      'collegiate',
      'quiet',
      'tasteful',
      'cathedral',
      'landmark',
      'basilica',
      'domes'
    ]
  }
]

export function placeMatchesIntention(place, intentionId) {
  if (!intentionId) return true
  const resolvedId = intentionId === 'grief' ? 'memorials' : intentionId
  const intent = INTENTIONS.find((x) => x.id === resolvedId)
  if (!intent) return true
  const hay = intentionHaystack(place)
  return intent.match.some((m) => hay.includes(m.toLowerCase()))
}
