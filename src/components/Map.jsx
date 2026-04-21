import { useEffect, useRef, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { mapboxToken, hasMapboxEnv } from '../lib/env'

mapboxgl.accessToken = mapboxToken

/** Opens native navigation (Apple Maps on iOS, Google Maps elsewhere). */
function directionsUrl(lngLat, name) {
  const [lng, lat] = lngLat
  const dest = `${lat},${lng}`
  const label = encodeURIComponent(name)
  // Apple Maps handles the deep-link on iOS/macOS; other platforms fall back
  // to a Google Maps web URL which can open the installed app.
  const isApple = /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent) && !window.MSStream
  if (isApple) return `https://maps.apple.com/?daddr=${dest}&dirflg=d&t=m&q=${label}`
  return `https://www.google.com/maps/dir/?api=1&destination=${dest}&destination_place_name=${label}`
}

/** Popup HTML with name, city/state, address (if known), and a directions link. */
function popupHTML(place, coords) {
  const addr = place.address ? `<p style="margin:2px 0 6px;font-size:11px;opacity:0.75;">${place.address} · ${place.city}, ${place.state}</p>` : `<p style="margin:2px 0 6px;font-size:11px;opacity:0.75;">${place.city}, ${place.state}</p>`
  const link = directionsUrl(coords, place.name)
  return `<strong style="font-size:13px;">${place.name}</strong>${addr}<a href="${link}" target="_blank" rel="noopener noreferrer" style="display:inline-block;font-size:11px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;color:#c8a870;text-decoration:none;">Get Directions →</a>`
}

export default function Map({
  mode,
  places,
  mapCenter = [-75.1652, 39.9526],
  zoom = 11,
  visitedIds = null,
  savedIds = null,
  walkthroughDoneIds = null,
  /** e.g. h-72 md:min-h-[360px] for "near me" discovery */
  heightClass = 'h-56'
}) {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const markersRef = useRef([])
  const geolocateRef = useRef(null)
  // Mirrors the latest mode so the style.load callback sees the current value
  const pendingModeRef = useRef(mode)

  const placeMarkers = useCallback(() => {
    if (!map.current) return
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    const currentMode = pendingModeRef.current
    let placed = 0

    places.forEach((place) => {
      if (!place.coordinates) return

      // Supabase PostgREST returns PostGIS geography as GeoJSON.
      // Skip if format is unexpected — never plot at 0,0.
      const raw = place.coordinates
      let coords
      if (raw && typeof raw === 'object' && Array.isArray(raw.coordinates)) {
        coords = raw.coordinates // [lng, lat]
      } else {
        return
      }
      // Sanity-check: valid lng/lat ranges
      if (coords[0] < -180 || coords[0] > 180 || coords[1] < -90 || coords[1] > 90) return

      const visited = visitedIds?.has?.(place.id)
      const saved = savedIds?.has?.(place.id)
      const walked = walkthroughDoneIds?.has?.(place.id)

      const el = document.createElement('div')
      el.className = 'between-marker'
      const base = currentMode === 'theophany' ? '#a78bfa' : '#c8a870'
      const ring = walked
        ? currentMode === 'theophany'
          ? '0 0 0 3px rgba(192,167,255,0.92)'
          : '0 0 0 3px rgba(255,200,120,0.95)'
        : visited
          ? '0 0 0 2px rgba(255,255,255,0.85)'
          : 'none'
      const size = saved ? 14 : 12
      el.style.cssText = `
        width:${size}px;height:${size}px;border-radius:50%;
        background:${base};
        border:2px solid ${currentMode === 'theophany' ? '#1e0b32' : '#fffef8'};
        box-shadow:${ring};cursor:pointer;
        transition:transform 0.15s ease;
      `
      el.addEventListener('mouseenter', () => { el.style.transform = 'scale(1.4)' })
      el.addEventListener('mouseleave', () => { el.style.transform = 'scale(1)' })

      const marker = new mapboxgl.Marker(el)
        .setLngLat(coords)
        .setPopup(
          new mapboxgl.Popup({ offset: 18, maxWidth: '220px' })
            .setHTML(popupHTML(place, coords))
        )
        .addTo(map.current)
      markersRef.current.push(marker)
      placed++
    })

    console.log(`[Between Map] ${placed} markers placed from ${places.length} places`)
  }, [places, visitedIds, savedIds, walkthroughDoneIds])

  // Always keep a ref to the latest placeMarkers so style.load callbacks
  // never capture a stale closure.
  const placeMarkersRef = useRef(placeMarkers)
  useEffect(() => {
    placeMarkersRef.current = placeMarkers
  }, [placeMarkers])

  // Initialize map once per mount.
  // rAF defers until after the browser has laid out the lazy-loaded container
  // so Mapbox reads real CSS dimensions rather than 0×0.
  useEffect(() => {
    if (!hasMapboxEnv) return
    if (map.current) return

    let raf
    raf = requestAnimationFrame(() => {
      if (!mapContainer.current || map.current) return

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: pendingModeRef.current === 'theophany'
          ? 'mapbox://styles/mapbox/dark-v11'
          : 'mapbox://styles/mapbox/light-v11',
        center: mapCenter,
        zoom,
        scrollZoom: false,
      })

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

      geolocateRef.current = new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true,
      })
      map.current.addControl(geolocateRef.current, 'top-right')

      map.current.on('load', () => {
        map.current?.resize()
        placeMarkersRef.current()
        setTimeout(() => geolocateRef.current?.trigger(), 600)
      })

      map.current.on('error', (e) => {
        console.error('[Mapbox]', e.error?.message ?? e)
      })
    })

    return () => cancelAnimationFrame(raf)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMapboxEnv])

  // ResizeObserver: re-measure canvas on container size changes.
  useEffect(() => {
    const container = mapContainer.current
    if (!container) return
    const ro = new ResizeObserver(() => map.current?.resize())
    ro.observe(container)
    return () => ro.disconnect()
  }, [])

  // Re-center when user location updates
  useEffect(() => {
    if (!map.current || !hasMapboxEnv) return
    map.current.jumpTo({ center: mapCenter, zoom })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapCenter[0], mapCenter[1], zoom, hasMapboxEnv])

  // Update map style ONLY when mode changes — not when places change.
  // placeMarkersRef ensures the once('style.load') always calls the latest
  // marker snapshot without adding placeMarkers as a dep (which caused
  // setStyle() to fire on every places update, wiping all markers).
  useEffect(() => {
    if (!map.current) return
    pendingModeRef.current = mode
    const style = mode === 'theophany'
      ? 'mapbox://styles/mapbox/dark-v11'
      : 'mapbox://styles/mapbox/light-v11'
    map.current.once('style.load', () => placeMarkersRef.current())
    map.current.setStyle(style)
  }, [mode])

  // Re-place markers whenever places or visit/save status sets change.
  // If the style is already loaded, place immediately.
  // If not (e.g. places arrive while a style transition is in progress),
  // register a one-time listener so markers appear as soon as it's ready.
  useEffect(() => {
    if (!map.current) return
    if (map.current.isStyleLoaded()) {
      placeMarkers()
    } else {
      map.current.once('style.load', () => placeMarkersRef.current())
    }
  }, [placeMarkers])

  // Destroy map on unmount
  useEffect(() => {
    return () => {
      markersRef.current.forEach((m) => m.remove())
      markersRef.current = []
      geolocateRef.current = null
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  if (!hasMapboxEnv) {
    return (
      <div className={`w-full ${heightClass} flex items-center justify-center bg-black/5 text-center px-4`}>
        <p className="font-sans text-xs uppercase tracking-wider opacity-60">
          Map unavailable — set VITE_MAPBOX_TOKEN.
        </p>
      </div>
    )
  }

  return (
    <div
      ref={mapContainer}
      className={`w-full ${heightClass} ${mode === 'theophany' ? 'map-theophany' : 'map-sanctuary'}`}
      style={mode === 'theophany' ? { filter: 'brightness(1.35) contrast(0.88)' } : undefined}
    />
  )
}
