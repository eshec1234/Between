import { useState, useMemo, useEffect } from 'react'
import { placeImageFallbackChain, imageUrlFallbackChain } from '../lib/placePhotoFallback'
import PlaceholderImage from './PlaceholderImage'

function GradientBlock({ isTheophany, className, variant }) {
  return (
    <PlaceholderImage
      isTheophany={isTheophany}
      variant={variant || 'card'}
      className={className || 'h-full w-full'}
    />
  )
}

/**
 * Tries place/time-selected URL, then other DB URLs, then app defaults — avoids broken-image icons when a URL 404s or is blocked.
 */
export default function PlaceImage({ place, className, imgClassName, isTheophany, variant, alt = '' }) {
  const chain = useMemo(() => placeImageFallbackChain(place), [place])
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    setAttempt(0)
  }, [place?.id])

  const src = attempt < chain.length ? chain[attempt] : null

  if (!chain.length || src == null) {
    return <GradientBlock isTheophany={isTheophany} className={imgClassName || className} variant={variant} />
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      loading="lazy"
      className={imgClassName || className}
      onError={() => setAttempt((a) => a + 1)}
    />
  )
}

/** One URL (e.g. gallery thumb) with default fallbacks. */
export function PlaceImageFromUrl({ url, isTheophany, variant, className, imgClassName, alt = '' }) {
  const chain = useMemo(() => imageUrlFallbackChain(url), [url])
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    setAttempt(0)
  }, [url])

  const src = attempt < chain.length ? chain[attempt] : null

  if (!chain.length || src == null) {
    return <GradientBlock isTheophany={isTheophany} className={imgClassName || className} variant={variant} />
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      loading="lazy"
      className={imgClassName || className}
      onError={() => setAttempt((a) => a + 1)}
    />
  )
}
