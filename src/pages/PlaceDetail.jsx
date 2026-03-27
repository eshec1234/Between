import { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase, getOrCreateSession, hasSupabaseEnv } from '../lib/supabase'
import TheophanyDisclaimer from '../components/TheophanyDisclaimer'
import SourceBadge from '../components/SourceBadge'

const REFLECTION_TAGS = [
  'Helped me slow down',
  'Felt intense',
  'Made me reflect',
  'Not what I expected'
]

const TIP_MAX = 280
const REVIEW_MAX = 1000

function formatTime(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

export default function PlaceDetail() {
  const { id } = useParams()
  const [place, setPlace] = useState(null)
  const [experienceReports, setExperienceReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [reportContent, setReportContent] = useState('')
  const [contentKind, setContentKind] = useState('review')
  const [stillness, setStillness] = useState(3)
  const [selectedTag, setSelectedTag] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [postFlash, setPostFlash] = useState('')
  const [flagDone, setFlagDone] = useState(false)
  const [flagBusy, setFlagBusy] = useState(false)
  const textareaRef = useRef(null)

  const isTheophany = place?.mode === 'theophany' || place?.mode === 'both'
  const isSanctuary = place?.mode === 'sanctuary' || place?.mode === 'both'

  useEffect(() => {
    fetchPlace()
    fetchExperienceReports()
  }, [id])

  const fetchPlace = async () => {
    if (!hasSupabaseEnv || !supabase) {
      setPlace(null)
      setLoading(false)
      return
    }
    const { data } = await supabase.from('places').select('*').eq('id', id).single()
    setPlace(data)
    setLoading(false)
  }

  const fetchExperienceReports = async () => {
    if (!hasSupabaseEnv || !supabase) {
      setExperienceReports([])
      return
    }
    const { data } = await supabase
      .from('experience_reports')
      .select('*')
      .eq('place_id', id)
      .order('created_at', { ascending: false })
      .limit(40)
    setExperienceReports(data || [])
  }

  const avgStillness = useMemo(() => {
    const vals = experienceReports
      .filter((r) => r.stillness_rating != null && (r.content_kind || 'review') === 'review')
      .map((r) => r.stillness_rating)
    if (!vals.length) return null
    return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
  }, [experienceReports])

  const tips = useMemo(
    () => experienceReports.filter((r) => (r.content_kind || 'review') === 'tip'),
    [experienceReports]
  )
  const reviews = useMemo(
    () => experienceReports.filter((r) => (r.content_kind || 'review') !== 'tip'),
    [experienceReports]
  )

  const submitExperienceReport = async (e) => {
    e.preventDefault()
    if (!reportContent.trim()) return
    if (!hasSupabaseEnv || !supabase) return

    const maxLen = contentKind === 'tip' ? TIP_MAX : REVIEW_MAX
    const trimmed = reportContent.trim().slice(0, maxLen)

    setSubmitting(true)
    const sessionId = getOrCreateSession()

    const base = {
      place_id: id,
      session_id: sessionId,
      content: trimmed,
      reflection_tag: contentKind === 'review' ? selectedTag || null : null
    }

    const extended = {
      ...base,
      content_kind: contentKind,
      stillness_rating:
        contentKind === 'review' && (place.mode === 'sanctuary' || place.mode === 'both') ? stillness : null
    }

    let { error } = await supabase.from('experience_reports').insert(extended)

    if (error) {
      const { error: err2 } = await supabase.from('experience_reports').insert(base)
      error = err2
    }

    if (!error) {
      setPostFlash(contentKind === 'tip' ? 'Tip posted.' : 'Review posted.')
      setTimeout(() => setPostFlash(''), 4000)
      setReportContent('')
      setSelectedTag('')
      setContentKind('review')
      fetchExperienceReports()
    }
    setSubmitting(false)
  }

  const reportPlaceForReview = async () => {
    if (!hasSupabaseEnv || !supabase) return
    if (!window.confirm('Flag this place for moderator review? It stays visible until reviewed.')) return
    setFlagBusy(true)
    const { error } = await supabase.rpc('report_place_flag', { p_place_id: id })
    setFlagBusy(false)
    if (!error) setFlagDone(true)
  }

  const focusComposer = () => {
    textareaRef.current?.focus()
  }

  if (loading) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center bg-sanctuary-bg">
        <p className="font-serif italic text-sanctuary-muted">Loading...</p>
      </div>
    )
  }

  if (!place) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center bg-sanctuary-bg">
        <div className="space-y-3 text-center">
          <p className="font-serif text-sanctuary-text">Place not found.</p>
          <Link to="/" className="font-sans text-xs uppercase tracking-wider text-sanctuary-accent">
            ← Back
          </Link>
        </div>
      </div>
    )
  }

  const bgClass = isTheophany ? 'bg-theophany-bg text-theophany-text' : 'bg-sanctuary-bg text-sanctuary-text'
  const borderClass = isTheophany ? 'border-theophany-accent/45' : 'border-sanctuary-accent/45'
  const accentClass = isTheophany ? 'text-theophany-accent' : 'text-sanctuary-accent'
  const bodyClass = isTheophany ? 'text-theophany-text' : 'text-sanctuary-text'
  const subClass = isTheophany ? 'text-theophany-muted' : 'text-sanctuary-muted'
  const maxLen = contentKind === 'tip' ? TIP_MAX : REVIEW_MAX

  return (
    <div className={`min-h-0 flex-1 overflow-y-auto ${bgClass}`}>
      <div className="p-4 pt-6">
        <Link to="/" className={`font-sans text-xs font-medium uppercase tracking-wider ${accentClass} hover:underline`}>
          ← Back
        </Link>
      </div>

      {place.photos?.[0] && (
        <div className="relative w-full">
          <div className="h-52 w-full sm:h-64">
            <img src={place.photos[0]} alt="" className="h-full w-full object-cover" />
          </div>
          {place.photos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto px-4 py-2">
              {place.photos.slice(1).map((url) => (
                <img key={url} src={url} alt="" className="h-20 w-28 shrink-0 rounded object-cover" />
              ))}
            </div>
          )}
        </div>
      )}

      <div className={`space-y-4 p-6 ${bodyClass}`}>
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span
              className={`rounded border px-2 py-0.5 font-sans text-xs font-medium uppercase tracking-wider ${borderClass} ${accentClass}`}
            >
              {place.mode}
            </span>
            <SourceBadge source={place.source} />
          </div>
          <h1 className="mt-2 font-serif text-2xl font-medium tracking-tight text-current">{place.name}</h1>
          <p className={`mt-1 font-sans text-xs uppercase tracking-wider ${subClass}`}>
            {place.address} · {place.city}, {place.state}
          </p>
        </div>

        {avgStillness != null && (place.mode === 'sanctuary' || place.mode === 'both') && (
          <div
            className={`rounded-md border-2 px-3 py-2 font-sans text-sm ${borderClass} ${
              isTheophany ? 'bg-white/[0.06]' : 'bg-black/[0.04]'
            }`}
          >
            <span className={`font-semibold ${subClass}`}>Avg. stillness (visitors):</span>{' '}
            <span className="text-current">{avgStillness}</span>
            <span className={subClass}> / 5</span>
          </div>
        )}

        <p className="font-serif text-base italic leading-relaxed text-current">{place.description}</p>

        {isTheophany && <TheophanyDisclaimer />}

        {(place.traditions || place.cultural_sensitivities || place.access_protocols) && (
          <div
            className={`space-y-2 rounded-md border-2 p-4 ${borderClass} ${
              isTheophany ? 'bg-white/[0.06]' : 'bg-black/[0.04]'
            }`}
          >
            <h3 className={`font-sans text-xs font-semibold uppercase tracking-wider ${subClass}`}>Cultural Context</h3>
            {place.traditions && (
              <p className="font-sans text-sm leading-relaxed text-current">
                <span className={`font-medium ${subClass}`}>Traditions:</span> {place.traditions}
              </p>
            )}
            {place.cultural_sensitivities && (
              <p className="font-sans text-sm leading-relaxed text-current">
                <span className={`font-medium ${subClass}`}>Sensitivities:</span> {place.cultural_sensitivities}
              </p>
            )}
            {place.access_protocols && (
              <p className="font-sans text-sm leading-relaxed text-current">
                <span className={`font-medium ${subClass}`}>Access:</span> {place.access_protocols}
              </p>
            )}
          </div>
        )}

        {place.category_tags?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {place.category_tags.map((tag) => (
              <span
                key={tag}
                className={`rounded border px-2 py-1 font-sans text-xs font-medium uppercase tracking-wider ${borderClass} ${subClass}`}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {(place.intensity != null || place.approach_tags?.length > 0) && (
          <div
            className={`space-y-2 rounded-md border-2 p-4 ${borderClass} ${
              isTheophany ? 'bg-white/[0.06]' : 'bg-black/[0.04]'
            }`}
          >
            <h3 className={`font-sans text-xs font-semibold uppercase tracking-wider ${subClass}`}>Vibe</h3>
            {place.intensity != null && (
              <p className="font-sans text-sm text-current">
                <span className={`font-medium ${subClass}`}>Intensity:</span>{' '}
                {'●'.repeat(place.intensity)}
                {'○'.repeat(5 - place.intensity)}
              </p>
            )}
            {place.approach_tags?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {place.approach_tags.map((tag) => (
                  <span
                    key={tag}
                    className={`rounded border px-2 py-1 font-sans text-xs font-medium uppercase tracking-wider ${borderClass} ${subClass}`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {place.source === 'community' && (
          <p className={`font-sans text-xs leading-relaxed ${subClass}`}>
            Community listings are reviewed asynchronously. Moderators may hide or edit entries that break site guidelines.
          </p>
        )}

        <div className="pt-2">
          <button
            type="button"
            onClick={reportPlaceForReview}
            disabled={flagBusy || flagDone}
            className={`rounded-md border-2 px-4 py-2 font-sans text-xs font-medium uppercase tracking-wider transition-colors disabled:opacity-40 ${
              isTheophany
                ? 'border-theophany-accent text-theophany-accent hover:bg-theophany-accent/15'
                : 'border-sanctuary-accent text-sanctuary-accent hover:bg-sanctuary-accent/15'
            }`}
          >
            {flagDone ? 'Thanks — flagged for review' : flagBusy ? 'Sending…' : 'Flag for moderator review'}
          </button>
        </div>
      </div>

      <div className={`space-y-6 border-t-2 p-6 ${borderClass} ${bodyClass}`}>
        <div>
          <h2 className="font-serif text-lg font-medium text-current">Reviews & tips</h2>
          <p className={`mt-1 font-sans text-[11px] ${subClass}`}>Anonymous · No names · Timestamped</p>
        </div>

        {postFlash && (
          <p className={`rounded-md border px-3 py-2 font-serif text-sm italic ${borderClass} ${accentClass}`}>{postFlash}</p>
        )}
        <form onSubmit={submitExperienceReport} className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setContentKind('tip')
                  setSelectedTag('')
                  focusComposer()
                }}
                className={`rounded-full border-2 px-4 py-1.5 font-sans text-[10px] font-semibold uppercase tracking-wider ${
                  contentKind === 'tip'
                    ? isTheophany
                      ? 'border-theophany-accent bg-theophany-accent/20 text-theophany-text'
                      : 'border-sanctuary-accent bg-sanctuary-accent/15 text-sanctuary-text'
                    : `${borderClass} ${subClass}`
                }`}
              >
                Quick tip
              </button>
              <button
                type="button"
                onClick={() => {
                  setContentKind('review')
                  focusComposer()
                }}
                className={`rounded-full border-2 px-4 py-1.5 font-sans text-[10px] font-semibold uppercase tracking-wider ${
                  contentKind === 'review'
                    ? isTheophany
                      ? 'border-theophany-accent bg-theophany-accent/20 text-theophany-text'
                      : 'border-sanctuary-accent bg-sanctuary-accent/15 text-sanctuary-text'
                    : `${borderClass} ${subClass}`
                }`}
              >
                Review
              </button>
            </div>

            <textarea
              ref={textareaRef}
              value={reportContent}
              onChange={(e) => setReportContent(e.target.value)}
              placeholder={contentKind === 'tip' ? 'Short visitor tip (parking, best time, etc.)…' : 'What did you notice here?'}
              rows={contentKind === 'tip' ? 3 : 5}
              className={`w-full resize-none rounded-md border-2 p-3 font-serif text-sm focus:outline-none focus:ring-2 ${
                isTheophany
                  ? 'border-theophany-accent/50 bg-theophany-primary/80 text-theophany-text placeholder:text-theophany-muted focus:ring-theophany-accent'
                  : 'border-sanctuary-accent/50 bg-white text-sanctuary-text placeholder:text-sanctuary-muted focus:ring-sanctuary-accent'
              }`}
              maxLength={maxLen}
            />
            <p className={`text-right font-sans text-[10px] ${subClass}`}>
              {reportContent.length}/{maxLen}
            </p>

            {contentKind === 'review' && (place.mode === 'sanctuary' || place.mode === 'both') && (
              <div>
                <p className={`mb-2 font-sans text-[10px] uppercase tracking-wider ${subClass}`}>Stillness (optional)</p>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setStillness(n)}
                      className={`h-9 w-9 rounded-full border-2 font-sans text-sm ${
                        stillness === n
                          ? isTheophany
                            ? 'border-theophany-accent bg-theophany-accent text-theophany-bg'
                            : 'border-sanctuary-accent bg-sanctuary-accent text-sanctuary-bg'
                          : `${borderClass} ${subClass}`
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {contentKind === 'review' && (
              <div className="flex flex-wrap gap-2">
                {REFLECTION_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
                    className={`rounded-md border-2 px-3 py-1 font-sans text-xs font-medium uppercase tracking-wider transition-colors ${
                      selectedTag === tag
                        ? isTheophany
                          ? 'border-theophany-accent bg-theophany-accent text-theophany-bg'
                          : 'border-sanctuary-accent bg-sanctuary-accent text-sanctuary-bg'
                        : `${borderClass} ${subClass} hover:opacity-90`
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !reportContent.trim()}
              className={`w-full rounded-md border-2 py-2.5 font-sans text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-40 sm:w-auto sm:px-8 ${
                isTheophany
                  ? 'border-theophany-accent text-theophany-accent hover:bg-theophany-accent hover:text-theophany-bg'
                  : 'border-sanctuary-accent text-sanctuary-accent hover:bg-sanctuary-accent hover:text-sanctuary-bg'
              }`}
            >
              {submitting ? 'Posting…' : contentKind === 'tip' ? 'Post tip' : 'Post review'}
            </button>
          </form>

        {tips.length > 0 && (
          <div>
            <h3 className={`mb-2 font-sans text-[10px] uppercase tracking-widest ${subClass}`}>Tips</h3>
            <ul className="space-y-3">
              {tips.map((report) => (
                <li key={report.id} className={`border-l-4 pl-3 ${isTheophany ? 'border-amber-400/50' : 'border-amber-600/60'}`}>
                  <p className="font-serif text-sm leading-relaxed text-current">{report.content}</p>
                  <p className={`mt-1 font-sans text-[10px] ${subClass}`}>{formatTime(report.created_at)}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <h3 className={`mb-2 font-sans text-[10px] uppercase tracking-widest ${subClass}`}>Reviews</h3>
          {reviews.length === 0 ? (
            <p className={`font-serif text-sm italic ${subClass}`}>No reviews yet.</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((report) => (
                <div
                  key={report.id}
                  className={`border-l-4 pl-4 ${isTheophany ? 'border-theophany-accent/60' : 'border-sanctuary-accent/70'}`}
                >
                  <p className="font-serif text-sm italic leading-relaxed text-current">{report.content}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {report.reflection_tag && (
                      <span className={`font-sans text-[10px] font-medium uppercase tracking-wider ${accentClass}`}>
                        {report.reflection_tag}
                      </span>
                    )}
                    {report.stillness_rating != null && (
                      <span className={`font-sans text-[10px] ${subClass}`}>Stillness {report.stillness_rating}/5</span>
                    )}
                    <span className={`font-sans text-[10px] ${subClass}`}>{formatTime(report.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
