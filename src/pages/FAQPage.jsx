import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FAQ_ITEMS } from '../data/faq'

export default function FAQPage() {
  const [open, setOpen] = useState(null)

  return (
    <div className="min-h-screen overflow-y-auto bg-[#0a0e0e] px-5 py-6">
      <Link
        to="/"
        className="mb-6 inline-block font-sans text-[9px] uppercase tracking-[0.22em] text-[#7ababa]"
      >
        ← Back
      </Link>
      <div className="mb-7 text-center">
        <div className="mb-2.5 font-sans text-[9px] uppercase tracking-[0.4em] text-[#2e6060]">Frequently asked</div>
        <div className="font-serif mb-3 text-[22px] font-light tracking-[0.2em] text-[#b0d8d8]">Questions</div>
        <div className="mx-auto h-px w-10 bg-gradient-to-r from-transparent via-[#7ababa] to-transparent" />
      </div>
      {FAQ_ITEMS.map((f, i) => (
        <div key={f.q} className="border-b border-[rgba(70,155,155,0.12)]">
          <button
            type="button"
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between gap-3 py-3.5 text-left"
          >
            <span
              className={`flex-1 font-serif text-[13px] leading-snug ${
                open === i ? 'text-[#b0d8d8]' : 'text-[#7a9898]'
              }`}
            >
              {f.q}
            </span>
            <span
              className="flex-shrink-0 text-sm text-[#4a8888] transition-transform"
              style={{ transform: open === i ? 'rotate(45deg)' : 'none' }}
            >
              +
            </span>
          </button>
          {open === i && (
            <div className="pb-3.5">
              <p className="m-0 font-serif text-[13px] italic leading-relaxed text-[#6a9090]">{f.a}</p>
            </div>
          )}
        </div>
      ))}
      <div className="py-5 text-center font-sans text-[8px] uppercase tracking-[0.3em] text-[#1e3838]">
        Between · Version 1.0
      </div>
    </div>
  )
}
