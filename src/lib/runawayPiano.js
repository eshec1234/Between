/**
 * Opening right-hand phrase from Kanye West "Runaway" (E major line, as commonly transcribed).
 * Short educational / demo playback — not a full arrangement; support original artists.
 */

function midiToFreq(m) {
  return 440 * 2 ** ((m - 69) / 12)
}

/** E5 E5 E5 | D#5 ×4 | C#5 ×3 | A4 A4 G#4 | E5 E5 */
const RUNAWAY_PHRASE_MIDI = [
  76, 76, 76, 75, 75, 75, 75, 73, 73, 73, 69, 69, 68, 76, 76
]

const NOTE_S = 0.31
const VELOCITY = 0.22

/**
 * @param {AudioContext} ctx
 * @param {AudioNode} destination
 * @param {number} startTime
 */
function playOneNote(ctx, destination, midi, startTime, duration = NOTE_S) {
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

  const leadIn = 0.04
  const tailS = 0.45
  const durSec = leadIn + RUNAWAY_PHRASE_MIDI.length * NOTE_S + tailS

  return ctx
    .resume()
    .then(() => {
      const t0 = ctx.currentTime + leadIn
      let t = t0
      for (const midi of RUNAWAY_PHRASE_MIDI) {
        playOneNote(ctx, bus, midi, t, NOTE_S)
        t += NOTE_S
      }
      return new Promise((resolve) => {
        setTimeout(() => {
          ctx.close().catch(() => {})
          resolve()
        }, durSec * 1000)
      })
    })
    .catch(() => {})
}
