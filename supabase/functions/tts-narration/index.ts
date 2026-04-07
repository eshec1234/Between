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

/** Sanctuary: human reader — avoid flat “assistant” prosody */
const INSTRUCTIONS_SANCTUARY =
  'You are a calm adult reading this aloud to someone in person—like a thoughtful podcast host or audiobook narrator, not a GPS or smart speaker. ' +
  'Use natural human prosody: breathe at punctuation, vary pace slightly between phrases, emphasize meaning with gentle stress—not every word at equal weight. ' +
  'Warm, relaxed cadence; conversational rhythm with light lift at clause boundaries. ' +
  'Avoid monotone, robotic evenness, over-crisp “AI clarity,” or synthetic cheer. Sound like a real person sharing a quiet moment.'

/** Theophany: intimate, liminal ASMR — can stay unsettling */
const INSTRUCTIONS_THEOPHANY =
  'Speak slowly and softly with a low, intimate, ASMR-inspired delivery. ' +
  'Use a gentle near-whisper—close, slightly unsettling, liminal. ' +
  'Small pauses between phrases. Sound human, breath-adjacent, unhurried—never bright or cheerful.'

function resolveVoice(mode: string | undefined): string {
  const global = Deno.env.get('OPENAI_TTS_VOICE')
  if (global) return global
  if (mode === 'theophany') {
    return Deno.env.get('OPENAI_TTS_VOICE_THEOPHANY') || 'marin'
  }
  return Deno.env.get('OPENAI_TTS_VOICE_SANCTUARY') || 'nova'
}

function resolveSpeed(mode: string | undefined): number {
  const def = mode === 'theophany' ? 0.9 : 0.92
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
  try {
    const body = await req.json()
    text = typeof body.text === 'string' ? body.text : ''
    const m = typeof body.mode === 'string' ? body.mode.trim().toLowerCase() : ''
    if (m === 'theophany' || m === 'sanctuary') mode = m
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

  const voice = resolveVoice(mode)
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
