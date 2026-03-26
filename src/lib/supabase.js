import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Anonymous session helper — device-based, no login required
export const getOrCreateSession = () => {
  let sessionId = localStorage.getItem('between_session_id')
  if (!sessionId) {
    sessionId = crypto.randomUUID()
    localStorage.setItem('between_session_id', sessionId)
  }
  return sessionId
}
