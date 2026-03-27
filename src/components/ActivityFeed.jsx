import { Link } from 'react-router-dom'
import { mergeActivityStream } from '../lib/feed'

function snippet(text, n = 72) {
  if (!text) return ''
  const t = text.trim()
  return t.length <= n ? t : `${t.slice(0, n)}…`
}

export default function ActivityFeed({
  recentPlaces = [],
  recentReports = [],
  trendingPlaces = [],
  isTheophany,
  loading
}) {
  const stream = mergeActivityStream(recentPlaces, recentReports, 14)

  const pill = (active) =>
    `whitespace-nowrap rounded-full border px-3 py-1.5 font-sans text-[10px] uppercase tracking-wider transition-colors ${
      active
        ? isTheophany
          ? 'border-theophany-accent bg-theophany-accent/20 text-theophany-text'
          : 'border-sanctuary-accent bg-sanctuary-accent/15 text-sanctuary-text'
        : isTheophany
          ? 'border-theophany-muted/40 text-theophany-muted'
          : 'border-sanctuary-muted/40 text-sanctuary-muted'
    }`

  if (loading) {
    return (
      <div className="px-4 pb-2">
        <p className={`font-sans text-[10px] uppercase tracking-widest ${isTheophany ? 'text-theophany-muted' : 'text-sanctuary-muted'}`}>
          Activity
        </p>
        <p className={`mt-2 font-serif text-sm italic ${isTheophany ? 'text-theophany-muted' : 'text-sanctuary-muted'}`}>
          Loading nearby…
        </p>
      </div>
    )
  }

  return (
    <div className="px-4 pb-3">
      <div className="mb-2 flex items-end justify-between gap-2">
        <div>
          <p
            className={`font-sans text-[10px] uppercase tracking-[0.35em] ${
              isTheophany ? 'text-theophany-muted' : 'text-sanctuary-muted'
            }`}
          >
            Recent activity
          </p>
          <p className={`mt-0.5 font-sans text-[11px] ${isTheophany ? 'text-theophany-text/90' : 'text-sanctuary-text/90'}`}>
            Anonymous · Hyperlocal · No profiles
          </p>
        </div>
      </div>

      {trendingPlaces.length > 0 && (
        <div className="mb-3">
          <p
            className={`mb-1.5 font-sans text-[9px] uppercase tracking-widest ${
              isTheophany ? 'text-theophany-muted' : 'text-sanctuary-muted'
            }`}
          >
            Trending
          </p>
          <div className="flex flex-wrap gap-2">
            {trendingPlaces.slice(0, 5).map((p) => (
              <Link key={p.id} to={`/place/${p.id}`} className={pill(false)}>
                {p.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      <p
        className={`mb-1.5 font-sans text-[9px] uppercase tracking-widest ${
          isTheophany ? 'text-theophany-muted' : 'text-sanctuary-muted'
        }`}
      >
        Latest
      </p>
      <div className="-mx-1 flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {stream.length === 0 ? (
          <span
            className={`whitespace-nowrap rounded-lg border px-3 py-2 font-sans text-[11px] ${
              isTheophany
                ? 'border-theophany-muted/40 text-theophany-muted'
                : 'border-sanctuary-muted/40 text-sanctuary-muted'
            }`}
          >
            No activity yet — add a place or leave a tip.
          </span>
        ) : (
          stream.map((item) => {
            if (item.kind === 'new_place') {
              const p = item.place
              return (
                <Link
                  key={item.key}
                  to={`/place/${p.id}`}
                  className={`min-w-[200px] max-w-[240px] shrink-0 rounded-lg border p-2.5 ${
                    isTheophany
                      ? 'border-theophany-muted/35 bg-black/30'
                      : 'border-sanctuary-muted/30 bg-white/60'
                  }`}
                >
                  <span className="font-sans text-[8px] uppercase tracking-widest text-emerald-400/90">New place</span>
                  <p className={`mt-1 font-display text-sm leading-tight ${isTheophany ? 'text-theophany-text' : 'text-sanctuary-text'}`}>
                    {p.name}
                  </p>
                  <p className={`mt-0.5 font-sans text-[9px] ${isTheophany ? 'text-theophany-muted' : 'text-sanctuary-muted'}`}>
                    {p.city}, {p.state}
                  </p>
                </Link>
              )
            }
            const pl = item.place
            if (!pl?.id) return null
            const label = item.kind === 'tip' ? 'Tip' : 'Review'
            return (
              <Link
                key={item.key}
                to={`/place/${pl.id}`}
                className={`min-w-[200px] max-w-[260px] shrink-0 rounded-lg border p-2.5 ${
                  isTheophany
                    ? 'border-theophany-muted/35 bg-black/30'
                    : 'border-sanctuary-muted/30 bg-white/60'
                }`}
              >
                <span
                  className={`font-sans text-[8px] uppercase tracking-widest ${
                    item.kind === 'tip' ? 'text-amber-300/90' : 'text-sky-300/90'
                  }`}
                >
                  {label}
                </span>
                <p className={`mt-1 font-serif text-[12px] italic leading-snug ${isTheophany ? 'text-theophany-text' : 'text-sanctuary-text'}`}>
                  {snippet(item.report.content, 90)}
                </p>
                <p className={`mt-1 font-sans text-[9px] ${isTheophany ? 'text-theophany-muted' : 'text-sanctuary-muted'}`}>
                  {pl.name}
                </p>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
