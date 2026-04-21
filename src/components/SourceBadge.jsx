/** VERIFIED vs IMPORTED vs COMMUNITY — visually distinct per product spec */
export default function SourceBadge({ source, sourceConfidence, className = '', compact = false }) {
  const sourceValue = (source || '').toLowerCase()
  const conf = (sourceConfidence || '').toLowerCase()
  const imported = conf === 'imported' || sourceValue === 'low_confidence_import'
  const verified = !imported && sourceValue === 'verified'
  return (
    <span
      className={`inline-flex items-center rounded font-sans uppercase tracking-wider ${
        compact ? 'px-1.5 py-0.5 text-[8px]' : 'px-2 py-0.5 text-[9px]'
      } ${
        verified
          ? 'border border-emerald-600/80 bg-emerald-950/40 text-emerald-200'
          : imported
            ? 'border border-orange-700/70 bg-orange-950/30 text-orange-200'
            : 'border border-amber-700/60 bg-amber-950/30 text-amber-100'
      } ${className}`}
    >
      {verified ? 'Verified' : imported ? 'Imported' : 'Community'}
    </span>
  )
}
