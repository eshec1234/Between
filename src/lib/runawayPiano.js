/**
 * Opening right-hand phrase from Kanye West "Runaway" (E major line, as commonly transcribed).
 * Short educational / demo playback — not a full arrangement; support original artists.
 */

function midiToFreq(m) {
  return 440 * 2 ** ((m - 69) / 12)
}

/** E5 E5 E5 | D#5 ×4 | C#5 ×3 | A4 A4 G#4 | E5 E5 */
export const RUNAWAY_PHRASE_MIDI = [
  76, 76, 76, 75, 75, 75, 75, 73, 73, 73, 69, 69, 68, 76, 76
]

export const RUNAWAY_NOTE_S = 0.31
const VELOCITY = 0.22
const LEAD_IN = 0.04
const TAIL_S = 0.45
/** Space between end of one phrase and start of next (loop) */
const LOOP_GAP_S = 0.38

/**
 * @param {AudioContext} ctx
 * @param {AudioNode} destination
 * @param {number} anchorTime
 */
function playPhraseAt(ctx, destination, anchorTime) {
  let t = anchorTime + LEAD_IN
  for (const midi of RUNAWAY_PHRASE_MIDI) {
    playOneNote(ctx, destination, midi, t, RUNAWAY_NOTE_S)
    t += RUNAWAY_NOTE_S
  }
}

/**
 * @param {AudioContext} ctx
 * @param {AudioNode} destination
 * @param {number} startTime
 */
function playOneNote(ctx, destination, midi, startTime, duration = RUNAWAY_NOTE_S) {
  const freq = midiToFreq(midi)
  const osc = ctx.createOscillator()
  osc.type = 'triangle'
  const g = ctx.createGain()
  const lp = ctx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 3400
  lp.Q.value = 0.6
  osc.frequency.value = freq
  const t0 = startTime
  const t1 = t0 + 0.02
  const t2 = t0 + duration
  g.gain.setValueAtTime(0, t0)
  g.gain.linearRampToValueAtTime(VELOCITY, t1)
  g.gain.exponentialRampToValueAtTime(0.0008, t2)
  osc.connect(g)
  g.connect(lp)
  lp.connect(destination)
  osc.start(t0)
  osc.stop(t2 + 0.06)
}

function runawayLoopCycleMs() {
  return (LEAD_IN + RUNAWAY_PHRASE_MIDI.length * RUNAWAY_NOTE_S + LOOP_GAP_S) * 1000
}

/**
 * Plays the phrase once. Call after a user gesture (AudioContext policy).
 * @returns {Promise<void>}
 */
export function playRunawayPhrase() {
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return Promise.resolve()

  const ctx = new AC()
  const bus = ctx.createGain()
  bus.gain.value = 0.95
  bus.connect(ctx.destination)

  const durSec = LEAD_IN + RUNAWAY_PHRASE_MIDI.length * RUNAWAY_NOTE_S + TAIL_S

  return ctx
    .resume()
    .then(() => {
      playPhraseAt(ctx, bus, ctx.currentTime)
      return new Promise((resolve) => {
        setTimeout(() => {
          ctx.close().catch(() => {})
          resolve()
        }, durSec * 1000)
      })
    })
    .catch(() => {})
}

/**
 * Loops the phrase until `stop()` is called. Reuses one AudioContext.
 * Use capture-phase pointerdown during onboarding so audio starts before click handlers run.
 * @returns {() => void} stop
 */
export function startRunawayLoop() {
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return () => {}

  const ctx = new AC()
  const bus = ctx.createGain()
  bus.gain.value = 0.95
  bus.connect(ctx.destination)

  let cancelled = false
  /** @type {ReturnType<typeof setTimeout> | null} */
  let timeoutId = null
  const cycleMs = runawayLoopCycleMs()

  function tick() {
    if (cancelled) return
    playPhraseAt(ctx, bus, ctx.currentTime + 0.05)
    timeoutId = setTimeout(tick, cycleMs)
  }

  void ctx.resume().then(() => {
    if (!cancelled) tick()
  })

  return () => {
    cancelled = true
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = null
    ctx.close().catch(() => {})
  }
}
