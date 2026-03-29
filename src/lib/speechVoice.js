/**
 * Soft read-aloud via the browser Speech Synthesis API (device voices only).
 * There is no way to “copy” a YouTuber or third-party voice in the browser—only OS / browser
 * voices. For a gentler sound, users should pick a premium voice in system accessibility settings.
 */

/** Names often perceived as softer on macOS / Edge / Chrome (order matters). */
const SOFT_VOICE_NAMES = [
  /whisper/i,
  /samantha/i,
  /karen/i,
  /moira/i,
  /fiona/i,
  /serena/i,
  /tessa/i,
  /ava\b/i,
  /susan/i,
  /victoria/i,
  /allison/i,
  /google uk english female/i,
  /microsoft.*zira/i,
  /microsoft.*aria/i,
  /microsoft.*jenny/i,
  /microsoft.*female/i,
  /female/i,
  /zira/i
]

/** Prefer not to use as “soft” fallback when other English voices exist. */
const HARSH_FALLBACK_NAMES = [
  /google\s+us\s+english/i,
  /fred\b/i,
  /daniel\b/i,
  /arthur\b/i,
  /brian\b/i,
  /tom\b/i,
  /david\b/i,
  /mark\b/i
]

function scoreVoice(v) {
  let s = 0
  for (const rx of SOFT_VOICE_NAMES) {
    if (rx.test(v.name)) s += 2
  }
  if (v.localService === true) s += 4
  return s
}

/**
 * Pick the gentlest-sounding English voice available.
 */
export function pickAsmrVoice(voices) {
  if (!voices?.length) return null
  const en = voices.filter((v) => v.lang && /^en/i.test(v.lang))
  const pool = en.length ? en : voices

  for (const rx of SOFT_VOICE_NAMES) {
    const m = pool.find((v) => rx.test(v.name))
    if (m) return m
  }

  const sorted = [...pool].sort((a, b) => scoreVoice(b) - scoreVoice(a))
  const best = sorted[0]
  if (!best) return null

  const softer = sorted.find((v) => !HARSH_FALLBACK_NAMES.some((rx) => rx.test(v.name)))
  return softer || best
}

/** Slow, low, slightly quiet — less “radio announcer”, more bedside. */
export const ASMR_UTTERANCE = {
  rate: 0.62,
  pitch: 0.86,
  volume: 0.88
}

/** Sanctuary device fallback: slower, brighter, open — calming / sleep-story */
export const SANCTUARY_UTTERANCE = {
  rate: 0.54,
  pitch: 0.94,
  volume: 0.92
}

/** Theophany device fallback: lower, quieter — liminal whisper-adjacent */
export const THEOPHANY_UTTERANCE = {
  rate: 0.6,
  pitch: 0.82,
  volume: 0.85
}

/**
 * Split narration into short segments so the engine inserts natural pauses (ASMR-like pacing).
 */
export function splitForGentlePauses(text) {
  const t = String(text).replace(/\s+/g, ' ').trim()
  if (!t) return []
  try {
    const parts = t.split(/(?<=[.!?])\s+/).filter(Boolean)
    if (parts.length > 1) return parts
  } catch {
    /* older engines without lookbehind */
  }
  return [t]
}

/**
 * Queue one utterance per segment — calmer than a single long block.
 * @param {SpeechSynthesis} synth window.speechSynthesis
 */
export function speakAsmrText(text, synth, options = {}) {
  const {
    getVoice,
    onEnd,
    onError,
    rate = ASMR_UTTERANCE.rate,
    pitch = ASMR_UTTERANCE.pitch,
    volume = ASMR_UTTERANCE.volume
  } = options

  const chunks = splitForGentlePauses(text)
  if (!chunks.length) {
    onEnd?.()
    return
  }

  const voices = synth.getVoices()
  const voice = getVoice ? getVoice(voices) : null
  let i = 0

  const speakNext = () => {
    if (i >= chunks.length) {
      onEnd?.()
      return
    }
    const u = new SpeechSynthesisUtterance(chunks[i++])
    u.rate = rate
    u.pitch = pitch
    u.volume = volume
    if (voice) u.voice = voice
    u.onend = speakNext
    u.onerror = () => {
      onError?.()
      onEnd?.()
    }
    synth.speak(u)
  }

  speakNext()
}

/** @deprecated use pickAsmrVoice */
export function pickSoothingVoice(voices) {
  return pickAsmrVoice(voices)
}

/** @deprecated use ASMR_UTTERANCE */
export const SOOTHING_UTTERANCE = ASMR_UTTERANCE
