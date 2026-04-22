import { SANCTUARY_TRADITIONS } from '../data/sanctuaryTraditions'

export default function SanctuaryTraditionBar({ value, onChange, subClass, borderClass }) {
  return (
    <div className="rounded-xl border-2 border-sanctuary-accent/25 bg-white/[0.06] px-3 py-3">
      <p className={`font-sans text-[8px] uppercase tracking-[0.35em] ${subClass}`}>Tradition</p>
      <p className={`mt-1 font-sans text-[10px] leading-snug opacity-90 ${subClass}`}>
        Browse in order: everything, faith & worship, then loose groupings (memorials, campuses, landmarks, outdoors).
        Matching uses tags and short descriptions — tap “All” to clear.
      </p>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {SANCTUARY_TRADITIONS.map((t) => (
          <button
            key={t.id === '' ? 'all' : t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={`rounded-full border px-2.5 py-1.5 font-sans text-[9px] font-medium uppercase tracking-wider transition-colors sm:text-[10px] ${
              value === t.id
                ? 'border-sanctuary-accent bg-sanctuary-accent/18 text-sanctuary-text'
                : `${borderClass} ${subClass} hover:bg-black/[0.04]`
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  )
}
