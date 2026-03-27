import { useMemo, useState, useEffect, useCallback } from 'react'
import { buildWalkthroughSteps } from '../lib/placeNarration'

export default function PlaceWalkthrough({
  place,
  isTheophany,
  borderClass,
  accentClass,
  subClass,
  bodyClass
}) {
  const steps = useMemo(() => buildWalkthroughSteps(place), [place])
  const [i, setI] = useState(0)
  const [speaking, setSpeaking] = useState(false)

  const step = steps[i] || steps[0]
  const last = steps.length - 1

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const stopSpeak = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    setSpeaking(false)
  }, [])

  const speakStep = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis || !step) return
    stopSpeak()
    const u = new SpeechSynthesisUtterance(`${step.title}. ${step.body.replace(/\n+/g, ' ')}`)
    u.rate = 0.92
    u.onend = () => setSpeaking(false)
    u.onerror = () => setSpeaking(false)
    setSpeaking(true)
    window.speechSynthesis.speak(u)
  }, [step, stopSpeak])

  if (!steps.length) return null

  return (
    <section
      className={`relative overflow-hidden rounded-xl border-2 px-4 py-5 sm:px-6 ${
        isTheophany
          ? 'border-theophany-accent/35 bg-gradient-to-b from-[#050c10] via-[#061218] to-[#030608] shadow-[0_0_40px_rgba(0,40,40,0.25)]'
          : 'border-sanctuary-accent/30 bg-gradient-to-b from-[#fffdf8] via-[#faf3e8] to-[#f2e8d8] shadow-md'
      }`}
      aria-label="Immersive walkthrough"
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className={`font-sans text-[9px] uppercase tracking-[0.35em] ${subClass}`}>Walkthrough</p>
          <h2 className={`mt-1 font-display text-lg tracking-wide ${bodyClass}`}>You are here</h2>
          <p className={`mt-1 max-w-prose font-sans text-[11px] leading-relaxed ${subClass}`}>
            A slow, second-person walk — step through as if you were standing in the space.
          </p>
        </div>
        <button
          type="button"
          onClick={speaking ? stopSpeak : speakStep}
          className={`shrink-0 rounded-full border px-3 py-1.5 font-sans text-[10px] font-semibold uppercase tracking-wider transition-colors ${
            isTheophany
              ? 'border-theophany-accent/60 text-theophany-accent hover:bg-theophany-accent/10'
              : 'border-sanctuary-accent/50 text-sanctuary-accent hover:bg-sanctuary-accent/10'
          }`}
        >
          {speaking ? 'Stop' : 'Read aloud'}
        </button>
      </div>

      <div className="mb-4 flex justify-center gap-1.5">
        {steps.map((s, idx) => (
          <button
            key={s.id}
            type="button"
            aria-label={`Go to step ${idx + 1}`}
            onClick={() => {
              stopSpeak()
              setI(idx)
            }}
            className={`h-2 rounded-full transition-all ${
              idx === i
                ? isTheophany
                  ? 'w-8 bg-theophany-accent'
                  : 'w-8 bg-sanctuary-accent'
                : isTheophany
                  ? 'w-2 bg-theophany-muted/40 hover:bg-theophany-muted/70'
                  : 'w-2 bg-sanctuary-muted/35 hover:bg-sanctuary-muted/60'
            }`}
          />
        ))}
      </div>

      <article
        key={step.id}
        className="animate-bfIn min-h-[200px] sm:min-h-[180px]"
      >
        <h3 className={`font-display text-sm tracking-[0.2em] ${accentClass}`}>{step.title}</h3>
        <p
          className={`mt-4 whitespace-pre-line font-serif text-[15px] leading-[1.75] ${
            isTheophany ? 'text-[#c8e4e4]' : 'text-[#2a2018]'
          }`}
        >
          {step.body}
        </p>
      </article>

      <div className="mt-6 flex items-center justify-between gap-3 border-t border-current/10 pt-4">
        <button
          type="button"
          disabled={i===0}
          onClick={() => {
            stopSpeak()
            setI((x) => Math.max(0, x - 1))
          }}
          className={`rounded-lg border px-4 py-2 font-sans text-[11px] font-medium uppercase tracking-wider disabled:opacity-30 ${borderClass} ${subClass}`}
        >
          Prev
        </button>
        <span className={`font-sans text-[10px] ${subClass}`}>
          {i + 1} / {steps.length}
        </span>
        <button
          type="button"
          disabled={i===last}
          onClick={() => {
            stopSpeak()
            setI((x) => Math.min(last, x + 1))
          }}
          className={`rounded-lg border px-4 py-2 font-sans text-[11px] font-medium uppercase tracking-wider disabled:opacity-30 ${borderClass} ${accentClass}`}
        >
          Next
        </button>
      </div>
    </section>
  )
}
