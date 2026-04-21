import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { MINI_ROUTES, resolveRoutePlaces } from '../data/miniRoutes'
import { getWeeklyPrompt } from '../data/weeklyPrompts'
import { INTENTIONS, placeMatchesIntention } from '../data/intentions'
import {
  markDailyVisit,
  getStreakInfo,
  setIntention,
  distanceKm,
  coordsFromPlace,
  getVisitedIds
} from '../lib/betweenLocal'

export default function EngagementHub({
  places,
  center,
  isTheophany,
  subClass,
  accentClass,
  borderClass,
  intent,
  onIntentChange
}) {
  const [streak, setStreak] = useState(() => getStreakInfo())
  const [weekly] = useState(() => getWeeklyPrompt())

  const onMarkToday = () => {
    setStreak(markDailyVisit())
  }

  const onIntent = (id) => {
    const next = intent === id ? '' : id
    setIntention(next)
    onIntentChange(next)
  }

  const nearest = useMemo(() => {
    if (!places?.length || center == null) return null
    const visited = getVisitedIds()
    let best = null
    let bestD = Infinity
    for (const p of places) {
      if (visited.has(p.id)) continue
      const c = coordsFromPlace(p)
      if (!c) continue
      const d = distanceKm(center.lat, center.lng, c.lat, c.lng)
      if (d < bestD) {
        bestD = d
        best = p
      }
    }
    return best ? { place: best, km: bestD } : null
  }, [places, center])

  const routesResolved = useMemo(
    () =>
      MINI_ROUTES.map((r) => ({
        route: r,
        resolved: resolveRoutePlaces(r, places)
      })).filter((x) => x.resolved.length >= 2),
    [places]
  )

  return (
    <div className="space-y-4 px-4">
      <div
        className={`rounded-xl border-2 px-4 py-3 ${
          isTheophany ? 'border-theophany-accent/35 bg-black/25' : 'border-sanctuary-accent/30 bg-white/[0.06]'
        }`}
      >
        <p className={`font-sans text-[8px] uppercase tracking-[0.35em] ${subClass}`}>Today</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onMarkToday}
            className={`min-h-[44px] rounded-full border px-4 py-2 font-sans text-[10px] font-semibold uppercase tracking-wider transition-colors ${
              streak.markedToday
                ? isTheophany
                  ? 'border-theophany-accent/50 text-theophany-muted'
                  : 'border-sanctuary-accent/40 text-sanctuary-muted'
                : isTheophany
                  ? 'border-theophany-accent text-theophany-accent hover:bg-theophany-accent/15'
                  : 'border-sanctuary-accent text-sanctuary-accent hover:bg-sanctuary-accent/10'
            }`}
          >
            {streak.markedToday ? 'Visit marked' : 'Mark today’s visit'}
          </button>
          <span className={`font-sans text-[11px] ${subClass}`}>
            Streak: <span className={accentClass}>{streak.streakDays}</span> day{streak.streakDays === 1 ? '' : 's'}
          </span>
        </div>
        <p className={`mt-3 font-serif text-sm italic leading-relaxed ${isTheophany ? 'text-violet-200/75' : 'text-sanctuary-text'}`}>
          {weekly}
        </p>
      </div>

      {nearest && (
        <div
          className={`rounded-lg border px-3 py-2.5 ${
            isTheophany ? 'border-[#0a2828] bg-black/30' : 'border-sanctuary-accent/25 bg-white/[0.04]'
          }`}
        >
          <p className={`font-sans text-[8px] uppercase tracking-[0.3em] ${subClass}`}>Near you</p>
          <p className={`mt-1 font-sans text-[11px] ${subClass}`}>
            ~{nearest.km < 10 ? nearest.km.toFixed(1) : Math.round(nearest.km)} km — a place you haven’t opened yet
          </p>
          <Link to={`/place/${nearest.place.id}`} className={`mt-1 inline-block font-display text-sm tracking-wide ${accentClass} hover:underline`}>
            {nearest.place.name}
          </Link>
        </div>
      )}

      <div>
        <p className={`font-sans text-[8px] uppercase tracking-[0.35em] ${subClass}`}>Intention</p>
        <p className={`mt-1 font-sans text-[10px] ${subClass}`}>
          Filters by place type — tap again to clear.{' '}
          {intent && (
            <span className={accentClass}>
              {places.filter((p) => placeMatchesIntention(p, intent)).length} matching
            </span>
          )}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {INTENTIONS.map((it) => {
            const count = places.filter((p) => placeMatchesIntention(p, it.id)).length
            return (
              <button
                key={it.id}
                type="button"
                onClick={() => onIntent(it.id)}
                className={`min-h-[44px] rounded-full border px-3 py-2 font-sans text-[10px] font-medium uppercase tracking-wider ${
                  intent === it.id
                    ? isTheophany
                      ? 'border-theophany-accent bg-theophany-accent/20 text-theophany-text'
                      : 'border-sanctuary-accent bg-sanctuary-accent/15 text-sanctuary-text'
                    : `${borderClass} ${subClass} hover:opacity-90`
                }`}
              >
                {it.label}
                {count > 0 && (
                  <span className={`ml-1.5 text-[8px] opacity-60`}>{count}</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {routesResolved.length > 0 && (
        <div>
          <p className={`font-sans text-[8px] uppercase tracking-[0.35em] ${subClass}`}>Mini-routes</p>
          <p className={`mt-1 font-sans text-[10px] ${subClass}`}>Three places, one afternoon — open in order if you like</p>
          <ul className="mt-3 space-y-3">
            {routesResolved.map(({ route, resolved }) => (
              <li
                key={route.id}
                className={`rounded-lg border px-3 py-2.5 ${
                  isTheophany ? 'border-violet-950/45 bg-black/22' : 'border-sanctuary-accent/20 bg-black/[0.03]'
                }`}
              >
                <p className={`font-display text-sm tracking-wide ${accentClass}`}>{route.title}</p>
                <p className={`mt-0.5 font-sans text-[11px] leading-snug ${subClass}`}>{route.description}</p>
                <ol className="mt-2 list-decimal space-y-1 pl-5 font-sans text-[11px]">
                  {resolved.map((p) => (
                    <li key={p.id}>
                      <Link to={`/place/${p.id}`} className={`${accentClass} hover:underline`}>
                        {p.name}
                      </Link>
                      <span className={subClass}> · {p.city}</span>
                    </li>
                  ))}
                </ol>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
