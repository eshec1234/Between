import { useState, useMemo, useEffect } from 'react'
import { placeImageFallbackChain, imageUrlFallbackChain } from '../lib/placePhotoFallback'

function GradientBlock({ isTheophany, className }) {
  return (
    <div
      className={
        className ||
        `h-full w-full ${isTheophany ? 'bg-gradient-to-b from-[#140a22] to-[#060210]' : 'bg-gradient-to-b from-[#e8dcc8] to-[#d4c4a8]'}`
      }
    />
  )
}

/**
 * Tries place/time-selected URL, then other DB URLs, then app defaults — avoids broken-image icons when a URL 404s or is blocked.
 */
export default function PlaceImage({ place, className, imgClassName, isTheophany, alt = '' }) {
  const chain = useMemo(() => placeImageFallbackChain(place), [place])
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    setAttempt(0)
  }, [place?.id])

  const src = attempt < chain.length ? chain[attempt] : null

  if (!chain.length || src == null) {
    return <GradientBlock isTheophany={isTheophany} className={imgClassName || className} />
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
export function PlaceImageFromUrl({ url, isTheophany, className, imgClassName, alt = '' }) {
  const chain = useMemo(() => imageUrlFallbackChain(url), [url])
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    setAttempt(0)
  }, [url])

  const src = attempt < chain.length ? chain[attempt] : null

  if (!chain.length || src == null) {
    return <GradientBlock isTheophany={isTheophany} className={imgClassName || className} />
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
