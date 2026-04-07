/**
 * Cloud narration via Supabase Edge Function → OpenAI gpt-4o-mini-tts (natural / style-promptable).
 * API key never touches the browser.
 */

function envTruthy(val) {
  if (val == null || val === '') return false
  const s = String(val).trim().toLowerCase()
  return s === 'true' || s === '1' || s === 'yes'
}

export function isCloudNarrationConfigured() {
  return (
    envTruthy(import.meta.env.VITE_USE_CLOUD_NARRATION) &&
    Boolean(import.meta.env.VITE_SUPABASE_URL) &&
    Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY)
  )
}

/** Edge returns `{ error: string }` where string may be nested OpenAI JSON. */
function extractUpstreamMessage(bodyText) {
  const raw = String(bodyText || '').trim()
  if (!raw) return ''
  try {
    const outer = JSON.parse(raw)
    let blob = typeof outer.error === 'string' ? outer.error : raw
    if (typeof outer.error === 'object' && outer.error?.message) {
      return String(outer.error.message)
    }
    if (blob.startsWith('{')) {
      const inner = JSON.parse(blob)
      const m = inner?.error?.message ?? inner?.message
      if (typeof m === 'string') return m
    }
    return blob
  } catch {
    return raw.slice(0, 280)
  }
}

function narrationFailureHint(status, bodyText) {
  if (status === 503) {
    const msg = extractUpstreamMessage(bodyText)
    if (/missing\s+OPENAI_API_KEY/i.test(msg) || /Server missing/i.test(msg)) {
      return 'Cloud voice is off on the server (missing OpenAI API key in Supabase secrets). Using device voice.'
    }
    return msg ? `Narration unavailable: ${msg}` : 'Narration unavailable (server). Using device voice.'
  }
  if (status === 502) {
    const msg = extractUpstreamMessage(bodyText)
    const lower = msg.toLowerCase()
    if (/quota|billing|insufficient[_\s]?funds|payment|credit/i.test(lower)) {
      return 'OpenAI returned a billing or quota error (add credits or enable pay-as-you-go). Using device voice.'
    }
    if (msg) return `OpenAI / narration error: ${msg.slice(0, 160)} Using device voice.`
    return 'Narration failed upstream. Using device voice.'
  }
  return ''
}

/**
 * @param {string} text
 * @param {{ signal?: AbortSignal, mode?: 'sanctuary' | 'theophany' }} [options]
 * @returns {Promise<Blob>}
 */
export async function fetchNarrationTts(text, options = {}) {
  const base = String(import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '')
  const url = `${base}/functions/v1/tts-narration`
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  const mode = options.mode === 'theophany' ? 'theophany' : 'sanctuary'
  const voiceSanctuary = String(import.meta.env.VITE_TTS_VOICE_SANCTUARY || 'nova').trim()
  const voiceTheophany = String(import.meta.env.VITE_TTS_VOICE_THEOPHANY || 'marin').trim()
  const voice = mode === 'theophany' ? voiceTheophany : voiceSanctuary
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
      apikey: key
    },
    body: JSON.stringify({ text, mode, voice }),
    signal: options.signal
  })
  if (!res.ok) {
    const err = (await res.text()) || res.statusText
    if (res.status === 503 || res.status === 502) {
      const hint = narrationFailureHint(res.status, err)
      throw new Error(hint || String(err).slice(0, 200))
    }
    throw new Error(err || res.statusText)
  }
  return res.blob()
}
