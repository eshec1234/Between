/**
 * Very soft triad pads (Web Audio, no samples).
 * Previously: five low stacked sines (110–220 Hz) read as “airplane / turbofan” rumble + beating.
 * Now: three higher triad tones, HPF on rumble band, wider open LPF — airy, not cabin noise.
 */

/** C major triad (C4–G4) — clear, warm, no sub-bass stack */
const SANCTUARY_HZ = [261.63, 329.63, 392.0]
/** C minor triad — same register, slightly duskier */
const THEOPHANY_HZ = [261.63, 311.13, 392.0]

function detuneHz(f) {
  return f * (1 + (Math.random() - 0.5) * 0.0012)
}

const FADE_IN_S = 3.8
const FADE_SWITCH_S = 1.4

export function createZenAmbientEngine(ctx) {
  const outputGain = ctx.createGain()
  outputGain.gain.value = 0
  outputGain.connect(ctx.destination)

  let variant = 'sanctuary'
  let scheduleId = null
  let graph = null

  function stopGraph() {
    if (scheduleId) {
      clearTimeout(scheduleId)
      scheduleId = null
    }
    if (!graph) return
    const { oscs, inner, hp, lp } = graph
    for (const { o, g } of oscs) {
      try {
        o.stop()
      } catch {
        /* already stopped */
      }
      try {
        o.disconnect()
        g.disconnect()
      } catch {
        /* ignore */
      }
    }
    try {
      inner.disconnect()
      hp.disconnect()
      lp.disconnect()
    } catch {
      /* ignore */
    }
    graph = null
  }

  function buildChord(v) {
    const freqs = v === 'theophany' ? THEOPHANY_HZ : SANCTUARY_HZ
    const inner = ctx.createGain()
    const hp = ctx.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = 200
    hp.Q.value = 0.5
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = v === 'theophany' ? 4000 : 4500
    lp.Q.value = 0.5

    inner.connect(hp)
    hp.connect(lp)
    lp.connect(outputGain)

    const t = ctx.currentTime
    const perOsc = v === 'theophany' ? 0.032 : 0.036
    const peak = v === 'theophany' ? 0.14 : 0.16
    const oscs = []
    for (const f of freqs) {
      const o = ctx.createOscillator()
      o.type = 'sine'
      o.frequency.value = detuneHz(f)
      const g = ctx.createGain()
      g.gain.value = perOsc
      o.connect(g)
      g.connect(inner)
      o.start(t)
      oscs.push({ o, g })
    }
    inner.gain.setValueAtTime(0, t)
    inner.gain.linearRampToValueAtTime(peak, t + FADE_IN_S)
    graph = { oscs, inner, hp, lp }
  }

  function setVariant(next) {
    if (next !== 'sanctuary' && next !== 'theophany') return
    if (next === variant && graph) return
    variant = next
    const t = ctx.currentTime
    if (graph) {
      graph.inner.gain.cancelScheduledValues(t)
      graph.inner.gain.setValueAtTime(graph.inner.gain.value, t)
      graph.inner.gain.linearRampToValueAtTime(0, t + FADE_SWITCH_S)
      const saved = next
      if (scheduleId) clearTimeout(scheduleId)
      scheduleId = setTimeout(() => {
        scheduleId = null
        stopGraph()
        buildChord(saved)
      }, FADE_SWITCH_S * 1000 + 40)
    } else {
      buildChord(next)
    }
  }

  function setMuted(muted) {
    const target = muted ? 0 : 0.7
    const now = ctx.currentTime
    outputGain.gain.cancelScheduledValues(now)
    outputGain.gain.setValueAtTime(outputGain.gain.value, now)
    outputGain.gain.linearRampToValueAtTime(target, now + 0.35)
  }

  function dispose() {
    if (scheduleId) {
      clearTimeout(scheduleId)
      scheduleId = null
    }
    const t = ctx.currentTime
    outputGain.gain.cancelScheduledValues(t)
    outputGain.gain.setValueAtTime(outputGain.gain.value, t)
    outputGain.gain.linearRampToValueAtTime(0, t + 0.45)
    setTimeout(() => {
      stopGraph()
      try {
        outputGain.disconnect()
      } catch {
        /* ignore */
      }
    }, 480)
  }

  return {
    setVariant,
    setMuted,
    dispose,
    get variant() {
      return variant
    }
  }
}
