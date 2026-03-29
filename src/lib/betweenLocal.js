/** Client-only memory: saves, visited, walkthrough-done, daily ritual streak */

const SAVED = 'between_saved_places'
const VISITED = 'between_visited_places'
const WALKTHROUGH = 'between_walkthrough_done'
const STREAK = 'between_visit_streak'
const DAILY_MARK = 'between_daily_mark'
const INTENTION = 'between_intention'

function readJson(key, fallback) {
  try {
    const s = localStorage.getItem(key)
    if (!s) return fallback
    return JSON.parse(s)
  } catch {
    return fallback
  }
}

function writeJson(key, val) {
  localStorage.setItem(key, JSON.stringify(val))
}

export function getSavedIds() {
  return new Set(readJson(SAVED, []))
}

export function isSaved(placeId) {
  return getSavedIds().has(placeId)
}

export function toggleSaved(placeId) {
  const s = getSavedIds()
  if (s.has(placeId)) s.delete(placeId)
  else s.add(placeId)
  writeJson(SAVED, [...s])
  return s.has(placeId)
}

export function getVisitedIds() {
  return new Set(readJson(VISITED, []))
}

export function markVisited(placeId) {
  const v = getVisitedIds()
  if (v.has(placeId)) return
  v.add(placeId)
  writeJson(VISITED, [...v])
}

export function hasVisited(placeId) {
  return getVisitedIds().has(placeId)
}

export function getWalkthroughDoneIds() {
  return new Set(readJson(WALKTHROUGH, []))
}

export function markWalkthroughDone(placeId) {
  const w = getWalkthroughDoneIds()
  if (w.has(placeId)) return
  w.add(placeId)
  writeJson(WALKTHROUGH, [...w])
}

export function hasWalkthroughDone(placeId) {
  return getWalkthroughDoneIds().has(placeId)
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function yesterdayStr() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

/** Call when user taps "Mark today's visit" — extends streak if yesterday or first mark today */
export function markDailyVisit() {
  const t = todayStr()
  if (localStorage.getItem(DAILY_MARK) === t) {
    return getStreakInfo()
  }

  const st = readJson(STREAK, { count: 0, lastDate: null })
  const prev = st.lastDate
  const count = prev === yesterdayStr() ? (st.count || 0) + 1 : 1

  writeJson(STREAK, { count, lastDate: t })
  localStorage.setItem(DAILY_MARK, t)
  return getStreakInfo()
}

export function getStreakInfo() {
  const t = todayStr()
  const lastMark = localStorage.getItem(DAILY_MARK)
  const st = readJson(STREAK, { count: 0, lastDate: null })
  const markedToday = lastMark === t
  return {
    streakDays: st.count || 0,
    markedToday,
    lastDate: st.lastDate
  }
}

export function getIntention() {
  try {
    return sessionStorage.getItem(INTENTION) || ''
  } catch {
    return ''
  }
}

export function setIntention(value) {
  try {
    if (value) sessionStorage.setItem(INTENTION, value)
    else sessionStorage.removeItem(INTENTION)
  } catch {
    /* ignore */
  }
}

/** km */
export function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

export function coordsFromPlace(place) {
  const c = place?.coordinates?.coordinates
  if (!c || c.length < 2) return null
  return { lng: c[0], lat: c[1] }
}
