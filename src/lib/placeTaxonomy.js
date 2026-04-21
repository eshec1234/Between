const GEO_NOISE_TAGS = new Set([
  'pa',
  'nj',
  'ny',
  'pennsylvania',
  'new jersey',
  'new york',
  'lehigh',
  'lancaster',
  'erie',
  'fayette',
  'franklin',
  'fulton',
  'greene',
  'huntingdon',
  'indiana',
  'jefferson',
  'lawrence',
  'lebanon',
  'luzerne',
  'adams',
  'allegheny',
  'armstrong',
  'beaver',
  'bedford',
  'berks',
  'blair',
  'bradford',
  'bucks',
  'butler',
  'cambria',
  'cameron',
  'carbon',
  'centre',
  'chester',
  'clarion',
  'clearfield',
  'clinton',
  'columbia',
  'crawford',
  'cumberland',
  'dauphin',
  'delaware',
  'elk',
  'forest',
  'juniata',
  'lackawanna',
  'lycoming',
  'mckean',
  'mercer',
  'mifflin',
  'monroe',
  'montgomery',
  'montour',
  'northampton',
  'northumberland',
  'perry',
  'philadelphia',
  'pike',
  'potter',
  'schuylkill',
  'snyder',
  'somerset',
  'sullivan',
  'susquehanna',
  'tioga',
  'union',
  'venango',
  'warren',
  'washington',
  'wayne',
  'westmoreland',
  'wyoming',
  'york',
  'atlantic',
  'bergen',
  'burlington',
  'camden',
  'cape may',
  'cumberland nj',
  'essex',
  'gloucester',
  'hudson',
  'hunterdon',
  'mercer nj',
  'middlesex',
  'monmouth',
  'morris',
  'ocean',
  'passaic',
  'salem',
  'somerset nj',
  'sussex',
  'union nj',
  'warren nj',
  'albany',
  'bronx',
  'broome',
  'cattaraugus',
  'cayuga',
  'chautauqua',
  'chemung',
  'chenango',
  'clinton ny',
  'delaware ny',
  'dutchess',
  'genesee',
  'hamilton',
  'herkimer',
  'kings',
  'madison',
  'manhattan',
  'monroe ny',
  'nassau',
  'niagara',
  'oneida',
  'onondaga',
  'ontario',
  'orange',
  'orleans',
  'oswego',
  'otsego',
  'putnam',
  'queens',
  'rensselaer',
  'richmond',
  'rockland',
  'saratoga',
  'schenectady',
  'schoharie',
  'schuyler',
  'seneca',
  'st. lawrence',
  'steuben',
  'suffolk',
  'sullivan ny',
  'tompkins',
  'ulster',
  'williamsburg',
  'wayne ny',
  'westchester',
  'yates'
])

const NOISE_TAGS = new Set(['various', 'none', 'unknown'])

function normalizeTag(raw) {
  return String(raw || '').trim().toLowerCase()
}

export function isGeoNoiseTag(tag) {
  const t = normalizeTag(tag)
  return GEO_NOISE_TAGS.has(t) || t.endsWith(' county')
}

export function tagAllowedForHomeFilter(tag) {
  const t = normalizeTag(tag)
  if (!t || t.length < 3) return false
  if (NOISE_TAGS.has(t)) return false
  if (isGeoNoiseTag(t)) return false
  return true
}

export function firstDisplayCategoryTag(place) {
  const tags = place?.category_tags || []
  return tags.find((tag) => tagAllowedForHomeFilter(tag)) || tags[0] || null
}

export function normalizeFilterTags(tags = []) {
  return tags.filter((tag) => tagAllowedForHomeFilter(tag))
}

export function visibleFilterTags(tags = []) {
  return normalizeFilterTags(tags)
}

