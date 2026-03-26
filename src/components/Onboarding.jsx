export default function Onboarding({ onComplete }) {
  return (
    <div className="fixed inset-0 z-50 bg-[#1a1610] flex items-center justify-center p-6">
      <div className="max-w-sm text-center space-y-6">
        <h1 className="text-3xl font-serif text-[#f0e8d0] tracking-widest">Between</h1>

        <div className="space-y-4">
          <p className="text-lg font-serif text-[#e8d8a8] italic">
            "You don't need to believe in anything. You just need to have felt something."
          </p>

          <p className="text-sm font-sans text-[#9a8868] uppercase tracking-wider">
            This app reports human experiences, not objective truth.
          </p>
        </div>

        <button
          onClick={onComplete}
          className="mt-8 px-8 py-3 border border-[#c8a870] text-[#e8c870] font-serif uppercase tracking-widest text-sm hover:bg-[#c8a870]/20 transition-colors"
        >
          Enter
        </button>
      </div>
    </div>
  )
}
