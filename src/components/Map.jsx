import { useEffect, useRef, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { mapboxToken, hasMapboxEnv } from '../lib/env'

mapboxgl.accessToken = mapboxToken

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
    if (!places.length) return

    const currentMode = pendingModeRef.current

    places.forEach((place) => {
      if (!place.coordinates) return

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
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: ${base};
        border: 2px solid ${currentMode === 'theophany' ? '#1e0b32' : '#fffef8'};
        box-shadow: ${ring};
        cursor: pointer;
      `

      // Coordinates from PostGIS are returned as GeoJSON by Supabase PostgREST.
      // Fall back to the default center if parsing fails.
      const raw = place.coordinates
      let coords
      if (raw && typeof raw === 'object' && Array.isArray(raw.coordinates)) {
        coords = raw.coordinates
      } else if (raw && typeof raw === 'string') {
        // Older PostgREST may return WKB hex — skip rather than plot at 0,0
        return
      } else {
        return
      }

      const marker = new mapboxgl.Marker(el)
        .setLngLat(coords)
        .setPopup(
          new mapboxgl.Popup({ offset: 16 })
            .setHTML(`<strong>${place.name}</strong><br/><em>${place.city}, ${place.state}</em>`)
        )
        .addTo(map.current)
      markersRef.current.push(marker)
    })
  }, [places, visitedIds, savedIds, walkthroughDoneIds])

  // Always keep a ref to the latest placeMarkers so style.load callbacks
  // never capture a stale closure — this is the key fix for the race condition
  // where changing mode fired setStyle on every places update.
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

  // ResizeObserver: whenever the container changes size (e.g. after lazy CSS
  // applies or orientation changes) tell Mapbox to re-measure the canvas.
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

  // Update map style ONLY when mode changes — NOT when places change.
  // Previously, placeMarkers was in the dep array, which caused setStyle() to
  // fire on every data refresh (clearing all markers). Now we use placeMarkersRef
  // so the once('style.load') handler always calls the latest marker snapshot
  // without creating a new effect dependency.
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
  // The style-change effect above is intentionally separate so updating places
  // never triggers a full map style reload.
  useEffect(() => {
    if (!map.current) return
    if (!map.current.isStyleLoaded()) return
    placeMarkers()
  }, [placeMarkers])

  // Destroy the map on unmount so re-navigation always creates a fresh instance
  // (prevents "container already initialized" errors after lazy re-mount)
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

  return (
    hasMapboxEnv ? (
      <div
        ref={mapContainer}
        className={`w-full ${heightClass} ${mode === 'theophany' ? 'map-theophany' : 'map-sanctuary'}`}
        style={mode === 'theophany' ? { filter: 'brightness(1.35) contrast(0.88)' } : undefined}
      />
    ) : (
      <div className={`w-full ${heightClass} flex items-center justify-center bg-black/5 text-center px-4`}>
        <p className="font-sans text-xs uppercase tracking-wider opacity-60">
          Map unavailable. Set VITE_MAPBOX_TOKEN (or VITE_MAPBOX_ACCESS_TOKEN).
        </p>
      </div>
    )
  )
}
