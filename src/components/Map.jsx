import { useEffect, useRef, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { mapboxToken, hasMapboxEnv } from '../lib/env'

mapboxgl.accessToken = mapboxToken
const THEOPHANY_STYLE = 'mapbox://styles/mapbox/dark-v11'
const SANCTUARY_STYLE = 'mapbox://styles/mapbox/light-v11'

function styleForMode(mode) {
  return mode === 'theophany' ? THEOPHANY_STYLE : SANCTUARY_STYLE
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
  const geolocateTimerRef = useRef(null)
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

  const destroyMap = useCallback(() => {
    if (geolocateTimerRef.current) {
      clearTimeout(geolocateTimerRef.current)
      geolocateTimerRef.current = null
    }
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []
    geolocateRef.current = null
    if (map.current) {
      map.current.remove()
      map.current = null
    }
  }, [])

  const buildMap = useCallback((nextCenter = mapCenter, nextZoom = zoom) => {
    if (!mapContainer.current || !hasMapboxEnv) return
    destroyMap()

    const nextMap = new mapboxgl.Map({
      container: mapContainer.current,
      style: styleForMode(pendingModeRef.current),
      center: nextCenter,
      zoom: nextZoom,
      scrollZoom: false,
    })
    map.current = nextMap

    nextMap.addControl(new mapboxgl.NavigationControl(), 'top-right')
    geolocateRef.current = new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
      showUserHeading: true,
    })
    nextMap.addControl(geolocateRef.current, 'top-right')

    nextMap.on('load', () => {
      nextMap.resize()
      placeMarkers()
      geolocateTimerRef.current = setTimeout(() => geolocateRef.current?.trigger(), 600)
    })
    nextMap.on('error', (e) => {
      console.error('[Mapbox]', e.error?.message ?? e)
    })
  }, [destroyMap, hasMapboxEnv, mapCenter, placeMarkers, zoom])

  const ensureContainerIntegrity = useCallback((reason) => {
    const container = mapContainer.current
    if (!container || container.classList.contains('mapboxgl-map')) return

    let nextCenter = mapCenter
    let nextZoom = zoom
    if (map.current) {
      try {
        const currentCenter = map.current.getCenter?.()
        if (currentCenter && Number.isFinite(currentCenter.lng) && Number.isFinite(currentCenter.lat)) {
          nextCenter = [currentCenter.lng, currentCenter.lat]
        }
      } catch {
        /* ignore */
      }
      try {
        const currentZoom = map.current.getZoom?.()
        if (Number.isFinite(currentZoom)) nextZoom = currentZoom
      } catch {
        /* ignore */
      }
    }

    console.warn('[Mapbox] Recovering map container integrity', { reason })
    buildMap(nextCenter, nextZoom)
  }, [buildMap, mapCenter, zoom])

  // Initialize map once per mount.
  // rAF defers until after the browser has laid out the lazy-loaded container
  // so Mapbox reads real CSS dimensions rather than 0×0.
  useEffect(() => {
    if (!hasMapboxEnv) return
    if (map.current) return

    let raf
    raf = requestAnimationFrame(() => {
      if (!mapContainer.current || map.current) return
      buildMap()
    })

    return () => cancelAnimationFrame(raf)
  }, [buildMap, hasMapboxEnv])

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

  // Update map style when mode changes; re-place markers after new style loads
  useEffect(() => {
    if (!map.current) return
    pendingModeRef.current = mode
    ensureContainerIntegrity('mode-change-pre-style')
    if (!map.current) return
    const style = styleForMode(mode)
    // Re-place markers once the incoming style has finished loading so they
    // pick up the correct mode colours.
    map.current.once('style.load', () => {
      ensureContainerIntegrity('style-load')
      placeMarkers()
      requestAnimationFrame(() => map.current?.resize())
    })
    map.current.setStyle(style)
    requestAnimationFrame(() => {
      ensureContainerIntegrity('mode-change-post-style')
      map.current?.resize()
    })
  }, [ensureContainerIntegrity, mode, placeMarkers])

  // Re-place markers whenever places or visit/save status sets change
  useEffect(() => {
    if (!map.current) return
    // Guard against racing the initial style.load handler
    if (!map.current.isStyleLoaded()) return
    placeMarkers()
  }, [placeMarkers])


  // Destroy the map on unmount so re-navigation always creates a fresh instance
  // (prevents "container already initialized" errors after lazy re-mount)
  useEffect(() => {
    return () => {
      destroyMap()
    }
  }, [destroyMap])

  return (
    hasMapboxEnv ? (
      <div className={`w-full ${heightClass} ${mode === 'theophany' ? 'map-theophany' : 'map-sanctuary'}`}>
        <div
          ref={mapContainer}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    ) : (
      <div className={`w-full ${heightClass} flex items-center justify-center bg-black/5 text-center px-4`}>
        <p className="font-sans text-xs uppercase tracking-wider opacity-60">
          Map unavailable. Set VITE_MAPBOX_TOKEN (or VITE_MAPBOX_ACCESS_TOKEN).
        </p>
      </div>
    )
  )
}
