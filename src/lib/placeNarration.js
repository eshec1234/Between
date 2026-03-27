/**
 * Second-person walkthrough beats from place data — feels like being there.
 * No network; safe to ship in the client.
 */

function clip(s, max = 420) {
  const t = (s || '').trim()
  if (t.length <= max) return t
  return `${t.slice(0, max).trim()}…`
}

export function buildWalkthroughSteps(place) {
  const name = place.name || 'this place'
  const city = place.city || ''
  const state = place.state || ''
  const where = [city, state].filter(Boolean).join(', ')
  const desc = clip(place.description || '', 520)
  const primaryTag = place.category_tags?.[0] || 'place'
  const mode = place.mode || 'sanctuary'
  const intensity = place.intensity

  const steps = []

  if (mode === 'sanctuary') {
    steps.push({
      id: 'arrival',
      title: 'Arrival',
      body: `You come toward ${name} in ${where || 'still air'}. Traffic and hurry thin with each step — as if the world agreed to lower its voice before you even reach the door.`
    })
    steps.push({
      id: 'threshold',
      title: 'The threshold',
      body: `You cross into a ${primaryTag} held by habit and hope. Light falls differently here: slower, older. You let your shoulders drop without deciding to.`
    })
    steps.push({
      id: 'presence',
      title: 'What stays with you',
      body:
        desc ||
        `You stand in a room that has listened longer than you have lived. Nothing asks you to perform — only to be present.`
    })
    steps.push({
      id: 'stillness',
      title: 'The hush between thoughts',
      body: `Breath lengthens. Sound becomes texture — a door, a footstep, a distant bell. You are not watching this place; you are inside it, briefly unwound from time.`
    })
    steps.push({
      id: 'departure',
      title: 'Carrying it forward',
      body: `When you leave, something of the quiet walks with you — a small weightless weight, a line of light behind the eyes. You were here. That is enough.`
    })
    return steps
  }

  if (mode === 'theophany') {
    steps.push({
      id: 'approach',
      title: 'Approach',
      body: `You move toward ${name} in ${where || 'gathering dusk'}. The air feels slightly wrong in the right way — tuned to a frequency you cannot name.`
    })
    steps.push({
      id: 'edge',
      title: 'The edge of ordinary',
      body: `This ${primaryTag} does not explain itself. Corners hold shadow a beat too long; silence has texture, like fabric. You slow down without choosing to.`
    })
    steps.push({
      id: 'witness',
      title: 'What the place remembers',
      body:
        desc ||
        `You sense layers — footfalls that are not only yours. History here is not a lesson; it is atmosphere pressing gently against the skin.`
    })
    if (intensity != null && intensity >= 1) {
      const level =
        intensity <= 2
          ? 'a low hum at the edge of awareness'
          : intensity <= 4
            ? 'a steady pull, like tide under ice'
            : 'a strong pull — the boundary feels thin'
      steps.push({
        id: 'charge',
        title: 'Charge of the place',
        body: `On the intensity you sense here, the place registers as ${level}. Nothing demands belief — only attention. You notice what you are ready to notice.`
      })
    }
    steps.push({
      id: 'linger',
      title: 'Linger or leave',
      body: `You can stay with the unease or step back into the ordinary. Either way, the place has marked you lightly — a question you will carry without needing an answer.`
    })
    return steps
  }

  // mode === 'both'
  steps.push({
    id: 'arrival',
    title: 'Arrival',
    body: `You approach ${name} in ${where || 'open air'}. Something here holds both shelter and strangeness — a door that is also a question.`
  })
  steps.push({
    id: 'sanctuary',
    title: 'Stillness',
    body: `For a moment, breath deepens. Light and stone ask nothing of you. You could pray, or simply be — the ${primaryTag} does not sort your reasons.`
  })
  steps.push({
    id: 'liminal',
    title: 'The other current',
    body:
      (desc ? `${clip(desc, 320)}\n\n` : '') +
      `Under that calm runs another thread — a creak in the floorboards of the world. You feel both held and watched; both are honest.`
  })
  steps.push({
    id: 'departure',
    title: 'Walking out',
    body: `You step back into the day carrying two temperatures: warmth and unease, braided. The place does not release you all at once — it unspools.`
  })
  return steps
}
