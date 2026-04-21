import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import Map from '../Map'

const { createdMaps, MockMap, MockMarker, MockPopup, MockControl } = vi.hoisted(() => {
  const maps = []

  class HoistedMockMap {
    constructor({ container }) {
      this.container = container
      this.handlers = new globalThis.Map()
      this.styleLoaded = true
      this.center = { lng: -75.1652, lat: 39.9526 }
      this.zoom = 11
      this.container.classList.add('mapboxgl-map')
      maps.push(this)
    }

    on(event, cb) {
      this.handlers.set(event, cb)
      if (event === 'load') cb()
    }

    once(event, cb) {
      this.handlers.set(`once:${event}`, cb)
    }

    setStyle() {
      const cb = this.handlers.get('once:style.load')
      if (cb) cb()
    }

    addControl() {}

    resize() {}

    jumpTo({ center, zoom }) {
      this.center = { lng: center[0], lat: center[1] }
      this.zoom = zoom
    }

    getCenter() {
      return this.center
    }

    getZoom() {
      return this.zoom
    }

    isStyleLoaded() {
      return this.styleLoaded
    }

    remove() {
      this.container.classList.remove('mapboxgl-map')
    }
  }

  class HoistedMockMarker {
    setLngLat() {
      return this
    }

    setPopup() {
      return this
    }

    addTo() {
      return this
    }

    remove() {}
  }

  class HoistedMockPopup {
    setHTML() {
      return this
    }
  }

  class HoistedMockControl {
    trigger() {}
  }

  return {
    createdMaps: maps,
    MockMap: HoistedMockMap,
    MockMarker: HoistedMockMarker,
    MockPopup: HoistedMockPopup,
    MockControl: HoistedMockControl
  }
})

vi.mock('mapbox-gl', () => ({
  default: {
    Map: MockMap,
    Marker: MockMarker,
    Popup: MockPopup,
    NavigationControl: MockControl,
    GeolocateControl: MockControl,
    accessToken: ''
  }
}))

vi.mock('../../lib/env', () => ({
  hasMapboxEnv: true,
  mapboxToken: 'test-token'
}))

beforeEach(() => {
  createdMaps.length = 0
})

describe('Map container integrity', () => {
  it('keeps mapbox runtime class after mode toggles', async () => {
    const { rerender, container } = render(
      <Map
        mode="sanctuary"
        places={[]}
        mapCenter={[-75.1652, 39.9526]}
        heightClass="btw-map-canvas"
      />
    )

    await waitFor(() => {
      expect(createdMaps.length).toBe(1)
      expect(createdMaps[0].container.classList.contains('mapboxgl-map')).toBe(true)
    })

    rerender(
      <Map
        mode="theophany"
        places={[]}
        mapCenter={[-75.1652, 39.9526]}
        heightClass="btw-map-canvas"
      />
    )

    await waitFor(() => {
      expect(createdMaps[0].container.classList.contains('mapboxgl-map')).toBe(true)
    })

    rerender(
      <Map
        mode="sanctuary"
        places={[]}
        mapCenter={[-75.1652, 39.9526]}
        heightClass="btw-map-canvas"
      />
    )

    await waitFor(() => {
      expect(createdMaps[0].container.classList.contains('mapboxgl-map')).toBe(true)
    })

    const themedWrappers = container.querySelectorAll('.map-sanctuary, .map-theophany')
    expect(themedWrappers.length).toBe(1)
  })

  it('rebuilds map if mapbox class is lost before mode switch', async () => {
    const { rerender } = render(
      <Map
        mode="sanctuary"
        places={[]}
        mapCenter={[-75.1652, 39.9526]}
        heightClass="btw-map-canvas"
      />
    )

    await waitFor(() => {
      expect(createdMaps.length).toBe(1)
      expect(createdMaps[0].container.classList.contains('mapboxgl-map')).toBe(true)
    })

    createdMaps[0].container.classList.remove('mapboxgl-map')

    rerender(
      <Map
        mode="theophany"
        places={[]}
        mapCenter={[-75.1652, 39.9526]}
        heightClass="btw-map-canvas"
      />
    )

    await waitFor(() => {
      expect(createdMaps.length).toBeGreaterThan(1)
      const latestMap = createdMaps.at(-1)
      expect(latestMap?.container.classList.contains('mapboxgl-map')).toBe(true)
    })
  })
})
