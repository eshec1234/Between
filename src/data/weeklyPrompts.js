/** One rotating prompt per ISO week — pairs with place exploration */

const PROMPTS = [
  'This week: notice one sound you usually filter out.',
  'This week: sit for five minutes without photographing anything.',
  'This week: leave one place gentler than you found it.',
  'This week: walk somewhere you usually drive past.',
  'This week: ask one question you do not need an answer to.',
  'This week: thank a building or tree under your breath.',
  'This week: carry silence with you into one noisy room.',
  'This week: revisit a place you only know once.',
  'This week: let someone else\'s prayer or grief share the bench.',
  'This week: name one color you did not expect to see.',
  'This week: follow the oldest path you can find.',
  'This week: trade one scroll for one window.',
  'This week: stand where two kinds of weather meet.',
  'This week: listen for your footsteps returning.',
  'This week: bless the threshold before you cross it.',
  'This week: let grief be a guest without a schedule.',
  'This week: find one word the stones already knew.',
  'This week: arrive early enough to feel unhurried.',
  'This week: offer one place your full face, not your profile.',
  'This week: end one walk before you are ready to leave.'
]

function isoWeekNumber(d = new Date()) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNum = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  return Math.ceil(((date - yearStart) / 86400000 + 1) / 7)
}

export function getWeeklyPrompt() {
  const d = new Date()
  const w = isoWeekNumber(d) + d.getUTCFullYear() * 100
  const idx = Math.abs(w) % PROMPTS.length
  return PROMPTS[idx]
}
