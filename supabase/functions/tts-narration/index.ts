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

const INSTRUCTIONS =
  'Speak slowly and softly with a warm, calming, ASMR-inspired delivery. ' +
  'Use a gentle, near-whisper intimacy—close and relaxed, not a broadcast or announcer voice. ' +
  'Leave small pauses between phrases. Sound human, breath-adjacent, and unhurried.'

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
  try {
    const body = await req.json()
    text = typeof body.text === 'string' ? body.text : ''
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

  const voice = Deno.env.get('OPENAI_TTS_VOICE') || 'marin'

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
      instructions: INSTRUCTIONS,
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
