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
      const tail = String(err).slice(0, 120)
      throw new Error(
        `Narration unavailable (edge function or OpenAI secret). Falling back to device voice. ${tail}`
      )
    }
    throw new Error(err || res.statusText)
  }
  return res.blob()
}
