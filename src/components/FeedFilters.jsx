export default function FeedFilters({
  isTheophany,
  allTags,
  filterTag,
  setFilterTag,
  minIntensity,
  setMinIntensity,
  hideVisited,
  setHideVisited,
  savedOnly,
  setSavedOnly,
  subClass,
  borderClass,
  accentClass
}) {
  return (
    <div
      className={`mx-4 mt-2 rounded-xl border-2 px-3 py-3 ${
        isTheophany ? 'border-theophany-accent/25 bg-black/20' : 'border-sanctuary-accent/25 bg-white/[0.05]'
      }`}
    >
      <p className={`font-sans text-[8px] uppercase tracking-[0.35em] ${subClass}`}>Filters</p>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <label className={`flex items-center gap-2 font-sans text-[10px] ${subClass}`}>
          <span className="whitespace-nowrap">Tag</span>
          <select
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
            className={`max-w-[180px] rounded border bg-transparent px-2 py-1 font-sans text-[10px] ${borderClass} ${accentClass}`}
          >
            <option value="">Any</option>
            {allTags.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        {isTheophany && (
          <label className={`flex items-center gap-2 font-sans text-[10px] ${subClass}`}>
            <span>Intensity ≥</span>
            <select
              value={minIntensity}
              onChange={(e) => setMinIntensity(Number(e.target.value))}
              className={`rounded border bg-transparent px-2 py-1 font-sans text-[10px] ${borderClass} ${accentClass}`}
            >
              <option value={0}>Any</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className={`flex cursor-pointer items-center gap-2 font-sans text-[10px] ${subClass}`}>
          <input
            type="checkbox"
            checked={hideVisited}
            onChange={(e) => setHideVisited(e.target.checked)}
            className="rounded border-current"
          />
          Hide opened places
        </label>
        <label className={`flex cursor-pointer items-center gap-2 font-sans text-[10px] ${subClass}`}>
          <input
            type="checkbox"
            checked={savedOnly}
            onChange={(e) => setSavedOnly(e.target.checked)}
            className="rounded border-current"
          />
          Saved only
        </label>
      </div>
    </div>
  )
}
