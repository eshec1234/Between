import { useEffect, useRef } from 'react'
import { startRunawayLoop } from '../lib/runawayPiano'

/**
 * While onboarding is visible, loops the Runaway phrase after the first pointer event
 * (capture phase unlocks audio before Sanctuary/Theophany buttons handle the click).
 * Stops when the user finishes onboarding and reaches the main screen.
 */
export default function RunawayOnboardingLoop({ active }) {
  const stopRef = useRef(null)

  useEffect(() => {
    if (!active) {
      stopRef.current?.()
      stopRef.current = null
      return
    }

    const onPointerDown = () => {
      if (stopRef.current) return
      stopRef.current = startRunawayLoop()
    }

    window.addEventListener('pointerdown', onPointerDown, { capture: true, passive: true })
    return () => {
      window.removeEventListener('pointerdown', onPointerDown, { capture: true })
      stopRef.current?.()
      stopRef.current = null
    }
  }, [active])

  return null
}
