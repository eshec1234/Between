import { describe, expect, it } from 'vitest'
import { hasPlaceCoordinates, placeLngLat } from '../placeCoordinates'

describe('placeLngLat', () => {
  it('reads GeoJSON coordinates from place row', () => {
    const point = placeLngLat({
      coordinates: {
        coordinates: [-75.379, 40.6264]
      }
    })
    expect(point).toEqual([-75.379, 40.6264])
  })

  it('reads lng/lat fallback fields', () => {
    const point = placeLngLat({ lng: -75.42, lat: 40.614 })
    expect(point).toEqual([-75.42, 40.614])
  })

  it('returns null for invalid values', () => {
    const point = placeLngLat({ coordinates: { coordinates: [null, 40.1] } })
    expect(point).toBeNull()
  })

  it('parses PostGIS POINT strings from RPC rows', () => {
    const point = placeLngLat({ coordinates: 'POINT(-75.379 40.6264)' })
    expect(point).toEqual([-75.379, 40.6264])
  })

  it('parses PostGIS location text wrappers', () => {
    const point = placeLngLat({ coordinates: { type: 'Point', coordinates: 'POINT(-74.0060 40.7128)' } })
    expect(point).toEqual([-74.006, 40.7128])
  })
})

describe('hasPlaceCoordinates', () => {
  it('returns true for valid place coordinates', () => {
    expect(
      hasPlaceCoordinates({
        coordinates: { coordinates: [-75.379, 40.6264] }
      })
    ).toBe(true)
  })

  it('returns false for missing coordinates', () => {
    expect(hasPlaceCoordinates({})).toBe(false)
  })
})
