/**
 * Guided mini-routes: place names must match `places.name` in Supabase (seed 007).
 * Resolve to IDs client-side after fetching places.
 */
export const MINI_ROUTES = [
  {
    id: 'philly-stones',
    title: 'Philadelphia stones',
    description: 'Cathedral hush, prison light, river fort — one city, three thresholds.',
    placeNames: [
      'Cathedral Basilica of Saints Peter and Paul',
      'Eastern State Penitentiary Grounds',
      'Fort Mifflin Earthworks'
    ]
  },
  {
    id: 'ny-doors',
    title: 'River & threshold',
    description: 'From neon nave to Hudson bell — an afternoon of vertical space.',
    placeNames: ["St. Patrick's Cathedral", 'Riverside Church', 'Sleepy Hollow Cemetery — Old Section']
  },
  {
    id: 'nj-pine',
    title: 'Pine barrens & brick',
    description: 'Village, sand road, and monument — NJ’s quieter map.',
    placeNames: ['Batsto Village Historic', 'Pine Barrens Trail Crossing', 'Trenton Battle Monument']
  }
]

/** @param {{ id: string, name: string }[]} places */
export function resolveRoutePlaces(route, places) {
  const byName = new Map(places.map((p) => [p.name, p]))
  return route.placeNames.map((n) => byName.get(n)).filter(Boolean)
}
