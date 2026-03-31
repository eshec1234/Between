export default function LocationConsentModal({ onAgree, onDecline }) {
  return (
    <div
      className="fixed inset-0 z-[500] flex min-h-[100dvh] items-center justify-center overflow-y-auto overscroll-contain bg-[rgba(5,4,2,0.94)] px-5 py-10 sm:px-8"
      role="presentation"
    >
      <div
        className="my-auto w-full max-w-md rounded-2xl border border-[rgba(200,168,112,0.45)] bg-[#141109] px-7 py-9 text-center shadow-[0_8px_1px_rgba(0,0,0,0.4),0_32px_96px_rgba(0,0,0,0.55)] sm:max-w-lg sm:px-10 sm:py-10 animate-bpop"
        role="dialog"
        aria-modal="true"
        aria-labelledby="consent-title"
      >
        <div className="mb-4 text-3xl leading-none sm:text-4xl" aria-hidden>
          ✦
        </div>
        <h2
          id="consent-title"
          className="font-display mb-4 text-base leading-snug tracking-[0.14em] text-[#f0e4c8] sm:text-lg"
        >
          Before You Enter
        </h2>
        <p className="mb-5 font-serif text-sm italic leading-relaxed text-[#b8a67a] sm:text-[15px]">
          Between uses your location to surface nearby sacred and significant spaces, and to alert you when you
          approach a site of note. Your location is never stored or shared.
        </p>
        <p className="mb-8 font-sans text-sm leading-relaxed text-[#8f7d58] sm:text-[15px]">
          By tapping <strong className="font-semibold text-[#d4b870]">Agree</strong>, you consent to location-based
          features of this app.
        </p>
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={onAgree}
            className="min-h-[52px] cursor-pointer rounded-lg border border-[rgba(200,168,112,0.55)] bg-[rgba(200,168,112,0.2)] px-5 py-3.5 font-display text-xs uppercase tracking-[0.2em] text-[#f5e2a8] transition-colors hover:bg-[rgba(200,168,112,0.28)] sm:text-sm"
          >
            Agree
          </button>
          <button
            type="button"
            onClick={onDecline}
            className="min-h-[48px] cursor-pointer rounded-lg border border-[rgba(150,130,90,0.35)] bg-transparent px-5 py-3 font-sans text-[11px] uppercase tracking-[0.16em] text-[#9a8a68] transition-colors hover:border-[rgba(150,130,90,0.5)] sm:text-xs"
          >
            Continue without location
          </button>
        </div>
      </div>
    </div>
  )
}
