/** Intention chips → loose tag matching on category_tags (substring) */

export const INTENTIONS = [
  { id: 'edge', label: 'Edge / liminal', match: ['anomalous', 'liminal', 'ruins', 'abandoned', 'forest', 'folklore'] },
  { id: 'grief', label: 'Grief / memory', match: ['cemetery', 'memorial', 'battlefield', 'civil', 'national'] },
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
  const intent = INTENTIONS.find((x) => x.id === intentionId)
  if (!intent) return true
  const tags = (place.category_tags || []).join(' ').toLowerCase()
  return intent.match.some((m) => tags.includes(m))
}
