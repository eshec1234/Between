/**
 * Only allow https URLs on Character.AI hostnames (avoid open redirects).
 */
export function safeCharacterAiUrl(raw) {
  if (!raw || typeof raw !== 'string') return null
  try {
    const u = new URL(raw.trim())
    if (u.protocol !== 'https:') return null
    const h = u.hostname.toLowerCase()
    const ok =
      h === 'character.ai' ||
      h.endsWith('.character.ai') ||
      h === 'c.ai' ||
      h.endsWith('.c.ai')
    return ok ? u.href : null
  } catch {
    return null
  }
}
