export default function FeedFilters({
  isTheophany,
  hideVisited,
  setHideVisited,
  savedOnly,
  setSavedOnly,
  subClass
}) {
  return (
    <div
      className={`mx-4 mt-2 rounded-xl border-2 px-3 py-3 ${
        isTheophany ? 'border-theophany-accent/30 bg-theophany-primary/35' : 'border-sanctuary-accent/25 bg-white/[0.05]'
      }`}
    >
      <p className={`font-sans text-[8px] uppercase tracking-[0.35em] ${subClass}`}>Filters</p>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
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
