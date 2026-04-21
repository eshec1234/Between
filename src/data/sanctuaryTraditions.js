/**
 * Sanctuary “tradition” filter — loose keyword match on category_tags, traditions, and name.
 * Not exhaustive; community listings should use clear tags and tradition lines for best results.
 */

export const SANCTUARY_TRADITIONS = [
  { id: '', label: 'All traditions', match: [] },
  {
    id: 'christian',
    label: 'Christianity',
    match: [
      'christian',
      'catholic',
      'protestant',
      'orthodox',
      'cathedral',
      'basilica',
      'church',
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
      'polish catholic'
    ]
  },
  {
    id: 'jewish',
    label: 'Judaism',
    match: ['jewish', 'judaism', 'synagogue', 'torah', 'shabbat', 'hebrew', 'kosher', 'yeshiva', 'hasidic', 'reform judaism', 'conservative judaism']
  },
  {
    id: 'islam',
    label: 'Islam',
    match: ['islam', 'muslim', 'mosque', 'masjid', 'quran', "qur'an", 'ramadan', 'minaret', 'imam', 'sunni', 'shia', 'islamic']
  },
  {
    id: 'hindu',
    label: 'Hinduism',
    match: ['hindu', 'hinduism', 'mandir', 'vedic', 'puja', 'diwali', 'shiva', 'vishnu', 'devi', 'swaminarayan']
  },
  {
    id: 'buddhist',
    label: 'Buddhism',
    match: ['buddhist', 'buddhism', 'vihara', 'stupa', 'zen', 'nembutsu', 'theravada', 'mahayana', 'bodhisattva', 'dharma hall']
  },
  {
    id: 'sikh',
    label: 'Sikhism',
    match: ['sikh', 'sikhism', 'gurdwara', 'guru granth', 'khalsa', 'singh sabha']
  },
  {
    id: 'bahai',
    label: "Baha'i",
    match: ['bahai', 'bahá', "baha'i", 'baháʼí', 'bahai faith']
  }
]

export function placeMatchesSanctuaryTradition(place, traditionId) {
  if (!traditionId) return true
  const row = SANCTUARY_TRADITIONS.find((x) => x.id === traditionId)
  if (!row?.match?.length) return true
  const hay = [...(place.category_tags || []), place.traditions || '', place.name || ''].join(' ').toLowerCase()
  return row.match.some((m) => hay.includes(m.toLowerCase()))
}
