import { Link } from 'react-router-dom'
import { mergeActivityStream } from '../lib/feed'
import { photoForPlaceAtTime } from '../lib/placePhotoFallback'

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
  loading,
  trendingSectionTitle = 'Gathering light'
}) {
  const stream = mergeActivityStream(recentPlaces, recentReports, 14)

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
            {trendingSectionTitle}
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {trendingPlaces.slice(0, 5).map((p) => {
              const { url: timg } = photoForPlaceAtTime(p)
              return (
                <Link
                  key={p.id}
                  to={`/place/${p.id}`}
                  className={`flex min-w-[168px] max-w-[200px] shrink-0 overflow-hidden rounded-lg border ${
                    isTheophany ? 'border-theophany-muted/35 bg-black/30' : 'border-sanctuary-muted/30 bg-white/60'
                  }`}
                >
                  <div
                    className={`relative h-14 w-14 shrink-0 overflow-hidden ${
                      isTheophany ? 'bg-[#0c0618]' : 'bg-[#f5ead5]'
                    }`}
                  >
                    {timg ? (
                      <img
                        src={timg}
                        alt=""
                        className={`h-full w-full object-cover ${
                          isTheophany ? 'brightness-[0.5] saturate-[0.2]' : 'brightness-105 saturate-70'
                        }`}
                      />
                    ) : (
                      <div
                        className={`h-full w-full ${isTheophany ? 'bg-gradient-to-b from-[#140a22] to-[#060210]' : 'bg-gradient-to-b from-[#e8dcc8] to-[#d4c4a8]'}`}
                      />
                    )}
                  </div>
                  <span
                    className={`line-clamp-2 min-w-0 flex-1 self-center px-2 py-1.5 font-display text-[11px] leading-tight ${
                      isTheophany ? 'text-theophany-text' : 'text-sanctuary-text'
                    }`}
                  >
                    {p.name}
                  </span>
                </Link>
              )
            })}
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
              const { url: hero } = photoForPlaceAtTime(p)
              return (
                <Link
                  key={item.key}
                  to={`/place/${p.id}`}
                  className={`min-w-[200px] max-w-[240px] shrink-0 overflow-hidden rounded-lg border ${
                    isTheophany
                      ? 'border-theophany-muted/35 bg-black/30'
                      : 'border-sanctuary-muted/30 bg-white/60'
                  }`}
                >
                  <div
                    className={`relative aspect-[4/3] w-full overflow-hidden ${
                      isTheophany ? 'bg-[#0c0618]' : 'bg-[#f5ead5]'
                    }`}
                  >
                    {hero ? (
                      <img
                        src={hero}
                        alt=""
                        className={`h-full w-full object-cover ${
                          isTheophany ? 'brightness-[0.48] saturate-[0.18]' : 'brightness-105 saturate-70'
                        }`}
                      />
                    ) : (
                      <div
                        className={`h-full w-full ${isTheophany ? 'bg-gradient-to-b from-[#140a22] to-[#060210]' : 'bg-gradient-to-b from-[#e8dcc8] to-[#d4c4a8]'}`}
                      />
                    )}
                  </div>
                  <div className="p-2.5">
                    <span className="font-sans text-[8px] uppercase tracking-widest text-emerald-400/90">New place</span>
                    <p className={`mt-1 font-display text-sm leading-tight ${isTheophany ? 'text-theophany-text' : 'text-sanctuary-text'}`}>
                      {p.name}
                    </p>
                    <p className={`mt-0.5 font-sans text-[9px] ${isTheophany ? 'text-theophany-muted' : 'text-sanctuary-muted'}`}>
                      {p.city}, {p.state}
                    </p>
                  </div>
                </Link>
              )
            }
            const pl = item.place
            if (!pl?.id) return null
            const label = item.kind === 'tip' ? 'Tip' : 'Review'
            const { url: rimg } = photoForPlaceAtTime(pl)
            return (
              <Link
                key={item.key}
                to={`/place/${pl.id}`}
                className={`min-w-[200px] max-w-[260px] shrink-0 overflow-hidden rounded-lg border ${
                  isTheophany
                    ? 'border-theophany-muted/35 bg-black/30'
                    : 'border-sanctuary-muted/30 bg-white/60'
                }`}
              >
                <div
                  className={`relative aspect-[4/3] w-full overflow-hidden ${
                    isTheophany ? 'bg-[#0c0618]' : 'bg-[#f5ead5]'
                  }`}
                >
                  {rimg ? (
                    <img
                      src={rimg}
                      alt=""
                      className={`h-full w-full object-cover ${
                        isTheophany ? 'brightness-[0.48] saturate-[0.18]' : 'brightness-105 saturate-70'
                      }`}
                    />
                  ) : (
                    <div
                      className={`h-full w-full ${isTheophany ? 'bg-gradient-to-b from-[#140a22] to-[#060210]' : 'bg-gradient-to-b from-[#e8dcc8] to-[#d4c4a8]'}`}
                    />
                  )}
                </div>
                <div className="p-2.5">
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
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
