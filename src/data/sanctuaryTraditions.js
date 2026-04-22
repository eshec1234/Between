/**
 * Sanctuary "tradition" filter — loose keyword match on category_tags, traditions, and name.
 * The 'secular' id is a special case: it matches places with no religious tradition assigned.
 */

const RELIGIOUS_KEYWORDS = [
  'christian', 'catholic', 'protestant', 'orthodox', 'cathedral', 'basilica',
  'church', 'chapel', 'liturgical', 'gospel', 'baptist', 'episcopal', 'anglican',
  'methodist', 'presbyterian', 'pentecostal', 'evangelical', 'lutheran', 'mormon',
  'latter-day', 'marian', 'parish', 'interdenominational', 'roman catholic',
  'jewish', 'judaism', 'synagogue', 'torah', 'shabbat', 'hebrew',
  'buddhist', 'buddhism', 'vihara', 'stupa', 'zen', 'theravada', 'mahayana',
  'islam', 'muslim', 'mosque', 'masjid',
  'hindu', 'hinduism', 'mandir',
  'sikh', 'gurdwara',
  'indigenous',
]

export const SANCTUARY_TRADITIONS = [
  { id: '', label: 'All traditions', match: [] },
  {
    id: 'christian',
    label: 'Christianity',
    match: [
      'christian', 'catholic', 'protestant', 'orthodox', 'cathedral', 'basilica',
      'church', 'chapel', 'liturgical', 'gospel', 'baptist', 'episcopal', 'anglican',
      'methodist', 'presbyterian', 'pentecostal', 'evangelical', 'lutheran', 'mormon',
      'latter-day', 'marian', 'parish', 'interdenominational', 'roman catholic', 'polish catholic'
    ]
  },
  {
    id: 'jewish',
    label: 'Judaism',
    match: ['jewish', 'judaism', 'synagogue', 'torah', 'shabbat', 'hebrew', 'kosher', 'yeshiva', 'hasidic']
  },
  {
    id: 'buddhist',
    label: 'Buddhism',
    match: ['buddhist', 'buddhism', 'vihara', 'stupa', 'zen', 'nembutsu', 'theravada', 'mahayana', 'bodhisattva', 'dharma hall']
  },
  {
    id: 'indigenous',
    label: 'Indigenous',
    match: ['indigenous', 'native american', 'lenape', 'haudenosaunee', 'iroquois', 'algonquin', 'tribal', 'ceremonial ground', 'sacred land']
  },
  {
    id: 'secular',
    label: 'Liminal & Secular',
    match: [], // handled specially below
  },
]

export function placeMatchesSanctuaryTradition(place, traditionId) {
  if (!traditionId) return true

  if (traditionId === 'secular') {
    // Match places that carry no recognisable religious tradition
    const hay = [
      ...(place.category_tags || []),
      place.traditions || '',
      place.name || '',
    ].join(' ').toLowerCase()
    return !RELIGIOUS_KEYWORDS.some((kw) => hay.includes(kw))
  }

  const row = SANCTUARY_TRADITIONS.find((x) => x.id === traditionId)
  if (!row?.match?.length) return true
  const hay = [...(place.category_tags || []), place.traditions || '', place.name || ''].join(' ').toLowerCase()
  return row.match.some((m) => hay.includes(m.toLowerCase()))
}
