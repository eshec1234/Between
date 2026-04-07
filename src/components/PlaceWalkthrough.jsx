import { useMemo, useState, useEffect, useCallback, useRef } from 'react'
import { buildWalkthroughSteps } from '../lib/placeNarration'
import {
  pickAsmrVoice,
  pickSanctuaryVoice,
  speakAsmrText,
  splitForGentlePauses,
  splitForSanctuaryReading,
  SANCTUARY_UTTERANCE,
  THEOPHANY_UTTERANCE
} from '../lib/speechVoice'
import { safeCharacterAiUrl } from '../lib/safeCharacterAiUrl'
import { isCloudNarrationConfigured, fetchNarrationTts } from '../lib/fetchNarrationTts'

export default function PlaceWalkthrough({
  place,
  isTheophany,
  borderClass,
  accentClass,
  subClass,
  bodyClass,
  onReachedLastStep
}) {
  const steps = useMemo(() => buildWalkthroughSteps(place), [place])
  const [i, setI] = useState(0)
  const [speaking, setSpeaking] = useState(false)
  const [loadingCloud, setLoadingCloud] = useState(false)
  const [voiceReady, setVoiceReady] = useState(false)
  const audioRef = useRef(null)
  const objectUrlRef = useRef(null)
  const fetchAbortRef = useRef(null)

  const cloudNarration = useMemo(() => isCloudNarrationConfigured(), [])

  const step = steps[i] || steps[0]
  const last = steps.length - 1
  const lastStepFired = useRef(false)

  useEffect(() => {
    lastStepFired.current = false
  }, [place?.id])

  useEffect(() => {
    if (!place?.id || steps.length === 0) return
    if (i !== last) return
    if (lastStepFired.current) return
    lastStepFired.current = true
    onReachedLastStep?.(place.id)
  }, [i, last, place?.id, steps.length, onReachedLastStep])

  const characterAiHref = useMemo(
    () => safeCharacterAiUrl(import.meta.env.VITE_CHARACTER_AI_URL),
    []
  )

  useEffect(() => {
    if (cloudNarration) {
      setVoiceReady(true)
      return
    }
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    const sync = () => {
      if (window.speechSynthesis.getVoices().length) setVoiceReady(true)
    }
    sync()
    window.speechSynthesis.addEventListener('voiceschanged', sync)
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', sync)
      window.speechSynthesis.cancel()
    }
  }, [cloudNarration])

  useEffect(() => {
    return () => {
      if (fetchAbortRef.current) {
        fetchAbortRef.current.abort()
        fetchAbortRef.current = null
      }
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
        objectUrlRef.current = null
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const stopSpeak = useCallback(() => {
    if (fetchAbortRef.current) {
      fetchAbortRef.current.abort()
      fetchAbortRef.current = null
    }
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    setSpeaking(false)
    setLoadingCloud(false)
  }, [])

  const speakDevice = useCallback((text) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    setSpeaking(true)
    const ut = isTheophany ? THEOPHANY_UTTERANCE : SANCTUARY_UTTERANCE
    speakAsmrText(text, window.speechSynthesis, {
      getVoice: (voices) => (isTheophany ? pickAsmrVoice(voices) : pickSanctuaryVoice(voices)),
      splitIntoChunks: isTheophany ? splitForGentlePauses : splitForSanctuaryReading,
      rate: ut.rate,
      pitch: ut.pitch,
      volume: ut.volume,
      onEnd: () => setSpeaking(false),
      onError: () => setSpeaking(false)
    })
  }, [isTheophany])

  const speakStep = useCallback(async () => {
    if (typeof window === 'undefined' || !step) return
    if (!cloudNarration && !window.speechSynthesis) return

    stopSpeak()
    const text = `${step.title}. ${step.body.replace(/\n+/g, ' ')}`

    if (cloudNarration) {
      const ac = new AbortController()
      fetchAbortRef.current = ac
      setLoadingCloud(true)
      try {
        const blob = await fetchNarrationTts(text, {
          signal: ac.signal,
          mode: isTheophany ? 'theophany' : 'sanctuary'
        })
        if (fetchAbortRef.current === ac) fetchAbortRef.current = null
        const objectUrl = URL.createObjectURL(blob)
        objectUrlRef.current = objectUrl
        const audio = new Audio(objectUrl)
        audio.setAttribute('playsInline', 'true')
        audioRef.current = audio
        audio.onended = () => stopSpeak()
        audio.onerror = () => stopSpeak()
        await audio.play()
        setSpeaking(true)
      } catch (e) {
        if (e?.name === 'AbortError') return
        if (window.speechSynthesis) speakDevice(text)
      } finally {
        setLoadingCloud(false)
      }
      return
    }

    speakDevice(text)
  }, [step, stopSpeak, cloudNarration, speakDevice, isTheophany])

  if (!steps.length) return null

  return (
    <section
      className={`relative overflow-hidden rounded-xl border-2 px-4 py-5 sm:px-6 ${
        isTheophany
          ? 'border-theophany-accent/35 bg-gradient-to-b from-[#0e0818] via-[#120a22] to-[#0a0614] shadow-[0_0_48px_rgba(70,35,110,0.38)]'
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
          {!voiceReady && (
            <p className={`mt-1 font-sans text-[10px] italic ${subClass}`}>Loading voices…</p>
          )}
          {voiceReady && cloudNarration && (
            <p className={`mt-2 max-w-[min(100%,24rem)] font-sans text-[10px] leading-snug opacity-75 ${subClass}`}>
              {isTheophany ? (
                <>
                  Narration uses OpenAI’s neural text-to-speech with intimate, slow, ASMR-style instructions. It sounds
                  human but is AI-generated, not a human recording (OpenAI’s usage policy). If the request fails, the app
                  falls back to your device voice.
                </>
              ) : (
                <>
                  Narration uses OpenAI’s neural text-to-speech tuned for a warm, clear, calming delivery—like a guided
                  rest or sleep story (not whisper-creepy). It is AI-generated, not a human recording (OpenAI’s usage
                  policy). If the request fails, the app falls back to your device voice.
                </>
              )}
            </p>
          )}
          {voiceReady && !cloudNarration && (
            <p className={`mt-2 max-w-[min(100%,22rem)] font-sans text-[10px] leading-snug opacity-75 ${subClass}`}>
              This uses your device’s built-in text-to-speech. Softer speech comes from your OS: on Mac,{' '}
              <span className="whitespace-nowrap">System Settings → Accessibility → Spoken Content</span>; on Windows,{' '}
              <span className="whitespace-nowrap">Settings → Accessibility → Narrator</span> (voice list).
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={speaking || loadingCloud ? stopSpeak : speakStep}
          className={`shrink-0 rounded-full border px-3 py-1.5 font-sans text-[10px] font-semibold uppercase tracking-wider transition-colors ${
            isTheophany
              ? 'border-theophany-accent/60 text-theophany-accent hover:bg-theophany-accent/10'
              : 'border-sanctuary-accent/50 text-sanctuary-accent hover:bg-sanctuary-accent/10'
          }`}
          aria-label={
            speaking || loadingCloud
              ? 'Stop narration'
              : cloudNarration
                ? isTheophany
                  ? 'Play neural narration with intimate ASMR-style delivery'
                  : 'Play neural narration with calm, entrancing delivery'
                : 'Read this step aloud using device text-to-speech'
          }
        >
          {loadingCloud
            ? 'Loading…'
            : speaking
              ? 'Stop'
              : cloudNarration
                ? isTheophany
                  ? 'Liminal voice'
                  : 'Calm voice'
                : 'Read aloud softly'}
        </button>
      </div>

      {characterAiHref && (
        <div className="mb-4">
          <a
            href={characterAiHref}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1 font-sans text-[11px] font-medium underline-offset-2 hover:underline ${
              isTheophany ? 'text-theophany-accent/90' : 'text-sanctuary-accent'
            }`}
          >
            Continue on Character.AI
            <span aria-hidden="true">↗</span>
          </a>
          <p className={`mt-1 max-w-prose font-sans text-[10px] leading-snug opacity-70 ${subClass}`}>
            Opens your Character.AI chat in a new tab (voice and persona live there—there is no public API to embed it
            inside this app).
          </p>
        </div>
      )}

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
