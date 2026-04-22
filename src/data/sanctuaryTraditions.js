/**
 * Sanctuary “Tradition” chips — loose keyword match on category_tags, traditions, and name.
 * Order: All → Religion & worship → thematic groupings → mostly secular (no religious signal).
 */

function haystack(place) {
  return [...(place.category_tags || []), place.traditions || '', place.name || ''].join(' ').toLowerCase()
}

const RELIGIOUS_KEYWORDS = [
  'christian',
  'catholic',
  'protestant',
  'orthodox',
  'cathedral',
  'basilica',
  'church',
  'chapel',
  'liturgical',
  'gospel',
  'baptist',
  'episcopal',
  'anglican',
  'methodist',
  'presbyterian',
  'pentecostal',
  'evangelical',
  'lutheran',
  'mormon',
  'latter-day',
  'marian',
  'parish',
  'interdenominational',
  'roman catholic',
  'polish catholic',
  'jewish',
  'judaism',
  'synagogue',
  'torah',
  'shabbat',
  'hebrew',
  'kosher',
  'yeshiva',
  'hasidic',
  'buddhist',
  'buddhism',
  'vihara',
  'stupa',
  'zen',
  'nembutsu',
  'theravada',
  'mahayana',
  'bodhisattva',
  'dharma hall',
  'islam',
  'muslim',
  'mosque',
  'masjid',
  'quran',
  'koran',
  'hindu',
  'hinduism',
  'mandir',
  'puja',
  'sikh',
  'gurdwara',
  'shinto',
  'jinja',
  'torii',
  'jain',
  'bahai',
  'zoroastrian',
  'parsi',
  'taoist',
  'taoism',
  'daoist',
  'coptic',
  'druze',
  'unitarian',
  'quaker',
  'friends meeting',
  'sermon',
  'abbey',
  'monastery',
  'convent',
  'friary',
  'rectory',
  'minaret'
]

export const SANCTUARY_TRADITIONS = [
  { id: '', label: 'All', match: [] },
  { id: 'religion', label: 'Religion & worship', match: [] },
  {
    id: 'indigenous',
    label: 'Indigenous & tribal sacred',
    match: [
      'indigenous',
      'native american',
      'lenape',
      'haudenosaunee',
      'iroquois',
      'algonquin',
      'tribal',
      'ceremonial ground',
      'sacred land',
      'first nations'
    ]
  },
  {
    id: 'memorials',
    label: 'Memorials & remembrance',
    match: [
      'cemetery',
      'memorial',
      'battlefield',
      'civil war',
      'national cemetery',
      'memorial park',
      'grave',
      'mourning',
      'fallen',
      'veterans',
      'plaque'
    ]
  },
  {
    id: 'campus',
    label: 'Campuses & quiet study',
    match: [
      'university',
      'collegiate',
      'campus',
      'library',
      'reading room',
      'quiet',
      'tasteful',
      'seminar hall',
      'lecture hall',
      'quad',
      'academy'
    ]
  },
  {
    id: 'landmarks',
    label: 'Landmarks & architecture',
    match: ['landmark', 'historic', 'gothic', 'domes', 'clock tower', 'rotunda', 'hall of fame', 'courthouse', 'capitol']
  },
  {
    id: 'liminal',
    label: 'Nature, ruins & edges',
    match: [
      'forest',
      'park',
      'river',
      'lake',
      'trail',
      'folklore',
      'ruins',
      'abandoned',
      'liminal',
      'anomalous',
      'wild',
      'garden',
      'arboretum',
      'meadow',
      'wetland'
    ]
  },
  { id: 'secular', label: 'Mostly secular', match: [] }
]

const VALID_IDS = new Set(SANCTUARY_TRADITIONS.map((t) => t.id).filter(Boolean))

const LEGACY_TO_NEW = {
  christian: 'religion',
  jewish: 'religion',
  buddhist: 'religion'
}

/** Maps removed chip ids (e.g. christian) to `religion`; unknown ids → '' */
export function normalizeSanctuaryTraditionId(id) {
  if (!id) return ''
  if (LEGACY_TO_NEW[id]) return LEGACY_TO_NEW[id]
  if (VALID_IDS.has(id)) return id
  return ''
}

export function placeMatchesSanctuaryTradition(place, traditionId) {
  const id = normalizeSanctuaryTraditionId(traditionId)
  if (!id) return true

  if (id === 'secular') {
    const hay = haystack(place)
    return !RELIGIOUS_KEYWORDS.some((kw) => hay.includes(kw))
  }

  if (id === 'religion') {
    const hay = haystack(place)
    return RELIGIOUS_KEYWORDS.some((kw) => hay.includes(kw))
  }

  const row = SANCTUARY_TRADITIONS.find((x) => x.id === id)
  if (!row?.match?.length) return true
  const hay = haystack(place)
  return row.match.some((m) => hay.includes(m.toLowerCase()))
}
