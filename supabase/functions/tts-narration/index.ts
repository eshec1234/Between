/**
 * OpenAI gpt-4o-mini-tts: neural voice + style instructions (whisper, pace, tone).
 * Deploy: supabase secrets set OPENAI_API_KEY=sk-...  then  supabase functions deploy tts-narration
 * Policy: disclose AI-generated audio to users (handled in PlaceWalkthrough UI).
 */
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}

const MAX_CHARS = 4096

/** OpenAI built-in voices only — client may suggest one; server env still wins first. */
const ALLOWED_VOICES = new Set([
  'alloy',
  'ash',
  'ballad',
  'coral',
  'echo',
  'fable',
  'nova',
  'onyx',
  'sage',
  'shimmer',
  'verse',
  'marin',
  'cedar'
])

/** Sanctuary: slow, warm, human — dry “voice booth” sound (model often adds fake space otherwise) */
const INSTRUCTIONS_SANCTUARY =
  'You are a calm guide reading aloud in a soft, unhurried voice—like a gentle audiobook or mindfulness recording, not a podcast host or GPS. ' +
  'Speak slowly; use brief silence after commas and phrases (timing only—do not sound distant or hollow). ' +
  'Sound production: dry, intimate, close microphone in a small dead room or voice booth. No reverb, no echo, no cathedral or hall resonance, no “I am in a big empty room” coloration. Up-front and present, not booming or swimmy. ' +
  'Natural prosody: gentle stress on meaning, subtle rise and fall, never punchy or salesy. Warm and steady. ' +
  'Avoid bright cheer, fast patter, robotic evenness, or over-enunciated “AI clarity.” No whisper; stay clear and human.'

/** Theophany: intimate, liminal ASMR — can stay unsettling */
const INSTRUCTIONS_THEOPHANY =
  'Speak slowly and softly with a low, intimate, ASMR-inspired delivery. ' +
  'Use a gentle near-whisper—close, slightly unsettling, liminal. ' +
  'Small pauses between phrases. Sound human, breath-adjacent, unhurried—never bright or cheerful.'

/**
 * Priority (fixes old bug: OPENAI_TTS_VOICE used to override *everything*):
 * 1) Per-mode secret (OPENAI_TTS_VOICE_SANCTUARY / THEOPHANY)
 * 2) Client body.voice if whitelisted (VITE_TTS_VOICE_* from browser)
 * 3) Global OPENAI_TTS_VOICE
 * 4) Default (coral / marin)
 */
function pickVoice(mode: string | undefined, clientVoice: string | undefined): string {
  const global = Deno.env.get('OPENAI_TTS_VOICE')
  const fromClient = clientVoice && ALLOWED_VOICES.has(clientVoice) ? clientVoice : undefined

  if (mode === 'theophany') {
    return (
      Deno.env.get('OPENAI_TTS_VOICE_THEOPHANY') ||
      fromClient ||
      global ||
      'marin'
    )
  }

  return (
    Deno.env.get('OPENAI_TTS_VOICE_SANCTUARY') ||
    fromClient ||
    global ||
    'coral'
  )
}

function resolveSpeed(mode: string | undefined): number {
  const def = mode === 'theophany' ? 0.9 : 0.86
  const env =
    mode === 'theophany'
      ? Deno.env.get('OPENAI_TTS_SPEED_THEOPHANY')
      : Deno.env.get('OPENAI_TTS_SPEED_SANCTUARY')
  if (env) {
    const n = Number(env)
    if (!Number.isNaN(n) && n >= 0.25 && n <= 4) return n
  }
  return def
}

function resolveInstructions(mode: string | undefined): string {
  return mode === 'theophany' ? INSTRUCTIONS_THEOPHANY : INSTRUCTIONS_SANCTUARY
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const key = Deno.env.get('OPENAI_API_KEY')
  if (!key) {
    return new Response(JSON.stringify({ error: 'Server missing OPENAI_API_KEY' }), {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  let text = ''
  let mode: string | undefined
  let clientVoice: string | undefined
  try {
    const body = await req.json()
    text = typeof body.text === 'string' ? body.text : ''
    const m = typeof body.mode === 'string' ? body.mode.trim().toLowerCase() : ''
    if (m === 'theophany' || m === 'sanctuary') mode = m
    if (typeof body.voice === 'string') {
      const v = body.voice.trim().toLowerCase()
      if (ALLOWED_VOICES.has(v)) clientVoice = v
    }
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const trimmed = text.trim().slice(0, MAX_CHARS)
  if (!trimmed) {
    return new Response(JSON.stringify({ error: 'Missing text' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const voice = pickVoice(mode, clientVoice)
  const instructions = resolveInstructions(mode)
  const speed = resolveSpeed(mode)

  const upstream = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini-tts',
      voice,
      input: trimmed,
      instructions,
      speed,
      response_format: 'mp3'
    })
  })

  if (!upstream.ok) {
    const errText = await upstream.text()
    return new Response(JSON.stringify({ error: errText || upstream.statusText }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const buf = await upstream.arrayBuffer()
  return new Response(buf, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'no-store'
    }
  })
})
