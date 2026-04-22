export const INTENSITY_LEVELS = [
  { label: 'Subtle', c: '#4a9090' },
  { label: 'Moderate', c: '#5a7a5a' },
  { label: 'Strong', c: '#8a7a30' },
  { label: 'Intense', c: '#9a4a30' },
  { label: 'Extreme', c: '#8a1a2a' }
]

/** Theophany: three tiers only — every place maps to 1 (from DB 1–2), 2 (3), or 3 (4–5); unknown → 2 */
export const INTENSITY_LEVELS_THEOPHANY = [
  { label: 'Quiet / subtle', c: '#6b5a8c' },
  { label: 'Present', c: '#9a6a55' },
  { label: 'High charge', c: '#9a2a4a' }
]

/** Map stored 1–5 (or null) to display tier 1–3 for Theophany UI and filters */
export function theophanyIntensityTier(raw) {
  if (raw == null || raw === '') return 2
  const n = Math.min(5, Math.max(1, Number(raw)))
  if (n <= 2) return 1
  if (n === 3) return 2
  return 3
}
