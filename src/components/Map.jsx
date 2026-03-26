import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

export default function Map({ mode, places }) {
  const hasMapboxToken = Boolean(import.meta.env.VITE_MAPBOX_TOKEN)
  const mapContainer = useRef(null)
  const map = useRef(null)

  useEffect(() => {
    if (!hasMapboxToken) return
    if (map.current) return

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: mode === 'theophany'
        ? 'mapbox://styles/mapbox/dark-v11'
        : 'mapbox://styles/mapbox/light-v11',
      center: [-75.1652, 39.9526], // Philadelphia center
      zoom: 11
    })

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')
    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true
      })
    )
  }, [hasMapboxToken, mode])

  // Update map style when mode changes
  useEffect(() => {
    if (!map.current) return
    const style = mode === 'theophany'
      ? 'mapbox://styles/mapbox/dark-v11'
      : 'mapbox://styles/mapbox/light-v11'
    map.current.setStyle(style)
  }, [mode])

  // Add place markers
  useEffect(() => {
    if (!map.current || !places.length) return

    // Remove existing markers
    document.querySelectorAll('.between-marker').forEach(el => el.remove())

    places.forEach((place) => {
      if (!place.coordinates) return

      const el = document.createElement('div')
      el.className = 'between-marker'
      el.style.cssText = `
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: ${mode === 'theophany' ? '#7ababa' : '#c8a870'};
        border: 2px solid ${mode === 'theophany' ? '#010407' : '#fffef8'};
        cursor: pointer;
      `

      // Coordinates from PostGIS are stored as GeoJSON
      const coords = place.coordinates.coordinates || [-75.1652, 39.9526]

      new mapboxgl.Marker(el)
        .setLngLat(coords)
        .setPopup(
          new mapboxgl.Popup({ offset: 16 })
            .setHTML(`<strong>${place.name}</strong><br/><em>${place.city}, ${place.state}</em>`)
        )
        .addTo(map.current)
    })
  }, [places, mode])

  return (
    hasMapboxToken ? (
      <div
        ref={mapContainer}
        className={`w-full h-56 ${mode === 'theophany' ? 'map-theophany' : 'map-sanctuary'}`}
      />
    ) : (
      <div className="w-full h-56 flex items-center justify-center bg-black/5 text-center px-4">
        <p className="font-sans text-xs uppercase tracking-wider opacity-60">
          Map unavailable. Set VITE_MAPBOX_TOKEN in environment variables.
        </p>
      </div>
    )
  )
}
