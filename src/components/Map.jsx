import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { mapboxToken, hasMapboxEnv } from '../lib/env'
import { lngLatFromPlace } from '../lib/lngLatFromPlace'

mapboxgl.accessToken = mapboxToken
const THEOPHANY_STYLE = 'mapbox://styles/mapbox/dark-v11'
const SANCTUARY_STYLE = 'mapbox://styles/mapbox/light-v11'
/** GeoJSON source + WebGL circles — visible even when HTML Markers fail (Mapbox/scroll/overlay). */
const BF_PLACES_SOURCE = 'bf-places'
const BF_PLACES_LAYER = 'bf-places-circles'

function styleForMode(mode) {
  return mode === 'theophany' ? THEOPHANY_STYLE : SANCTUARY_STYLE
}

const Map = forwardRef(function Map({
  mode,
  places,
  mapCenter = [-75.1652, 39.9526],
  zoom = 11,
  visitedIds: _visitedIds = null,
  savedIds: _savedIds = null,
  walkthroughDoneIds: _walkthroughDoneIds = null,
  selectedPlaceId = null,
  onMarkerSelect = null,
  /** e.g. h-72 md:min-h-[360px] for "near me" discovery */
  heightClass = 'h-56'
}, ref) {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const focusPopupRef = useRef(null)
  const onMarkerSelectRef = useRef(null)
  const geolocateRef = useRef(null)
  const geolocateTimerRef = useRef(null)
  const hasTriggeredGeolocateRef = useRef(false)
  // After "Locate on map" / focusPlace, skip jumpTo(user) so flyTo isn't wiped (GPS + zoom 7.4 reset the view)
  const suppressFollowRecenterUntilRef = useRef(0)
  const pendingFocusRef = useRef(null)
  const applyMapFocusRef = useRef(() => {})
  // Mirrors the latest mode so the style.load callback sees the current value
  const pendingModeRef = useRef(mode)

  /** Fly to a place; stable so imperative handle + map load never see a null ref. */
  const applyMapFocus = useCallback(
    (coords, placeId) => {
      if (!map.current || !coords) return
      suppressFollowRecenterUntilRef.current = Date.now() + 35000
      const targetZoom = 16
      const place = places.find((p) => String(p.id) === String(placeId))
      const doFly = () => {
        if (!map.current) return
        try {
          map.current.resize()
        } catch {
          /* ignore */
        }
        focusPopupRef.current?.remove()
        focusPopupRef.current = null
        map.current.flyTo({
          center: coords,
          zoom: targetZoom,
          duration: 1100,
          essential: true
        })
        map.current.once('moveend', () => {
          if (!map.current) return
          const html = place
            ? `<strong>${place.name}</strong><br/><em>${place.city}, ${place.state}</em>`
            : 'Place'
          try {
            const popup = new mapboxgl.Popup({ offset: 16, closeOnClick: true })
              .setLngLat(coords)
              .setHTML(html)
            popup.addTo(map.current)
            focusPopupRef.current = popup
          } catch {
            /* ignore */
          }
        })
      }
      if (map.current.isStyleLoaded()) {
        doFly()
      } else {
        map.current.once('style.load', doFly)
      }
    },
    [places]
  )

  applyMapFocusRef.current = applyMapFocus
  onMarkerSelectRef.current = onMarkerSelect

  const placeMarkers = useCallback(() => {
    if (!map.current || !map.current.isStyleLoaded()) return
    const m = map.current
    if (!m.getSource(BF_PLACES_SOURCE)) {
      m.addSource(BF_PLACES_SOURCE, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      })
      m.addLayer({
        id: BF_PLACES_LAYER,
        type: 'circle',
        source: BF_PLACES_SOURCE,
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, 2.5, 6, 4, 10, 5.5, 14, 7, 18, 8],
          'circle-color': ['case', ['==', ['get', 'sel'], 1], '#FDE047', '#EAB308'],
          'circle-opacity': 0.95,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#854d0e'
        }
      })
      try {
        m.moveLayer(BF_PLACES_LAYER)
      } catch {
        /* ignore */
      }
      if (!m._bfInteractBound) {
        m._bfInteractBound = true
        m.on('click', (e) => {
          const hit = m.queryRenderedFeatures(e.point, { layers: [BF_PLACES_LAYER] })
          if (hit.length > 0 && hit[0].properties?.id != null) {
            onMarkerSelectRef.current?.(String(hit[0].properties.id))
          }
        })
        m.on('mousemove', (e) => {
          const hit = m.queryRenderedFeatures(e.point, { layers: [BF_PLACES_LAYER] })
          m.getCanvas().style.cursor = hit.length > 0 ? 'pointer' : ''
        })
      }
    }

    const features = []
    for (const p of places) {
      const coords = lngLatFromPlace(p)
      if (!coords) continue
      const selected =
        selectedPlaceId != null && String(p.id) === String(selectedPlaceId) ? 1 : 0
      features.push({
        type: 'Feature',
        properties: {
          id: String(p.id),
          name: p.name ?? '',
          city: p.city ?? '',
          state: p.state ?? '',
          sel: selected
        },
        geometry: { type: 'Point', coordinates: coords }
      })
    }
    m.getSource(BF_PLACES_SOURCE).setData({ type: 'FeatureCollection', features })
  }, [places, selectedPlaceId])

  const placeMarkersRef = useRef(placeMarkers)
  useEffect(() => {
    placeMarkersRef.current = placeMarkers
  }, [placeMarkers])

  const destroyMap = useCallback(() => {
    if (geolocateTimerRef.current) {
      clearTimeout(geolocateTimerRef.current)
      geolocateTimerRef.current = null
    }
    try {
      focusPopupRef.current?.remove()
    } catch {
      /* ignore */
    }
    focusPopupRef.current = null
    geolocateRef.current = null
    pendingFocusRef.current = null
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
      cooperativeGestures: true,
    })
    map.current = nextMap

    nextMap.addControl(new mapboxgl.NavigationControl(), 'top-right')
    geolocateRef.current = new mapboxgl.GeolocateControl({
      // Cached / network fix first = blue dot shows sooner; avoid slow cold-GPS on every open
      positionOptions: { enableHighAccuracy: false, maximumAge: 300000, timeout: 20000 },
      trackUserLocation: false,
      showUserHeading: false,
      fitBoundsOptions: { maxZoom: 12 },
    })
    nextMap.addControl(geolocateRef.current, 'top-right')

    nextMap.on('load', () => {
      nextMap.resize()
      placeMarkersRef.current()
      const pending = pendingFocusRef.current
      if (pending) {
        pendingFocusRef.current = null
        applyMapFocusRef.current(pending.coords, pending.placeId)
      }
      if (!hasTriggeredGeolocateRef.current) {
        hasTriggeredGeolocateRef.current = true
        geolocateTimerRef.current = setTimeout(() => geolocateRef.current?.trigger(), 80)
      }
    })
    nextMap.on('error', (e) => {
      console.error('[Mapbox]', e.error?.message ?? e)
    })
  }, [destroyMap, mapCenter, zoom])

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

  /** Only for Sanctuary↔Theophany style swap — must NOT depend on mapCenter/ zoom refs (avoids setStyle on every GPS tick). */
  const ensureContainerIntegrityRef = useRef(ensureContainerIntegrity)
  useEffect(() => {
    ensureContainerIntegrityRef.current = ensureContainerIntegrity
  }, [ensureContainerIntegrity])

  useImperativeHandle(
    ref,
    () => ({
      /**
       * @param {string} placeId
       * @param {[number, number] | null} [lonLatFromCard] — from the clicked card; avoids lookup failures when Map just mounted or lists differ
       */
      focusPlace(placeId, lonLatFromCard) {
        let coords = null
        if (
          Array.isArray(lonLatFromCard) &&
          lonLatFromCard.length >= 2 &&
          Number.isFinite(lonLatFromCard[0]) &&
          Number.isFinite(lonLatFromCard[1])
        ) {
          coords = lonLatFromCard
        } else {
          const place = places.find((p) => String(p.id) === String(placeId))
          coords = place ? lngLatFromPlace(place) : null
        }
        if (!coords) return false
        if (!map.current) {
          pendingFocusRef.current = { placeId, coords }
          return true
        }
        applyMapFocus(coords, placeId)
        return true
      }
    }),
    [places, applyMapFocus]
  )

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
  }, [buildMap])

  // ResizeObserver: whenever the container changes size (e.g. after lazy CSS
  // applies or orientation changes) tell Mapbox to re-measure the canvas.
  useEffect(() => {
    const container = mapContainer.current
    if (!container) return
    const ro = new ResizeObserver(() => map.current?.resize())
    ro.observe(container)
    return () => ro.disconnect()
  }, [])

  // Re-center when user location updates (skip right after "Locate on map" so flyTo isn't reset to zoom 7.4)
  useEffect(() => {
    if (!map.current || !hasMapboxEnv) return
    if (Date.now() < suppressFollowRecenterUntilRef.current) return
    map.current.jumpTo({ center: mapCenter, zoom })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapCenter[0], mapCenter[1], zoom, hasMapboxEnv])

  // Update map style when mode changes; re-place markers after new style loads.
  // Deps: [mode] only — if ensureContainerIntegrity/buildMap are deps, every mapCenter
  // change recreates the callback and re-runs setStyle(), which clears markers.
  useEffect(() => {
    if (!map.current) return
    pendingModeRef.current = mode
    const recover = ensureContainerIntegrityRef.current
    recover('mode-change-pre-style')
    if (!map.current) return
    const style = styleForMode(mode)
    map.current.once('style.load', () => {
      ensureContainerIntegrityRef.current('style-load')
      placeMarkersRef.current()
      requestAnimationFrame(() => map.current?.resize())
    })
    map.current.setStyle(style)
    requestAnimationFrame(() => {
      ensureContainerIntegrityRef.current('mode-change-post-style')
      map.current?.resize()
    })
  }, [mode])

  // Re-place markers whenever places or visit/save status sets change.
  // If style is already loaded: place immediately.
  // If not (style transition in progress): wait for it, then place.
  useEffect(() => {
    if (!map.current) return
    if (map.current.isStyleLoaded()) {
      placeMarkers()
    } else {
      map.current.once('style.load', () => placeMarkersRef.current())
    }
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
})

export default Map
