import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase, hasSupabaseEnv } from '../lib/supabase'
import Map from '../components/Map'
import Starfield from '../components/Starfield'
import { getDailyOmen } from '../data/omens'
import { INTENSITY_LEVELS } from '../data/intensityLegend'
import { fetchActivityFeed } from '../lib/feed'
import ActivityFeed from '../components/ActivityFeed'
import MockAdSlot from '../components/MockAdSlot'
import InstallPwaPrompt from '../components/InstallPwaPrompt'
import SourceBadge from '../components/SourceBadge'

const DEFAULT_CENTER = { lat: 39.9526, lng: -75.1652 }
/** ~350km — PA/NJ/NY seeds span hundreds of km; 10km hid almost everything. */
const NEARBY_RADIUS_M = 350000
const PLACES_LIST_CAP = 24

function readInitialMode() {
  const m = sessionStorage.getItem('between_initial_mode')
  sessionStorage.removeItem('between_initial_mode')
  if (m === 'sanctuary' || m === 'theophany') return m
  return 'sanctuary'
}

function placeTypeLabel(place) {
  if (place.category_tags?.length) return place.category_tags[0]
  if (place.mode === 'both') return 'Both'
  return 'Place'
}

function IntensityBar({ level }) {
  if (level == null || level < 1 || level > 5) return null
  const meta = INTENSITY_LEVELS[level - 1]
  return (
    <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <div
          key={n}
          className="h-[3px] w-3 rounded-sm"
          style={{ background: n <= level ? meta.c : 'rgba(255,255,255,0.1)' }}
        />
      ))}
      <span className="ml-1 font-sans text-[9px] uppercase tracking-wider" style={{ color: meta.c }}>
        {meta.label}
      </span>
    </div>
  )
}

export default function Home() {
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

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      },
      () => {},
      { timeout: 12000, maximumAge: 120000 }
    )
  }, [])

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

  const fetchPlaces = useCallback(async () => {
    setLoading(true)
    if (!hasSupabaseEnv || !supabase) {
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

    const nearby = !rpcError && rpcData?.length ? [...rpcData] : []
    const seen = new Set(nearby.map((p) => p.id))

    if (nearby.length < PLACES_LIST_CAP) {
      const { data: more } = await supabase
        .from('places')
        .select('*')
        .or(`mode.eq.${mode},mode.eq.both`)
        .order('created_at', { ascending: false })
        .limit(60)

      for (const p of more || []) {
        if (nearby.length >= PLACES_LIST_CAP) break
        if (!seen.has(p.id)) {
          seen.add(p.id)
          nearby.push(p)
        }
      }
    }

    if (rpcError || !rpcData?.length) {
      setFeedKind('fallback')
    } else if (nearby.length > rpcData.length) {
      setFeedKind('mixed')
    } else {
      setFeedKind('nearby')
    }

    setPlaces(nearby.slice(0, PLACES_LIST_CAP))
    setLoading(false)
  }, [center.lat, center.lng, mode])

  useEffect(() => {
    fetchPlaces()
  }, [fetchPlaces])

  const isTheophany = mode === 'theophany'
  const mapCenter = [center.lng, center.lat]

  return (
    <div
      className={`relative flex min-h-0 flex-1 flex-col overflow-hidden ${
        isTheophany
          ? 'bg-gradient-to-b from-theophany-bg via-theophany-primary to-theophany-secondary text-theophany-text'
          : 'bg-gradient-to-br from-sanctuary-bg via-sanctuary-primary to-sanctuary-secondary text-sanctuary-text'
      }`}
    >
      {isTheophany && <Starfield />}
      {isTheophany && (
        <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_center,transparent_18%,rgba(0,0,0,0.72)_100%)]" />
      )}
      {!isTheophany && (
        <div className="pointer-events-none absolute left-1/2 top-0 z-[1] h-[220px] w-[160%] max-w-none -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,rgba(255,230,155,0.45)_0%,transparent_65%)]" />
      )}

      <div
        className={`sticky top-0 z-40 flex shrink-0 items-center justify-between p-4 pt-6 ${
          isTheophany ? 'bg-theophany-bg/90 backdrop-blur-sm' : 'bg-sanctuary-bg/90 backdrop-blur-sm'
        }`}
      >
        <div className="flex items-center gap-3">
          <h1 className="font-display text-xl tracking-[0.35em]">Between</h1>
          <div className="hidden gap-2 sm:flex">
            <Link
              to="/about"
              className={`font-sans text-[9px] uppercase tracking-[0.18em] ${
                isTheophany ? 'text-theophany-muted' : 'text-sanctuary-muted'
              }`}
            >
              About
            </Link>
            <Link
              to="/faq"
              className={`font-sans text-[9px] uppercase tracking-[0.18em] ${
                isTheophany ? 'text-theophany-muted' : 'text-sanctuary-muted'
              }`}
            >
              FAQ
            </Link>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode('sanctuary')}
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
            onClick={() => setMode('theophany')}
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

      <div className="relative z-10 min-h-0 flex-1 overflow-y-auto overflow-x-hidden pt-3">
        <div className="px-4 text-center">
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
        </div>

        <div className="pt-4">
          <InstallPwaPrompt isTheophany={isTheophany} />
          <ActivityFeed
            recentPlaces={feed.recentPlaces}
            recentReports={feed.recentReports}
            trendingPlaces={feed.trendingPlaces}
            isTheophany={isTheophany}
            loading={feedLoading}
          />
        </div>

        <div className="px-4 pt-2">
          <p
            className={`font-sans text-[10px] uppercase tracking-[0.35em] ${
              isTheophany ? 'text-theophany-muted' : 'text-sanctuary-muted'
            }`}
          >
            Map
          </p>
        </div>
        <div className="pt-3">
          <Map mode={mode} places={places} mapCenter={mapCenter} />
        </div>

        {isTheophany && (
          <div className="mx-4 mt-3 rounded-md border border-[#0a2020] bg-black/45 px-3 py-3.5 text-center">
            <div className="mb-2 font-sans text-[8px] uppercase tracking-[0.35em] text-[#1e4040]">
              Today&apos;s omen
            </div>
            <p className="m-0 font-serif text-sm italic leading-relaxed text-[#7ac8c8]">{omen}</p>
          </div>
        )}

        {isTheophany && (
          <div className="mx-4 mt-3 rounded border border-[#0a1818] bg-black/28 px-3 py-2.5">
            <div className="mb-2 font-sans text-[8px] uppercase tracking-[0.3em] text-[#1e4040]">
              Intensity scale
            </div>
            <div className="flex flex-wrap gap-2.5">
              {INTENSITY_LEVELS.map((l) => (
                <div key={l.label} className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full" style={{ background: l.c }} />
                  <span className="font-sans text-[8px]" style={{ color: l.c }}>
                    {l.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="px-4 pt-3 font-sans text-[10px] uppercase tracking-wider opacity-50">
          {feedKind === 'nearby' && `Within ~${NEARBY_RADIUS_M / 1000} km of map center · mode filter`}
          {feedKind === 'mixed' &&
            `Nearest within ~${NEARBY_RADIUS_M / 1000} km, then more from the catalog to fill the list`}
          {feedKind === 'fallback' &&
            'Catalog order (no nearby match or spatial RPC unavailable — ensure seed SQL ran in Supabase)'}
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

        <div className="space-y-4 p-4 pb-24">
          {loading ? (
            <p className="pt-8 text-center font-serif italic opacity-60">Finding nearby spaces...</p>
          ) : places.length === 0 ? (
            <div className="space-y-3 pt-12 text-center">
              <p className="font-serif italic opacity-60">No places here yet.</p>
              <p className="font-sans text-xs uppercase tracking-wider opacity-40">Be the first to add one.</p>
            </div>
          ) : (
            places.flatMap((place, i) => {
              const cards = [
                <PlaceCard key={place.id} place={place} isTheophany={isTheophany} />
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
        className={`absolute bottom-6 right-6 z-30 flex h-12 w-12 items-center justify-center rounded-full text-2xl shadow-lg transition-colors ${
          isTheophany ? 'bg-theophany-accent text-theophany-bg' : 'bg-sanctuary-accent text-sanctuary-bg'
        }`}
        title="Submit a place"
      >
        +
      </Link>
    </div>
  )
}

function PlaceCard({ place, isTheophany }) {
  const type = placeTypeLabel(place)
  const img = place.photos?.[0]

  return (
    <Link to={`/place/${place.id}`} className="block">
      <div
        className={`mb-2.5 overflow-hidden rounded-xl border shadow-sm transition-opacity hover:opacity-95 ${
          isTheophany
            ? 'border-[#0e2828] bg-[rgba(4,10,14,0.95)]'
            : 'border-sanctuary-accent/25 bg-[rgba(255,253,247,0.97)]'
        }`}
      >
        <div
          className={`relative aspect-[4/3] w-full overflow-hidden sm:max-h-[320px] ${
            isTheophany ? 'bg-[#050c10]' : 'bg-[#f5ead5]'
          }`}
        >
          {img ? (
            <img
              src={img}
              alt=""
              className={`h-full w-full object-cover ${
                isTheophany ? 'brightness-[0.48] saturate-[0.18]' : 'brightness-105 saturate-70'
              }`}
            />
          ) : (
            <div className={`h-full w-full ${isTheophany ? 'bg-gradient-to-b from-[#0a1518] to-[#030608]' : 'bg-gradient-to-b from-[#e8dcc8] to-[#d4c4a8]'}`} />
          )}
          <div
            className={`absolute inset-0 ${
              isTheophany
                ? 'bg-gradient-to-t from-[rgba(4,10,14,0.97)] via-transparent to-transparent'
                : 'bg-gradient-to-t from-[rgba(255,253,247,0.95)] via-transparent to-transparent'
            }`}
          />
          <div className="absolute left-2.5 top-2.5 rounded bg-black/60 px-2 py-0.5 font-sans text-[9px] uppercase tracking-wider text-white/90">
            {type}
          </div>
          <div className="absolute bottom-2.5 left-2.5">
            <SourceBadge source={place.source} compact />
          </div>
          {isTheophany && place.intensity != null && <IntensityBar level={place.intensity} />}
        </div>

        <div className="px-4 py-3.5">
          <h3
            className={`font-display mb-1 text-[16px] leading-snug tracking-wide ${
              isTheophany ? 'text-[#c8e8e8]' : 'text-sanctuary-text'
            }`}
          >
            {place.name}
          </h3>
          <p
            className={`mb-2 font-sans text-[9px] uppercase tracking-[0.12em] ${
              isTheophany ? 'text-[#2a5858]' : 'text-sanctuary-muted'
            }`}
          >
            {place.city}, {place.state}
          </p>
          {place.description && (
            <p
              className={`line-clamp-2 font-serif text-xs italic leading-relaxed ${
                isTheophany ? 'text-[#507070]' : 'text-sanctuary-muted'
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
    </Link>
  )
}
