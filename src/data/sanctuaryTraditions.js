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
      'polish catholic'
    ]
  },
  {
    id: 'jewish',
    label: 'Judaism',
    match: ['jewish', 'judaism', 'synagogue', 'torah', 'shabbat', 'hebrew', 'kosher', 'yeshiva', 'hasidic', 'reform judaism', 'conservative judaism']
  },
  {
    id: 'buddhist',
    label: 'Buddhism',
    match: ['buddhist', 'buddhism', 'vihara', 'stupa', 'zen', 'nembutsu', 'theravada', 'mahayana', 'bodhisattva', 'dharma hall']
  }
]

export function placeMatchesSanctuaryTradition(place, traditionId) {
  if (!traditionId) return true
  const row = SANCTUARY_TRADITIONS.find((x) => x.id === traditionId)
  if (!row?.match?.length) return true
  const hay = [...(place.category_tags || []), place.traditions || '', place.name || ''].join(' ').toLowerCase()
  return row.match.some((m) => hay.includes(m.toLowerCase()))
}
