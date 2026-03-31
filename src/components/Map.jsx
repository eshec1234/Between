import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
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
  /** e.g. h-72 md:min-h-[360px] for “near me” discovery */
  heightClass = 'h-56'
}) {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const markersRef = useRef([])

  useEffect(() => {
    if (!hasMapboxEnv) return
    if (map.current) return

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: mode === 'theophany'
        ? 'mapbox://styles/mapbox/dark-v11'
        : 'mapbox://styles/mapbox/light-v11',
      center: mapCenter,
      zoom
    })

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')
    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true
      })
    )
  }, [hasMapboxEnv])

  useEffect(() => {
    if (!map.current || !hasMapboxEnv) return
    map.current.jumpTo({ center: mapCenter, zoom })
  }, [mapCenter[0], mapCenter[1], zoom, hasMapboxEnv])

  // Update map style when mode changes
  useEffect(() => {
    if (!map.current) return
    const style = mode === 'theophany'
      ? 'mapbox://styles/mapbox/dark-v11'
      : 'mapbox://styles/mapbox/light-v11'
    map.current.setStyle(style)
  }, [mode])

  useEffect(() => {
    return () => {
      markersRef.current.forEach((m) => m.remove())
      markersRef.current = []
    }
  }, [])

  // Add place markers (scoped to this map instance — no global DOM queries)
  useEffect(() => {
    if (!map.current) return
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []
    if (!places.length) return

    places.forEach((place) => {
      if (!place.coordinates) return

      const visited = visitedIds?.has?.(place.id)
      const saved = savedIds?.has?.(place.id)
      const walked = walkthroughDoneIds?.has?.(place.id)

      const el = document.createElement('div')
      el.className = 'between-marker'
      const base = mode === 'theophany' ? '#a78bfa' : '#c8a870'
      const ring = walked
        ? mode === 'theophany'
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
        border: 2px solid ${mode === 'theophany' ? '#1e0b32' : '#fffef8'};
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
  }, [places, mode, visitedIds, savedIds, walkthroughDoneIds])

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
