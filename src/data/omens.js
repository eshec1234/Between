export const OMENS = [
  'The threshold you avoid is the one already calling your name.',
  'Something left behind in this place has been waiting for your particular silence.',
  'What you came to find has already found you. Walk slowly.',
  "The door that won't open is not locked — it is listening.",
  'You are not the first to stand here and feel the floor shift beneath certainty.',
  'What watches from the corner does not mean you harm. It means you attention.',
  'The coldest rooms hold the most unfinished things.',
  'You will pass a threshold today that you cannot un-cross.',
  'The figure at the edge of your vision has been there longer than you know.',
  'Stillness is not the absence of presence. It is presence, held.',
  'Something in the walls here remembers every name it has heard.',
  'The part of you that hesitates at the entrance is the wisest part.',
  'Not all that follows you is dangerous. Some of it is simply lonely.',
  'You were drawn here. That is not nothing.',
  'The air in this place is older than the building that contains it.'
]

export function getDailyOmen() {
  const d = new Date()
  const idx = (d.getFullYear() * 366 + d.getMonth() * 31 + d.getDate()) % OMENS.length
  return OMENS[idx]
}
