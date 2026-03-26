export default function LocationConsentModal({ onAgree, onDecline }) {
  return (
    <div className="absolute inset-0 z-[500] flex items-center justify-center bg-[rgba(8,6,2,0.88)] px-4">
      <div
        className="w-[86%] max-w-[310px] rounded-xl border border-[rgba(200,168,112,0.38)] bg-[#17130d] px-6 py-7 text-center animate-bpop"
        role="dialog"
        aria-labelledby="consent-title"
      >
        <div className="mb-3 text-[22px]">✦</div>
        <h2 id="consent-title" className="font-display mb-3.5 text-sm tracking-[0.12em] text-[#e8d8a8]">
          Before You Enter
        </h2>
        <p className="mb-5 font-serif text-xs italic leading-relaxed text-[#9a8868]">
          Between uses your location to surface nearby sacred and significant spaces, and to alert you when you
          approach a site of note. Your location is never stored or shared.
        </p>
        <p className="mb-6 font-sans text-[11px] leading-relaxed text-[#7a6848]">
          By tapping <strong className="text-[#c8a870]">Agree</strong>, you consent to location-based features of
          this app.
        </p>
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onAgree}
            className="cursor-pointer rounded-[5px] border border-[rgba(200,168,112,0.5)] bg-[rgba(200,168,112,0.15)] px-4 py-3 font-display text-[11px] uppercase tracking-[0.22em] text-[#e8c870]"
          >
            Agree
          </button>
          <button
            type="button"
            onClick={onDecline}
            className="cursor-pointer rounded-[5px] border border-[rgba(150,130,90,0.25)] bg-transparent px-4 py-2.5 font-sans text-[9px] uppercase tracking-[0.18em] text-[#6a5838]"
          >
            Continue without location
          </button>
        </div>
      </div>
    </div>
  )
}
