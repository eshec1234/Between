/** Hyperlocal activity feed (new places, anonymous reviews/tips, trending). */

function placeMatchesMode(placeMode, mode) {
  if (!placeMode) return true
  if (mode === 'sanctuary') return placeMode === 'sanctuary' || placeMode === 'both'
  return placeMode === 'theophany' || placeMode === 'both'
}

export async function fetchActivityFeed(supabase, mode) {
  const modeFilter = mode === 'sanctuary' ? 'mode.eq.sanctuary,mode.eq.both' : 'mode.eq.theophany,mode.eq.both'

  const { data: recentPlaces, error: e1 } = await supabase
    .from('places')
    .select('id, name, city, state, created_at, mode, source')
    .or(modeFilter)
    .order('created_at', { ascending: false })
    .limit(8)

  let recentReportsRaw = null
  let e2 = null
  const r1 = await supabase
    .from('experience_reports')
    .select('id, content, content_kind, created_at, place_id')
    .order('created_at', { ascending: false })
    .limit(24)
  if (r1.error) {
    const r2 = await supabase
      .from('experience_reports')
      .select('id, content, created_at, place_id')
      .order('created_at', { ascending: false })
      .limit(24)
    recentReportsRaw = (r2.data || []).map((row) => ({ ...row, content_kind: 'review' }))
    e2 = r2.error
  } else {
    recentReportsRaw = r1.data
    e2 = r1.error
  }

  const ids = [...new Set((recentReportsRaw || []).map((r) => r.place_id).filter(Boolean))]
  let placeMap = {}
  if (ids.length) {
    const { data: placeRows } = await supabase.from('places').select('id, name, city, state, mode').in('id', ids)
    placeMap = Object.fromEntries((placeRows || []).map((p) => [p.id, p]))
  }

  const recentReports = (recentReportsRaw || [])
    .map((r) => ({ ...r, places: placeMap[r.place_id] }))
    .filter((r) => r.places && placeMatchesMode(r.places.mode, mode))
    .slice(0, 10)

  const { data: trendingPlaces } = await supabase
    .from('places')
    .select('id, name, city, state, mode, source, flags, created_at')
    .or(modeFilter)
    .order('created_at', { ascending: false })
    .limit(20)

  const sortedTrending = (trendingPlaces || [])
    .map((p) => ({ ...p, _score: (p.flags || 0) * 1000 + new Date(p.created_at).getTime() }))
    .sort((a, b) => b._score - a._score)
    .slice(0, 6)

  return {
    recentPlaces: recentPlaces || [],
    recentReports,
    trendingPlaces: sortedTrending,
    errors: [e1, e2].filter(Boolean)
  }
}

/** Merge into a single time-ordered stream for the “Latest” strip */
export function mergeActivityStream(recentPlaces, recentReports, max = 14) {
  const rows = []
  for (const p of recentPlaces) {
    rows.push({
      key: `p-${p.id}`,
      kind: 'new_place',
      at: p.created_at,
      place: p
    })
  }
  for (const r of recentReports) {
    const pl = r.places
    const kind = r.content_kind === 'tip' ? 'tip' : 'review'
    rows.push({
      key: `r-${r.id}`,
      kind,
      at: r.created_at,
      report: r,
      place: pl
    })
  }
  rows.sort((a, b) => new Date(b.at) - new Date(a.at))
  return rows.slice(0, max)
}
