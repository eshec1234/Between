import { Link } from 'react-router-dom'
import AppFrame from '../components/AppFrame'

const BLOCKS = [
  {
    t: 'Our story',
    b: "Between was founded by a group of students at Lehigh University in Bethlehem, Pennsylvania. What started as a late-night conversation about sacred spaces — the churches we wandered into, the battlefields that felt haunted, the forests where time moved differently — became a question: what if an app could bring you closer to those places rather than pull you away from them? Between is that answer."
  },
  {
    t: 'Who we are',
    b: "We are designers, developers, and believers in the liminal — students who have sat in cathedrals at midnight, walked Civil War fields at dusk, and lit candles in mosques we weren't sure we were allowed to enter. Between grew out of our own searching. It is made for searchers."
  },
  {
    t: 'Sanctuary',
    b: 'For those who seek stillness. Sanctuary surfaces sacred spaces near you — churches, temples, mosques, meditation centers, ancient groves — and offers AI-guided prayer walkthroughs tailored to each tradition. Every tradition is honored equally and approached with care.'
  },
  {
    t: 'Theophany',
    b: 'Theophany — meaning "divine appearing" — is for those who seek encounter. It guides you toward liminal and haunted locations where the boundary between the ordinary and the extraordinary has grown thin. Immersive AI narration puts you inside each space, moment by moment.'
  },
  {
    t: 'Our approach',
    b: 'Between holds no religious position and endorses no tradition over another. It approaches every sacred site, every reported unexplained experience, and every tradition of prayer with the same quality of attention: curious, reverent, and open.'
  },
  {
    t: 'A note on respect',
    b: 'We built Between knowing that places of worship and ancestral significance belong to communities, not to apps. We ask users to approach every space with humility. If you enter, listen more than you speak. If you are asked to leave, leave gracefully.'
  }
]

export default function About() {
  return (
    <AppFrame>
      <div className="min-h-0 flex-1 overflow-y-auto bg-[#100d08] px-5 py-6 text-left">
        <Link
          to="/"
          className="mb-7 inline-block font-sans text-[9px] uppercase tracking-[0.22em] text-[#c8a870]"
        >
          ← Back
        </Link>
        <div className="mb-8 text-center">
          <div className="mb-3 font-sans text-[9px] uppercase tracking-[0.4em] text-[#7a6840]">About</div>
          <div className="font-display mb-3.5 text-[26px] font-light tracking-[0.28em] text-[#e8d8a0]">Between</div>
          <div className="mx-auto h-px w-12 bg-gradient-to-r from-transparent via-[#c8a870] to-transparent" />
        </div>
        <p className="mb-7 px-1 text-center font-serif text-[15px] italic leading-relaxed text-[#c8b888]">
          There are places in this world that hold more than memory.
          <br />
          Between is built for those who feel drawn toward them.
        </p>
        {BLOCKS.map(({ t, b }) => (
          <div key={t} className="mb-5 border-b border-[rgba(200,155,65,0.1)] pb-5 last:border-0">
            <div className="mb-2 font-sans text-[9px] uppercase tracking-[0.25em] text-[#c8a870]">{t}</div>
            <p className="m-0 font-serif text-sm leading-relaxed text-[#a89878]">{b}</p>
          </div>
        ))}
        <div className="px-4 pb-8 pt-4 text-center font-sans text-[8px] uppercase tracking-[0.3em] text-[#504030]">
          Between · Lehigh University · All traditions welcome
        </div>
      </div>
    </AppFrame>
  )
}
