import { Link } from 'react-router-dom'

const BLOCKS = [
  {
    t: 'What it is',
    b: "Between is a contemplative mobile experience that lives in the space between the sacred and the uncanny. It doesn't tell you what to believe — it simply helps you get closer to the places where something has been felt."
  },
  {
    t: 'Sanctuary',
    b: 'For those who seek stillness. Sanctuary surfaces sacred spaces near you and offers guided prayer walkthroughs tailored to each tradition. All traditions are honored equally.'
  },
  {
    t: 'Theophany',
    b: 'For those who seek encounter. Theophany guides you toward liminal and haunted locations where the boundary between the ordinary and the extraordinary has grown thin.'
  },
  {
    t: 'Our approach',
    b: 'Between holds no religious position. It approaches every tradition with the same quality of attention: curious, reverent, and open.'
  },
  {
    t: "Who it's for",
    b: 'The faithful and the skeptical. The seeker and the wanderer. Anyone who has stood in a particular place and felt, even briefly, that something more was present.'
  }
]

export default function About() {
  return (
    <div className="min-h-screen overflow-y-auto bg-[#0e0c08] px-5 py-6 text-left">
      <Link
        to="/"
        className="mb-6 inline-block font-sans text-[9px] uppercase tracking-[0.22em] text-[#c8a870]"
      >
        ← Back
      </Link>
      <div className="mb-7 text-center">
        <div className="mb-2.5 font-sans text-[9px] uppercase tracking-[0.4em] text-[#7a6840]">About</div>
        <div className="font-display mb-3 text-2xl font-light tracking-[0.3em] text-[#e8d8a0]">Between</div>
        <div className="mx-auto h-px w-10 bg-gradient-to-r from-transparent via-[#c8a870] to-transparent" />
      </div>
      <p className="mb-6 text-center font-serif text-[15px] italic leading-relaxed text-[#c8b888]">
        There are places in this world that hold more than memory. Between is built for those who feel drawn
        toward them.
      </p>
      {BLOCKS.map(({ t, b }) => (
        <div key={t} className="mb-5 border-b border-[rgba(200,155,65,0.1)] pb-5 last:border-0">
          <div className="mb-2 font-sans text-[9px] uppercase tracking-[0.25em] text-[#c8a870]">{t}</div>
          <p className="m-0 font-serif text-sm leading-relaxed text-[#a89878]">{b}</p>
        </div>
      ))}
      <div className="pb-6 text-center font-sans text-[8px] uppercase tracking-[0.3em] text-[#504030]">
        Between · All traditions welcome
      </div>
    </div>
  )
}
