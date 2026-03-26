const firstNonEmpty = (...values) => values.find((value) => typeof value === 'string' && value.trim().length > 0) || ''

export const supabaseUrl = firstNonEmpty(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_PUBLIC_SUPABASE_URL
)

export const supabaseAnonKey = firstNonEmpty(
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY
)

export const mapboxToken = firstNonEmpty(
  import.meta.env.VITE_MAPBOX_TOKEN,
  import.meta.env.VITE_MAPBOX_ACCESS_TOKEN,
  import.meta.env.VITE_PUBLIC_MAPBOX_TOKEN
)

export const hasSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey)
export const hasMapboxEnv = Boolean(mapboxToken)
