import { describe, expect, it } from 'vitest'
import { buildDirectionsUrl } from '../directions'

describe('buildDirectionsUrl', () => {
  it('builds Google Maps directions with origin and destination', () => {
    const url = buildDirectionsUrl({
      destination: [-75.3790, 40.6264],
      origin: [-75.42, 40.614],
      forceAppleMaps: false
    })
    expect(url).toContain('https://www.google.com/maps/dir/')
    expect(url).toContain('destination=40.6264,-75.379')
    expect(url).toContain('origin=40.614,-75.42')
  })

  it('builds Apple Maps URL when requested', () => {
    const url = buildDirectionsUrl({
      destination: [-75.3790, 40.6264],
      origin: [-75.42, 40.614],
      forceAppleMaps: true
    })
    expect(url).toContain('https://maps.apple.com/?')
    expect(url).toContain('daddr=40.6264,-75.379')
    expect(url).toContain('saddr=40.614,-75.42')
    expect(url).toContain('dirflg=d')
  })

  it('returns null for invalid destination', () => {
    const url = buildDirectionsUrl({
      destination: [null, 40.6264],
      origin: [-75.42, 40.614]
    })
    expect(url).toBeNull()
  })
})
