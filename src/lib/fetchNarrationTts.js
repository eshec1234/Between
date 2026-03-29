/**
 * Cloud narration via Supabase Edge Function → OpenAI gpt-4o-mini-tts (natural / style-promptable).
 * API key never touches the browser.
 */

export function isCloudNarrationConfigured() {
  return (
    import.meta.env.VITE_USE_CLOUD_NARRATION === 'true' &&
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
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
      apikey: key
    },
    body: JSON.stringify({ text, mode }),
    signal: options.signal
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || res.statusText)
  }
  return res.blob()
}
