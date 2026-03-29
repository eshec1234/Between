/** When DB `photos` is empty, still show calm spiritual imagery (matches SQL 008 defaults). */
export const DEFAULT_PLACE_PHOTOS = [
  'https://images.unsplash.com/photo-1438032005730-c779502df39b?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1478147427282-58a87a120781?auto=format&fit=crop&w=1400&q=80'
]

export function photosForPlace(place) {
  const p = place?.photos
  if (Array.isArray(p) && p.length > 0 && p.some(Boolean)) return p.filter(Boolean)
  return DEFAULT_PLACE_PHOTOS
}
