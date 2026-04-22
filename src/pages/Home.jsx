import { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase, hasSupabaseEnv } from '../lib/supabase'
import Starfield from '../components/Starfield'
const Map = lazy(() => import('../components/Map'))
import { getDailyOmen } from '../data/omens'
import { INTENSITY_LEVELS, INTENSITY_LEVELS_THEOPHANY } from '../data/intensityLegend'
import { fetchActivityFeed, fetchDarkHorsePlaces } from '../lib/feed'
import ActivityFeed from '../components/ActivityFeed'
import MockAdSlot from '../components/MockAdSlot'
import InstallPwaPrompt from '../components/InstallPwaPrompt'
import SourceBadge from '../components/SourceBadge'
import { photoForPlaceAtTime } from '../lib/placePhotoFallback'
import PlaceImage from '../components/PlaceImage'
import {
  getIntention,
  setIntention,
  getVisitedIds,
  getSavedIds,
  getWalkthroughDoneIds,
  toggleSaved,
  isSaved,
  getNearbyTrackingEnabled,
  setNearbyTrackingEnabled,
  distanceKm,
  getSanctuaryTraditionId,
  setSanctuaryTraditionId,
  HOME_MODE_STORAGE_KEY,
  getHomeMode
} from '../lib/betweenLocal'
import { placeMatchesIntention } from '../data/intentions'
import { placeMatchesSanctuaryTradition } from '../data/sanctuaryTraditions'
import EngagementHub from '../components/EngagementHub'
import SanctuaryTraditionBar from '../components/SanctuaryTraditionBar'
import FeedFilters from '../components/FeedFilters'
import TheophanyDisclaimer from '../components/TheophanyDisclaimer'
import { useAmbientMode } from '../context/AmbientModeContext'
import AmbientOrbs from '../components/AmbientOrbs'
import FilmGrain from '../components/FilmGrain'
import { PLACES_LIST_SELECT } from '../lib/placesSelect'

/** Philadelphia — primary market. Used until geolocation resolves. */
const DEFAULT_CENTER = { lat: 39.9526, lng: -75.1652 }
/** ~350km — PA/NJ/NY seeds span hundreds of km; 10km hid almost everything. */
const NEARBY_RADIUS_M = 350000
const PLACES_LIST_CAP = 48
/** Leave headroom so newest catalog rows (e.g. tradition seeds) can merge into the list */
const MAX_FROM_RPC = 24
/** Refetch nearby list when you’ve moved at least this far (km) while tracking */
const TRACK_MIN_MOVE_KM = 0.13

/** Rotate NY → NJ → PA so the list is not “only nearby state” when the catalog spans the region. */
function interleaveByState(rows, order = ['NY', 'NJ', 'PA']) {
  const buckets = { NY: [], NJ: [], PA: [], other: [] }
  for (const r of rows) {
    const k = order.includes(r.state) ? r.state : 'other'
    buckets[k].push(r)
  }
  const out = []
  const total = rows.length
  while (out.length < total) {
    let moved = false
    for (const st of [...order, 'other']) {
      if (buckets[st].length) {
        out.push(buckets[st].shift())
        moved = true
      }
    }
    if (!moved) break
  }
  return out
}

/** Or this often if you’re stationary (keeps feed fresh on long stays) */
const TRACK_MAX_STALE_MS = 120000
function readInitialMode() {
  const fromOnboarding = sessionStorage.getItem('between_initial_mode')
  sessionStorage.removeItem('between_initial_mode')
  if (fromOnboarding === 'sanctuary' || fromOnboarding === 'theophany') {
    try {
      localStorage.setItem(HOME_MODE_STORAGE_KEY, fromOnboarding)
    } catch {
      /* ignore */
    }
    return fromOnboarding
  }
  return getHomeMode()
}

function placeTypeLabel(place) {
  if (place.category_tags?.length) return place.category_tags[0]
  if (place.mode === 'both') return 'Both'
  return 'Place'
}

function IntensityBar({ level, isTheophany }) {
  if (level == null || level < 1 || level > 5) return null
  const scale = isTheophany ? INTENSITY_LEVELS_THEOPHANY : INTENSITY_LEVELS
  const meta = scale[level - 1]
  const empty = isTheophany ? 'rgba(120,90,160,0.22)' : 'rgba(255,255,255,0.1)'
  return (
    <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <div
          key={n}
          className="h-[3px] w-3 rounded-sm"
          style={{ background: n <= level ? meta.c : empty }}
        />
      ))}
      <span className="ml-1 font-sans text-[9px] uppercase tracking-wider" style={{ color: meta.c }}>
        {meta.label}
      </span>
    </div>
  )
}

export default function Home() {
  const location = useLocation()
  const navigate = useNavigate()
  const { setAmbientVariant } = useAmbientMode()
  const [mode, setMode] = useState(readInitialMode)
  const [places, setPlaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [center, setCenter] = useState(DEFAULT_CENTER)
  const [feedKind, setFeedKind] = useState('nearby')
  const [omen] = useState(() => getDailyOmen())
  const [feed, setFeed] = useState({
    recentPlaces: [],
    recentReports: [],
    trendingPlaces: []
  })
  const [feedLoading, setFeedLoading] = useState(true)
  const [darkHorsePlaces, setDarkHorsePlaces] = useState([])
  const [intent, setIntent] = useState(() => getIntention())
  const [localTick, setLocalTick] = useState(0)
  const [minIntensity, setMinIntensity] = useState(0)
  const [hideVisited, setHideVisited] = useState(false)
  const [savedOnly, setSavedOnly] = useState(false)
  const [selectedPlaceId, setSelectedPlaceId] = useState(null)
  const [trackNearby, setTrackNearby] = useState(() => getNearbyTrackingEnabled())
  const [sanctuaryTradition, setSanctuaryTradition] = useState(() => getSanctuaryTraditionId())
  // True once we have a real GPS fix (or gave up waiting). Prevents the list from
  // rendering with the default center before location resolves.
  const [locationReady, setLocationReady] = useState(!navigator.geolocation)
  // True only when the browser explicitly returned PERMISSION_DENIED (code 1).
  // Other failures (timeout, unavailable) fall back to the default center silently.
  const [locationDenied, setLocationDenied] = useState(false)
  // True after 25 s of unresolved loading — offers the state picker as a fallback.
  const [showPickerFallback, setShowPickerFallback] = useState(false)
  const locationReadyRef = useRef(!navigator.geolocation)
  const lastEmitRef = useRef({ lat: null, lng: null, at: 0 })
  const fetchSeqRef = useRef(0)
  const mapRef = useRef(null)
  const mapSectionRef = useRef(null)
  const cardRefs = useRef(new globalThis.Map())

  // Stable: flips locationReady exactly once (ref guards against double-fire)
  const markLocationReady = useCallback(() => {
    if (!locationReadyRef.current) {
      locationReadyRef.current = true
      setLocationReady(true)
    }
  }, [])

  // Center coords to use when the user picks a state manually
  const STATE_CENTERS = {
    PA: { lat: 39.9526, lng: -75.1652 }, // Philadelphia
    NJ: { lat: 40.7357, lng: -74.1724 }, // Newark / central NJ
    NY: { lat: 40.7128, lng: -74.0060 }, // New York City
  }

  const handlePickState = useCallback((st) => {
    setCenter(STATE_CENTERS[st])
    setLocationDenied(false)
    setShowPickerFallback(false)
    markLocationReady()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markLocationReady])

  useEffect(() => {
    if (!navigator.geolocation) return

    // Fallback: if geolocation takes more than 2.5 s, proceed with default center
    const fallbackTimer = setTimeout(markLocationReady, 2500)

    // Fast first fix (coarse, may use cached position) so the list updates quickly
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(fallbackTimer)
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        lastEmitRef.current = { lat, lng, at: Date.now() }
        setCenter({ lat, lng })
        markLocationReady()
      },
      (err) => {
        clearTimeout(fallbackTimer)
        if (err.code === 1) {
          // PERMISSION_DENIED — show state picker instead of defaulting to Philly
          setLocationDenied(true)
        } else {
          // Timeout or position unavailable — use default center silently
          markLocationReady()
        }
      },
      { timeout: 8000, maximumAge: 60000, enableHighAccuracy: false }
    )
    // High-accuracy follow-up so we get a precise fix once the device acquires GPS
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        lastEmitRef.current = { lat, lng, at: Date.now() }
        setCenter({ lat, lng })
      },
      () => {},
      { timeout: 20000, maximumAge: 0, enableHighAccuracy: true }
    )

    return () => clearTimeout(fallbackTimer)
  }, [markLocationReady])

  useEffect(() => {
    if (!navigator.geolocation || !trackNearby) return

    function emitIfNeeded(lat, lng) {
      const now = Date.now()
      const last = lastEmitRef.current
      if (last.lat == null || last.lng == null) {
        lastEmitRef.current = { lat, lng, at: now }
        setCenter({ lat, lng })
        return
      }
      const moved = distanceKm(last.lat, last.lng, lat, lng)
      const stale = now - last.at > TRACK_MAX_STALE_MS
      if (moved >= TRACK_MIN_MOVE_KM || stale) {
        lastEmitRef.current = { lat, lng, at: now }
        setCenter({ lat, lng })
      }
    }

    const opts = { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => emitIfNeeded(pos.coords.latitude, pos.coords.longitude),
      () => {},
      opts
    )
    return () => {
      navigator.geolocation.clearWatch(watchId)
    }
  }, [trackNearby])

  // After 25 s of continuous loading, surface the state picker so the user
  // isn't left staring at a spinner indefinitely.
  useEffect(() => {
    if (!loading) return
    const timer = setTimeout(() => setShowPickerFallback(true), import.meta.env.DEV ? 5000 : 25000)
    return () => clearTimeout(timer)
  }, [loading])

  useEffect(() => {
    let cancelled = false
    async function loadFeed() {
      if (!hasSupabaseEnv || !supabase) {
        setFeed({ recentPlaces: [], recentReports: [], trendingPlaces: [] })
        setFeedLoading(false)
        return
      }
      setFeedLoading(true)
      const data = await fetchActivityFeed(supabase, mode)
      if (!cancelled) {
        setFeed({
          recentPlaces: data.recentPlaces,
          recentReports: data.recentReports,
          trendingPlaces: data.trendingPlaces
        })
        setFeedLoading(false)
      }
    }
    loadFeed()
    return () => {
      cancelled = true
    }
  }, [mode])

  useEffect(() => {
    let cancelled = false
    async function loadDark() {
      if (!hasSupabaseEnv || !supabase || feedLoading) return
      const ids = (feed.trendingPlaces || []).map((p) => p.id)
      const rows = await fetchDarkHorsePlaces(supabase, mode, ids)
      if (!cancelled) setDarkHorsePlaces(rows)
    }
    loadDark()
    return () => {
      cancelled = true
    }
  }, [mode, feedLoading, feed.trendingPlaces])

  const fetchPlaces = useCallback(async () => {
    const fetchSeq = ++fetchSeqRef.current
    setLoading(true)
    if (!hasSupabaseEnv || !supabase) {
      if (fetchSeq !== fetchSeqRef.current) return
      setPlaces([])
      setFeedKind('fallback')
      setLoading(false)
      return
    }

    const { data: rpcData, error: rpcError } = await supabase.rpc('places_nearby', {
      lat: center.lat,
      lng: center.lng,
      radius_m: NEARBY_RADIUS_M,
      mode_filter: mode
    })
    if (fetchSeq !== fetchSeqRef.current) return

    // RPC returns rows already sorted by distance — preserve that order.
    // Do NOT pass these through interleaveByState or the closest place will no longer be first.
    const rpcSlice = !rpcError && rpcData?.length ? [...rpcData].slice(0, MAX_FROM_RPC) : []
    const seen = new Set(rpcSlice.map((p) => p.id))
    const catalogExtras = []

    const { data: more } = await supabase
      .from('places')
      .select(PLACES_LIST_SELECT)
      .or(`mode.eq.${mode},mode.eq.both`)
      .order('name', { ascending: true })
      .limit(120)
    if (fetchSeq !== fetchSeqRef.current) return

    for (const p of more || []) {
      if (rpcSlice.length + catalogExtras.length >= PLACES_LIST_CAP) break
      if (!seen.has(p.id)) {
        seen.add(p.id)
        catalogExtras.push(p)
      }
    }

    // Top up so thin states still appear in the catalog tail.
    for (const st of ['NY', 'NJ', 'PA']) {
      if (rpcSlice.length + catalogExtras.length >= PLACES_LIST_CAP) break
      const have = [...rpcSlice, ...catalogExtras].filter((p) => p.state === st).length
      if (have >= 8) continue
      const { data: extra } = await supabase
        .from('places')
        .select(PLACES_LIST_SELECT)
        .or(`mode.eq.${mode},mode.eq.both`)
        .eq('state', st)
        .order('name', { ascending: true })
        .limit(24)
      if (fetchSeq !== fetchSeqRef.current) return
      for (const p of extra || []) {
        if (rpcSlice.length + catalogExtras.length >= PLACES_LIST_CAP) break
        if (!seen.has(p.id)) {
          seen.add(p.id)
          catalogExtras.push(p)
        }
      }
    }

    // Distance-sorted RPC results lead; catalog extras follow interleaved by state
    // so no single state dominates the tail. When RPC is unavailable, fall back to
    // full state-interleave of the catalog.
    const finalList = rpcSlice.length > 0
      ? [...rpcSlice, ...interleaveByState(catalogExtras)]
      : interleaveByState(catalogExtras)

    if (fetchSeq !== fetchSeqRef.current) return
    if (rpcError || !rpcData?.length) {
      setFeedKind('fallback')
    } else if (catalogExtras.length > 0) {
      setFeedKind('mixed')
    } else {
      setFeedKind('nearby')
    }

    setPlaces(finalList.slice(0, PLACES_LIST_CAP))
    setLoading(false)
  }, [center.lat, center.lng, mode])

  useEffect(() => {
    if (locationReady) fetchPlaces()
  }, [fetchPlaces, locationReady])

  const isTheophany = mode === 'theophany'

  useEffect(() => {
    setAmbientVariant(mode)
  }, [mode, setAmbientVariant])

  const setModePersisted = useCallback((next) => {
    setMode(next)
    try {
      localStorage.setItem(HOME_MODE_STORAGE_KEY, next)
    } catch {
      /* ignore */
    }
  }, [])

  const filteredPlaces = useMemo(() => {
    let list = places
    if (intent) {
      list = list.filter((p) => placeMatchesIntention(p, intent))
    }
    if (isTheophany && minIntensity > 0) {
      list = list.filter((p) => p.intensity != null && p.intensity >= minIntensity)
    }
    if (hideVisited) {
      const v = getVisitedIds()
      list = list.filter((p) => !v.has(p.id))
    }
    if (savedOnly) {
      const s = getSavedIds()
      list = list.filter((p) => s.has(p.id))
    }
    if (!isTheophany && sanctuaryTradition) {
      list = list.filter((p) => placeMatchesSanctuaryTradition(p, sanctuaryTradition))
    }
    // Attach distance from user's live location, then sort closest-first
    list = list.map((p) => {
      const coords = p.coordinates?.coordinates
      if (!coords) return { ...p, _distKm: null }
      return { ...p, _distKm: distanceKm(center.lat, center.lng, coords[1], coords[0]) }
    })
    list.sort((a, b) => {
      if (a._distKm == null && b._distKm == null) return 0
      if (a._distKm == null) return 1
      if (b._distKm == null) return -1
      return a._distKm - b._distKm
    })
    return list
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    places,
    intent,
    minIntensity,
    hideVisited,
    savedOnly,
    isTheophany,
    sanctuaryTradition,
    localTick,
    location.key,
    center.lat,
    center.lng,
  ])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const visitedIds = useMemo(() => getVisitedIds(), [places, localTick, location.key])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const savedIds = useMemo(() => getSavedIds(), [places, localTick, location.key])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const walkthroughDoneIds = useMemo(() => getWalkthroughDoneIds(), [places, localTick, location.key])

  const mapCenter = [center.lng, center.lat]

  const onSurpriseMe = useCallback(() => {
    const pool = filteredPlaces.length ? filteredPlaces : places
    if (!pool.length) return
    const pick = pool[Math.floor(Math.random() * pool.length)]
    navigate(`/place/${pick.id}?surprise=1`)
  }, [filteredPlaces, places, navigate])

  const onToggleTrackNearby = useCallback(() => {
    setTrackNearby((prev) => {
      const next = !prev
      setNearbyTrackingEnabled(next)
      return next
    })
  }, [])

  const onSanctuaryTraditionChange = useCallback((id) => {
    setSanctuaryTradition(id)
    setSanctuaryTraditionId(id)
  }, [])

  const setCardRef = useCallback((placeId, node) => {
    if (node) {
      cardRefs.current.set(placeId, node)
    } else {
      cardRefs.current.delete(placeId)
    }
  }, [])

  const scrollCardIntoView = useCallback((placeId) => {
    const node = cardRefs.current.get(placeId)
    if (!node) return
    node.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [])

  const onMarkerSelect = useCallback((placeId) => {
    setSelectedPlaceId(placeId)
    scrollCardIntoView(placeId)
  }, [scrollCardIntoView])

  const onFocusPlaceOnMap = useCallback((placeId) => {
    setSelectedPlaceId(placeId)
    mapSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    const run = () => mapRef.current?.focusPlace?.(placeId)
    run()
    requestAnimationFrame(run)
    setTimeout(run, 350)
    setTimeout(run, 750)
  }, [])

  useEffect(() => {
    if (selectedPlaceId == null) return
    if (!filteredPlaces.some((p) => p.id === selectedPlaceId)) {
      setSelectedPlaceId(null)
    }
  }, [filteredPlaces, selectedPlaceId])

  const subMuted = isTheophany ? 'text-theophany-muted' : 'text-sanctuary-muted'
  const accent = isTheophany ? 'text-theophany-accent' : 'text-sanctuary-accent'
  const bord = isTheophany ? 'border-theophany-accent/45' : 'border-sanctuary-accent/45'

  return (
    <div
      className={`relative flex min-h-0 flex-1 flex-col overflow-hidden ${
        isTheophany
          ? 'bg-gradient-to-b from-theophany-bg via-theophany-primary to-theophany-secondary text-theophany-text'
          : 'bg-gradient-to-br from-sanctuary-bg via-sanctuary-primary to-sanctuary-secondary text-sanctuary-text'
      }`}
    >
      {isTheophany && <Starfield pinToViewport />}
      {isTheophany && (
        <div
          className="pointer-events-none fixed inset-0 z-[1] min-h-[100dvh]"
          style={{
            background:
              'radial-gradient(ellipse 85% 55% at 50% -15%, rgba(120, 70, 180, 0.22), transparent 52%), radial-gradient(ellipse 90% 70% at 100% 50%, rgba(60, 30, 90, 0.12), transparent 45%), radial-gradient(ellipse_at_center, transparent 16%, rgba(0,0,0,0.78) 100%)'
          }}
        />
      )}
      {!isTheophany && (
        <div className="pointer-events-none absolute left-1/2 top-0 z-[1] h-[220px] w-[160%] max-w-none -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,rgba(255,230,155,0.45)_0%,transparent_65%)]" />
      )}

      {!isTheophany && (
        <>
          <AmbientOrbs variant="sanctuary" />
          <FilmGrain opacity={0.038} />
        </>
      )}

      <div
        className={`z-40 flex shrink-0 items-center justify-between gap-3 px-4 pb-4 pt-[max(1.5rem,env(safe-area-inset-top,0px))] ${
          isTheophany
            ? 'fixed left-0 right-0 top-0 bg-theophany-bg/90 backdrop-blur-sm'
            : 'sticky top-0 border-b border-amber-900/[0.08] bg-sanctuary-bg/88 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-md'
        }`}
      >
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
          <h1
            className={`font-display text-xl tracking-[0.35em] ${
              isTheophany ? 'text-theophany-text' : 'bg-gradient-to-r from-amber-900/90 via-sanctuary-accent to-amber-800/80 bg-clip-text text-transparent'
            }`}
          >
            Between
          </h1>
          <nav className="flex flex-wrap items-center gap-x-3 gap-y-1" aria-label="About and help">
            <Link
              to="/about"
              className={`inline-flex min-h-[44px] items-center font-sans text-[9px] uppercase tracking-[0.18em] ${
                isTheophany ? 'text-theophany-muted' : 'text-sanctuary-muted'
              }`}
            >
              About
            </Link>
            <Link
              to="/faq"
              className={`inline-flex min-h-[44px] items-center font-sans text-[9px] uppercase tracking-[0.18em] ${
                isTheophany ? 'text-theophany-muted' : 'text-sanctuary-muted'
              }`}
            >
              FAQ
            </Link>
          </nav>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setModePersisted('sanctuary')}
            className={`px-4 py-2 font-sans text-xs uppercase tracking-wider transition-colors ${
              mode === 'sanctuary'
                ? 'bg-sanctuary-accent text-sanctuary-bg'
                : 'border border-sanctuary-muted text-sanctuary-muted'
            }`}
          >
            Sanctuary
          </button>
          <button
            type="button"
            onClick={() => setModePersisted('theophany')}
            className={`px-4 py-2 font-sans text-xs uppercase tracking-wider transition-colors ${
              mode === 'theophany'
                ? 'bg-theophany-accent text-theophany-bg'
                : 'border border-theophany-muted text-theophany-muted'
            }`}
          >
            Theophany
          </button>
        </div>
      </div>

      <div
        className={`relative z-10 min-h-0 flex-1 overflow-y-auto overflow-x-hidden ${
          isTheophany
            ? 'pt-[max(5.75rem,calc(env(safe-area-inset-top,0px)+4.85rem))]'
            : 'pt-3'
        }`}
      >
        {isTheophany && (
          <section
            className="mx-4 mt-2 rounded-md border border-violet-900/45 bg-[rgba(10,5,20,0.85)] px-3 py-3 shadow-[0_0_32px_rgba(100,60,160,0.12)] backdrop-blur-sm"
            aria-label="Theophany disclaimer"
          >
            <h2 className="mb-2 font-sans text-[8px] uppercase tracking-[0.35em] text-violet-400/55">Disclaimer</h2>
            <TheophanyDisclaimer className="mt-0 border-0 pt-0 text-left leading-relaxed" />
          </section>
        )}

        <div className={`px-4 text-center ${isTheophany ? 'mt-4' : ''}`}>
          <p
            className={`font-display text-[10px] uppercase tracking-[0.28em] ${
              isTheophany ? 'text-theophany-muted' : 'text-sanctuary-muted'
            }`}
          >
            {isTheophany ? 'A place to notice' : 'A place to remain'}
          </p>
          <p className={`mt-1 font-sans text-[10px] ${isTheophany ? 'text-theophany-muted/90' : 'text-sanctuary-muted'}`}>
            Hyperlocal · Anonymous · Feed
          </p>
          <p className={`mx-auto mt-2 max-w-md font-sans text-[11px] leading-relaxed ${isTheophany ? 'text-theophany-muted' : 'text-sanctuary-muted'}`}>
            Set an intention, follow a mini-route, or browse — open a place for a walkthrough and reflections. Saved and
            visited states stay on this device.
          </p>
        </div>

        {isTheophany && (
          <div className="mx-4 mt-4 space-y-3">
            <div className="rounded-md border border-purple-950/50 bg-[rgba(12,6,22,0.72)] px-3 py-3.5 text-center shadow-[0_0_40px_rgba(100,60,160,0.12)] backdrop-blur-sm">
              <div className="mb-2 font-sans text-[8px] uppercase tracking-[0.35em] text-violet-400/55">
                Today&apos;s omen
              </div>
              <p className="m-0 font-serif text-sm italic leading-relaxed text-violet-100/90">{omen}</p>
            </div>
            <div className="rounded border border-violet-950/45 bg-[rgba(8,4,18,0.55)] px-3 py-2.5 shadow-[inset_0_1px_0_rgba(167,139,250,0.08)] backdrop-blur-sm">
              <div className="mb-2 font-sans text-[8px] uppercase tracking-[0.3em] text-violet-500/45">
                Intensity scale
              </div>
              <div className="flex flex-wrap gap-2.5">
                {INTENSITY_LEVELS_THEOPHANY.map((l) => (
                  <div key={l.label} className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full" style={{ background: l.c }} />
                    <span className="font-sans text-[8px]" style={{ color: l.c }}>
                      {l.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {!isTheophany && (
          <div className="px-4 pt-4">
            <SanctuaryTraditionBar
              value={sanctuaryTradition}
              onChange={onSanctuaryTraditionChange}
              subClass={subMuted}
              borderClass={bord}
            />
          </div>
        )}

        <div className="pt-4">
          <InstallPwaPrompt isTheophany={isTheophany} />
          <ActivityFeed
            recentPlaces={feed.recentPlaces}
            recentReports={feed.recentReports}
            trendingPlaces={feed.trendingPlaces}
            isTheophany={isTheophany}
            loading={feedLoading}
            trendingSectionTitle={isTheophany ? 'Bright threads' : 'Gathering light'}
          />
        </div>

        <div className="pt-5">
          <EngagementHub
            places={filteredPlaces}
            center={center}
            isTheophany={isTheophany}
            subClass={subMuted}
            accentClass={accent}
            borderClass={bord}
            intent={intent}
            onIntentChange={(next) => {
              setIntent(next)
              setIntention(next)
            }}
          />
        </div>

        <FeedFilters
          isTheophany={isTheophany}
          minIntensity={minIntensity}
          setMinIntensity={setMinIntensity}
          hideVisited={hideVisited}
          setHideVisited={setHideVisited}
          savedOnly={savedOnly}
          setSavedOnly={setSavedOnly}
          subClass={subMuted}
          borderClass={bord}
          accentClass={accent}
        />

        <div className="px-4 pt-5">
          <button
            type="button"
            onClick={onSurpriseMe}
            disabled={!places.length}
            className={`w-full rounded-xl border-2 px-4 py-3.5 font-display text-sm tracking-[0.2em] transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
              isTheophany
                ? 'border-theophany-accent/50 bg-black/25 text-theophany-accent hover:bg-theophany-accent/10'
                : 'border-sanctuary-accent/45 bg-white/50 text-sanctuary-text hover:bg-sanctuary-accent/10'
            }`}
          >
            Surprise me
          </button>
          <p className={`mt-2 text-center font-sans text-[9px] leading-relaxed ${subMuted}`}>
            A random place — walkthrough first, no name until you choose to reveal.
          </p>
        </div>

        <div ref={mapSectionRef} className="px-4 pt-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p
                className={`font-sans text-[10px] uppercase tracking-[0.35em] ${
                  isTheophany ? 'text-theophany-muted' : 'text-sanctuary-muted'
                }`}
              >
                Near me now
              </p>
              <p className={`mt-1 max-w-[14rem] font-sans text-[9px] leading-relaxed ${subMuted}`}>
                {typeof navigator !== 'undefined' && navigator.geolocation
                  ? trackNearby
                    ? 'Following you — map and list refresh as you move (~130m+ or every 2 min). Never stored on a server.'
                    : 'One-time location for this session. Turn on follow to keep updating as you travel.'
                  : 'Location not available in this browser.'}
              </p>
            </div>
            {typeof navigator !== 'undefined' && navigator.geolocation && (
              <button
                type="button"
                role="switch"
                aria-checked={trackNearby}
                onClick={onToggleTrackNearby}
                className={`shrink-0 rounded-full border px-3 py-2 font-sans text-[9px] font-semibold uppercase tracking-wider transition-colors min-h-[44px] ${
                  trackNearby
                    ? isTheophany
                      ? 'border-theophany-accent bg-theophany-accent/25 text-theophany-text'
                      : 'border-sanctuary-accent bg-sanctuary-accent/20 text-sanctuary-text'
                    : isTheophany
                      ? 'border-theophany-muted/50 text-theophany-muted hover:bg-black/30'
                      : 'border-sanctuary-muted/40 text-sanctuary-muted hover:bg-black/[0.04]'
                }`}
              >
                {trackNearby ? '● Following' : '○ Follow me'}
              </button>
            )}
          </div>
          <p className={`mt-2 font-sans text-[9px] ${subMuted}`}>
            Map: ring = opened · gold glow = finished walkthrough · larger dot = saved
          </p>
          <div className="mt-3 overflow-hidden rounded-xl border border-black/10 shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
            <Suspense fallback={<div className="btw-map-canvas flex items-center justify-center bg-sanctuary-bg/60"><p className="font-serif text-xs italic text-sanctuary-muted opacity-60">Loading map…</p></div>}>
              <Map
                ref={mapRef}
                mode={mode}
                places={filteredPlaces}
                mapCenter={mapCenter}
                visitedIds={visitedIds}
                savedIds={savedIds}
                walkthroughDoneIds={walkthroughDoneIds}
                selectedPlaceId={selectedPlaceId}
                onMarkerSelect={onMarkerSelect}
                heightClass="btw-map-canvas"
                zoom={7.4}
              />
            </Suspense>
          </div>
        </div>

        {darkHorsePlaces.length > 0 && (
          <div className="px-4 pt-8">
            <p
              className={`font-sans text-[10px] uppercase tracking-[0.35em] ${
                isTheophany ? 'text-theophany-muted' : 'text-sanctuary-muted'
              }`}
            >
              Dark horse
            </p>
            <p className={`mt-1 max-w-md font-sans text-[11px] leading-relaxed ${subMuted}`}>
              Quiet corners — older or seldom-flagged spots that deserve another look.
            </p>
            <div className="-mx-1 mt-3 flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
              {darkHorsePlaces.map((p) => (
                <Link
                  key={p.id}
                  to={`/place/${p.id}`}
                  className={`min-w-[200px] max-w-[220px] shrink-0 rounded-lg border p-3 transition-colors ${
                    isTheophany
                      ? 'border-theophany-muted/35 bg-black/30 hover:border-theophany-accent/40'
                      : 'border-sanctuary-muted/30 bg-white/70 hover:border-sanctuary-accent/35'
                  }`}
                >
                  <p className={`font-display text-sm leading-tight ${isTheophany ? 'text-theophany-text' : 'text-sanctuary-text'}`}>
                    {p.name}
                  </p>
                  <p className={`mt-1 font-sans text-[9px] ${subMuted}`}>
                    {p.city}, {p.state}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        <p className="px-4 pt-3 font-sans text-[10px] uppercase tracking-wider opacity-50">
          {feedKind === 'nearby' && 'Showing places in PA · NJ · NY'}
          {feedKind === 'mixed' && 'Showing nearby places + more from PA · NJ · NY'}
          {feedKind === 'fallback' && 'Showing places in PA · NJ · NY'}
        </p>

        <div className="px-4 pt-2">
          <p
            className={`font-sans text-[10px] uppercase tracking-[0.35em] ${
              isTheophany ? 'text-theophany-muted' : 'text-sanctuary-muted'
            }`}
          >
            Nearby
          </p>
        </div>

        <div className="space-y-4 p-4 pb-[max(6rem,calc(1.5rem+env(safe-area-inset-bottom,0px)))]">
          {(locationDenied && !locationReady) || showPickerFallback ? (
            <div className="pt-8 text-center">
              <p className={`font-sans text-[10px] uppercase tracking-[0.25em] ${subMuted}`}>
                {locationDenied ? 'Location access not available' : 'Having trouble finding places near you'}
              </p>
              <p className={`mt-1 font-serif text-sm italic leading-relaxed ${subMuted}`}>
                Where are you exploring?
              </p>
              <div className="mt-5 flex justify-center gap-3">
                {['PA', 'NJ', 'NY'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handlePickState(st)}
                    className={`min-h-[44px] rounded-lg border-2 px-7 py-2.5 font-display text-base tracking-[0.25em] transition-colors ${
                      isTheophany
                        ? 'border-theophany-accent/60 text-theophany-accent hover:bg-theophany-accent/15'
                        : 'border-sanctuary-accent/50 text-sanctuary-text hover:bg-sanctuary-accent/10'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
              <p className={`mt-4 font-sans text-[9px] uppercase tracking-wider ${subMuted} opacity-60`}>
                Shows places closest to that region
              </p>
            </div>
          ) : loading ? (
            <p className="pt-8 text-center font-serif italic opacity-60">Finding nearby spaces...</p>
          ) : filteredPlaces.length === 0 ? (
            <div className="space-y-3 pt-12 text-center">
              <p className="font-serif italic opacity-60">
                {places.length === 0 ? 'No places here yet.' : 'Nothing matches these filters — try clearing intention or saved-only.'}
              </p>
              {places.length === 0 && (
                <p className="font-sans text-xs uppercase tracking-wider opacity-40">Be the first to add one.</p>
              )}
            </div>
          ) : (
            filteredPlaces.flatMap((place, i) => {
              const cards = [
                <PlaceCard
                  key={place.id}
                  place={place}
                  isTheophany={isTheophany}
                  animIndex={i}
                  onSaveToggle={() => setLocalTick((t) => t + 1)}
                  isSelected={selectedPlaceId === place.id}
                  setCardRef={(node) => setCardRef(place.id, node)}
                  onFocusMap={() => onFocusPlaceOnMap(place.id)}
                />
              ]
              if ((i + 1) % 4 === 0) {
                cards.push(
                  <MockAdSlot key={`ad-slot-${place.id}`} index={Math.floor(i / 4)} isTheophany={isTheophany} />
                )
              }
              return cards
            })
          )}
        </div>
      </div>

      <Link
        to="/submit"
        style={{
          bottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px))',
          right: 'max(1.5rem, env(safe-area-inset-right, 0px))'
        }}
        className={`absolute z-50 flex h-14 w-14 min-h-[48px] min-w-[48px] items-center justify-center rounded-full text-2xl shadow-[0_10px_40px_rgba(0,0,0,0.35)] transition-transform duration-300 hover:scale-110 active:scale-95 ${
          isTheophany ? 'bg-theophany-accent text-theophany-bg' : 'bg-sanctuary-accent text-sanctuary-bg'
        }`}
        title="Submit a place"
        aria-label="Submit a place"
      >
        +
      </Link>

      <footer
        className={`relative z-10 flex items-center justify-center gap-6 border-t px-4 py-3 ${
          isTheophany
            ? 'border-theophany-accent/20 bg-theophany-bg/80'
            : 'border-sanctuary-accent/15 bg-sanctuary-bg/80'
        }`}
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))' }}
      >
        <Link
          to="/about"
          className={`min-h-[44px] inline-flex items-center font-sans text-[10px] uppercase tracking-[0.18em] ${subMuted}`}
        >
          About
        </Link>
        <span className={`text-[10px] ${subMuted} opacity-40`} aria-hidden>·</span>
        <Link
          to="/faq"
          className={`min-h-[44px] inline-flex items-center font-sans text-[10px] uppercase tracking-[0.18em] ${subMuted}`}
        >
          FAQ
        </Link>
        <span className={`text-[10px] ${subMuted} opacity-40`} aria-hidden>·</span>
        <Link
          to="/submit"
          className={`min-h-[44px] inline-flex items-center font-sans text-[10px] uppercase tracking-[0.18em] ${subMuted}`}
        >
          Submit a place
        </Link>
      </footer>
    </div>
  )
}

function formatDist(km) {
  if (km == null) return null
  if (km < 1) return `${Math.round(km * 1000)} m away`
  if (km < 10) return `${km.toFixed(1)} km away`
  return `${Math.round(km)} km away`
}

function PlaceCard({
  place,
  isTheophany,
  onSaveToggle,
  animIndex = 0,
  isSelected = false,
  setCardRef = null,
  onFocusMap = null
}) {
  const navigate = useNavigate()
  const type = placeTypeLabel(place)
  const { label: timeLabel } = photoForPlaceAtTime(place)
  const [saved, setSaved] = useState(() => isSaved(place.id))

  useEffect(() => {
    setSaved(isSaved(place.id))
  }, [place.id])

  const onSave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setSaved(toggleSaved(place.id))
    onSaveToggle?.()
  }

  return (
    <div
      ref={(node) => setCardRef?.(node)}
      className="relative mb-2.5 bf-enter-card"
      style={{ animationDelay: `${Math.min(animIndex, 18) * 42}ms` }}
    >
      <button
        type="button"
        onClick={onSave}
        className={`absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full border text-lg shadow-md transition-colors ${
          isTheophany
            ? saved
              ? 'border-theophany-accent bg-black/60 text-theophany-accent'
              : 'border-white/20 bg-black/50 text-white/80 hover:bg-black/70'
            : saved
              ? 'border-sanctuary-accent bg-white/95 text-sanctuary-accent'
              : 'border-sanctuary-accent/40 bg-white/90 text-sanctuary-muted hover:bg-white'
        }`}
        aria-label={saved ? 'Remove from saved' : 'Save place'}
        title={saved ? 'Saved' : 'Save'}
      >
        {saved ? '♥' : '♡'}
      </button>
      {/* div+navigate — not <a><button/></a> (invalid; Locate on map would not fire reliably) */}
      <div
        role="link"
        tabIndex={0}
        aria-label={`Open ${place.name}`}
        onClick={() => navigate(`/place/${place.id}`)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            navigate(`/place/${place.id}`)
          }
        }}
        className={`group block cursor-pointer overflow-hidden rounded-xl border text-left shadow-sm transition-all duration-500 ease-out hover:-translate-y-1.5 ${
          isTheophany
            ? 'border-violet-950/55 bg-[rgba(10,6,20,0.92)] hover:border-theophany-accent/35 hover:shadow-[0_28px_64px_-16px_rgba(60,20,80,0.55)]'
            : 'border-sanctuary-accent/25 bg-[rgba(255,253,247,0.97)] hover:shadow-[0_24px_56px_-20px_rgba(80,50,15,0.2)]'
        } ${isSelected
          ? isTheophany
            ? 'ring-2 ring-theophany-accent/60'
            : 'ring-2 ring-sanctuary-accent/60'
          : ''}`}
      >
        <div
          className={`relative aspect-[4/3] w-full max-h-[min(72vmin,380px)] overflow-hidden sm:max-h-[320px] ${
            isTheophany ? 'bg-[#0c0618]' : 'bg-[#f5ead5]'
          }`}
        >
          <PlaceImage
            place={place}
            isTheophany={isTheophany}
            imgClassName={`h-full w-full object-cover transition-transform duration-[1.15s] ease-out will-change-transform group-hover:scale-[1.06] ${
              isTheophany ? 'brightness-[0.48] saturate-[0.18]' : 'brightness-105 saturate-70'
            }`}
          />
          {!isTheophany && (
            <>
              <div className="bf-card-candle pointer-events-none absolute inset-0" aria-hidden />
              <div className="bf-card-fog pointer-events-none absolute inset-0" aria-hidden />
            </>
          )}
          <div
            className={`absolute inset-0 ${
              isTheophany
                ? 'bg-gradient-to-t from-[rgba(4,10,14,0.97)] via-transparent to-transparent'
                : 'bg-gradient-to-t from-[rgba(255,253,247,0.95)] via-transparent to-transparent'
            }`}
          />
          {timeLabel && (
            <div className="absolute right-14 top-2.5 z-10 rounded bg-black/45 px-2 py-0.5 font-sans text-[8px] uppercase tracking-wider text-white/85">
              {timeLabel}
            </div>
          )}
          <div className="absolute left-2.5 top-2.5 rounded bg-black/60 px-2 py-0.5 font-sans text-[9px] uppercase tracking-wider text-white/90">
            {type}
          </div>
          <div className="absolute bottom-2.5 left-2.5">
            <SourceBadge source={place.source} compact />
          </div>
          {isTheophany && place.intensity != null && <IntensityBar level={place.intensity} isTheophany />}
        </div>

        <div className="px-4 py-3.5">
          <div className="relative z-10 mb-2 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onFocusMap?.()
              }}
              className={`relative z-20 rounded-md border px-2.5 py-1 font-sans text-[9px] uppercase tracking-[0.18em] transition-colors ${
                isTheophany
                  ? 'border-theophany-accent/45 text-theophany-accent hover:bg-theophany-accent/15'
                  : 'border-sanctuary-accent/45 text-sanctuary-accent hover:bg-sanctuary-accent/15'
              }`}
            >
              Locate on map
            </button>
            {isSelected && (
              <span className={`font-sans text-[9px] uppercase tracking-[0.18em] ${isTheophany ? 'text-theophany-accent' : 'text-sanctuary-accent'}`}>
                Selected
              </span>
            )}
          </div>
          <h3
            className={`font-display mb-1 text-[16px] leading-snug tracking-wide ${
              isTheophany ? 'text-[#ece8f4]' : 'text-sanctuary-text'
            }`}
          >
            {place.name}
          </h3>
          <p
            className={`mb-2 font-sans text-[9px] uppercase tracking-[0.12em] ${
              isTheophany ? 'text-violet-400/45' : 'text-sanctuary-muted'
            }`}
          >
            {place.city}, {place.state}
            {formatDist(place._distKm) && (
              <span className={`ml-2 ${isTheophany ? 'text-theophany-accent/70' : 'text-sanctuary-accent/80'}`}>
                · {formatDist(place._distKm)}
              </span>
            )}
          </p>
          {place.description && (
            <p
              className={`line-clamp-2 font-serif text-xs italic leading-relaxed ${
                isTheophany ? 'text-violet-300/40' : 'text-sanctuary-muted'
              }`}
            >
              {place.description}
            </p>
          )}
          {place.traditions && (
            <p className={`mt-2 font-sans text-[11px] ${isTheophany ? 'text-theophany-muted/80' : 'text-sanctuary-muted'}`}>
              Traditions: {place.traditions}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
