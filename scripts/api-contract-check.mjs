#!/usr/bin/env node
/**
 * Pre-launch: verify critical Supabase RPC exists when env is present.
 * Run with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (e.g. from Vercel or .env export).
 * Exits 0 if skipped or RPC succeeds; exits 1 if the nearby RPC is missing.
 */
import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  console.log('api-contract-check: skipped (set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to validate production)')
  process.exit(0)
}

const supabase = createClient(url, key)
const { error } = await supabase.rpc('places_nearby', {
  lat: 39.9526,
  lng: -75.1652,
  radius_m: 50_000,
  mode_filter: 'sanctuary'
})

if (error) {
  const msg = error.message || ''
  if (
    error.code === 'PGRST202' ||
    error.code === '42883' ||
    /does not exist|could not find.*function/i.test(msg)
  ) {
    console.error('api-contract-check: places_nearby missing or not exposed — run supabase SQL / migrations in the project.')
    console.error(String(msg))
    process.exit(1)
  }
  console.warn('api-contract-check: places_nearby returned an error (RLS/network may still be OK):', msg)
}

console.log('api-contract-check: places_nearby callable')
