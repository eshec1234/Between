import { createClient } from '@supabase/supabase-js'
import { supabaseUrl, supabaseAnonKey, hasSupabaseEnv } from './env'

export { hasSupabaseEnv }
export const supabase = hasSupabaseEnv ? createClient(supabaseUrl, supabaseAnonKey) : null

// Anonymous session helper — device-based, no login required
export const getOrCreateSession = () => {
  let sessionId = localStorage.getItem('between_session_id')
  if (!sessionId) {
    sessionId = crypto.randomUUID()
    localStorage.setItem('between_session_id', sessionId)
  }
  return sessionId
}
