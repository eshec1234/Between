import { useEffect, useRef, useState, useCallback } from 'react'
import { useAmbientMode } from '../context/AmbientModeContext'
import { createZenAmbientEngine } from '../lib/zenAmbientEngine'
import { getAmbientMutedEffective, setAmbientMuted } from '../lib/betweenLocal'

/**
 * Soft pentatonic ambient bed (Web Audio). Starts after user gesture if unmuted.
 * Fixed control: mute / unmute with persistence.
 */
export default function ZenAmbient() {
  const { variant } = useAmbientMode()
  const [muted, setMuted] = useState(() => getAmbientMutedEffective())
  const engineRef = useRef(null)
  const ctxRef = useRef(null)
  const mutedRef = useRef(muted)

  useEffect(() => {
    mutedRef.current = muted
  }, [muted])

  const startEngine = useCallback(async () => {
    if (engineRef.current) return
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return
    const ctx = new AC()
    ctxRef.current = ctx
    try {
      await ctx.resume()
    } catch {
      /* ignore */
    }
    const engine = createZenAmbientEngine(ctx)
    engineRef.current = engine
    engine.setVariant(variant)
    engine.setMuted(mutedRef.current)
  }, [variant])

  useEffect(() => {
    if (!engineRef.current) return
    engineRef.current.setVariant(variant)
  }, [variant])

  useEffect(() => {
    if (!engineRef.current) return
    engineRef.current.setMuted(muted)
  }, [muted])

  useEffect(() => {
    const tryStart = () => {
      if (engineRef.current) return
      if (mutedRef.current) return
      void startEngine()
    }
    window.addEventListener('pointerdown', tryStart, { passive: true })
    return () => window.removeEventListener('pointerdown', tryStart)
  }, [startEngine])

  useEffect(() => {
    return () => {
      engineRef.current?.dispose()
      engineRef.current = null
      ctxRef.current?.close().catch(() => {})
      ctxRef.current = null
    }
  }, [])

  const toggle = useCallback(() => {
    const next = !muted
    mutedRef.current = next
    setMuted(next)
    setAmbientMuted(next)
    if (!engineRef.current && !next) {
      void startEngine()
      return
    }
    engineRef.current?.setMuted(next)
  }, [muted, startEngine])

  const label = muted ? 'Turn on soft ambient music' : 'Mute ambient music'
  const isTheophany = variant === 'theophany'

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={`pointer-events-auto fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-[80] flex h-10 w-10 items-center justify-center rounded-full border shadow-md backdrop-blur-sm transition hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
        isTheophany
          ? 'border-violet-400/35 bg-black/35 text-violet-100/90 focus-visible:ring-violet-400/60'
          : 'border-amber-900/25 bg-white/80 text-amber-900/75 focus-visible:ring-amber-700/50'
      }`}
    >
      <span className="sr-only">{label}</span>
      {muted ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <path d="M11 5L6 9H4a1 1 0 00-1 1v4a1 1 0 001 1h2l5 4V5z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M22 9l-6 6M16 9l6 6" strokeLinecap="round" />
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <path d="M11 5L6 9H4a1 1 0 00-1 1v4a1 1 0 001 1h2l5 4V5z" strokeLinecap="round" strokeLinejoin="round" />
          <path
            d="M15.54 8.46a5 5 0 010 7.07M17.66 6.34a8 8 0 010 11.32"
            strokeLinecap="round"
          />
        </svg>
      )}
    </button>
  )
}
