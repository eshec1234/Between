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

      // Coordinates from PostGIS are stored as GeoJSON
      const coords = place.coordinates.coordinates || [-75.1652, 39.9526]

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

  // Initialize map once per mount
  useEffect(() => {
    if (!hasMapboxEnv) return
    if (map.current) return

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: mode === 'theophany'
        ? 'mapbox://styles/mapbox/dark-v11'
        : 'mapbox://styles/mapbox/light-v11',
      center: mapCenter,
      zoom,
      // Prevent the map from hijacking page scroll on desktop (mouse wheel) —
      // users can still zoom with the nav control buttons.
      scrollZoom: false,
    })

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

    geolocateRef.current = new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
      showUserHeading: true,
    })
    map.current.addControl(geolocateRef.current, 'top-right')

    // Resize after Suspense/lazy container settles to its final CSS dimensions,
    // paint initial markers, then auto-trigger geolocation so the map centers
    // on the user without them having to tap the locate button manually.
    map.current.on('load', () => {
      map.current?.resize()
      placeMarkers()
      // Small delay lets the browser prompt for location permission naturally
      // after the map paint settles rather than racing the initial render.
      setTimeout(() => {
        geolocateRef.current?.trigger()
      }, 600)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMapboxEnv])

  // Re-center when user location updates
  useEffect(() => {
    if (!map.current || !hasMapboxEnv) return
    map.current.jumpTo({ center: mapCenter, zoom })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapCenter[0], mapCenter[1], zoom, hasMapboxEnv])

  // Update map style when mode changes; re-place markers after new style loads
  useEffect(() => {
    if (!map.current) return
    pendingModeRef.current = mode
    const style = mode === 'theophany'
      ? 'mapbox://styles/mapbox/dark-v11'
      : 'mapbox://styles/mapbox/light-v11'
    // Re-place markers once the incoming style has finished loading so they
    // pick up the correct mode colours.
    map.current.once('style.load', placeMarkers)
    map.current.setStyle(style)
  }, [mode, placeMarkers])

  // Re-place markers whenever places or visit/save status sets change
  useEffect(() => {
    if (!map.current) return
    // Guard against racing the initial style.load handler
    if (!map.current.isStyleLoaded()) return
    placeMarkers()
  }, [placeMarkers])

  // Respond to viewport / orientation changes
  useEffect(() => {
    const onResize = () => map.current?.resize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

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
