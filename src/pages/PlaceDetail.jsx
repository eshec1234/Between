import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase, getOrCreateSession, hasSupabaseEnv } from '../lib/supabase'
import TheophanyDisclaimer from '../components/TheophanyDisclaimer'

const REFLECTION_TAGS = [
  'Helped me slow down',
  'Felt intense',
  'Made me reflect',
  'Not what I expected'
]

export default function PlaceDetail() {
  const { id } = useParams()
  const [place, setPlace] = useState(null)
  const [experienceReports, setExperienceReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [reportContent, setReportContent] = useState('')
  const [selectedTag, setSelectedTag] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [flagDone, setFlagDone] = useState(false)
  const [flagBusy, setFlagBusy] = useState(false)

  const isTheophany = place?.mode === 'theophany' || place?.mode === 'both'

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
      .limit(20)
    setExperienceReports(data || [])
  }

  const submitExperienceReport = async (e) => {
    e.preventDefault()
    if (!reportContent.trim()) return
    if (!hasSupabaseEnv || !supabase) return

    setSubmitting(true)
    const sessionId = getOrCreateSession()

    const { error } = await supabase.from('experience_reports').insert({
      place_id: id,
      session_id: sessionId,
      content: reportContent.trim(),
      reflection_tag: selectedTag || null
    })

    if (!error) {
      setSubmitted(true)
      setReportContent('')
      setSelectedTag('')
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
          <Link to="/" className="font-sans text-xs uppercase tracking-wider text-sanctuary-accent">← Back</Link>
        </div>
      </div>
    )
  }

  const bgClass = isTheophany ? 'bg-theophany-bg text-theophany-text' : 'bg-sanctuary-bg text-sanctuary-text'
  const borderClass = isTheophany ? 'border-theophany-accent/45' : 'border-sanctuary-accent/45'
  const accentClass = isTheophany ? 'text-theophany-accent' : 'text-sanctuary-accent'
  const bodyClass = isTheophany ? 'text-theophany-text' : 'text-sanctuary-text'
  const subClass = isTheophany ? 'text-theophany-muted' : 'text-sanctuary-muted'

  return (
    <div className={`min-h-0 flex-1 overflow-y-auto ${bgClass}`}>
      {/* Back nav */}
      <div className="p-4 pt-6">
        <Link to="/" className={`font-sans text-xs font-medium uppercase tracking-wider ${accentClass} hover:underline`}>
          ← Back
        </Link>
      </div>

      {/* Photo */}
      {place.photos?.[0] && (
        <div className="h-48 w-full">
          <img src={place.photos[0]} alt={place.name} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Place info */}
      <div className={`p-6 space-y-4 ${bodyClass}`}>
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className={`rounded border px-2 py-0.5 font-sans text-xs font-medium uppercase tracking-wider ${borderClass} ${accentClass}`}>
              {place.mode}
            </span>
            <span className={`font-sans text-xs uppercase tracking-wider ${subClass}`}>
              {place.source}
            </span>
          </div>
          <h1 className="mt-2 font-serif text-2xl font-medium tracking-tight text-current">{place.name}</h1>
          <p className={`mt-1 font-sans text-xs uppercase tracking-wider ${subClass}`}>
            {place.address} · {place.city}, {place.state}
          </p>
        </div>

        <p className="font-serif text-base italic leading-relaxed text-current">{place.description}</p>

        {/* Tier 1 Feature #7: Theophany disclaimer */}
        {isTheophany && <TheophanyDisclaimer />}

        {/* Tier 1 Feature #8: Tradition + Sensitivity fields */}
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

        {/* Category tags */}
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

        {/* Tier 2 */}
        {(place.intensity != null || place.approach_tags?.length > 0) && (
          <div
            className={`space-y-2 rounded-md border-2 p-4 ${borderClass} ${
              isTheophany ? 'bg-white/[0.06]' : 'bg-black/[0.04]'
            }`}
          >
            <h3 className={`font-sans text-xs font-semibold uppercase tracking-wider ${subClass}`}>Detail</h3>
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

      {/* Experience Reports section */}
      <div className={`space-y-6 border-t-2 p-6 ${borderClass} ${bodyClass}`}>
        <h2 className="font-serif text-lg font-medium text-current">Experience Reports</h2>

        {/* Submit form */}
        {submitted ? (
          <p className={`font-serif text-sm italic ${subClass}`}>Your experience report has been submitted.</p>
        ) : (
          <form onSubmit={submitExperienceReport} className="space-y-3">
            <textarea
              value={reportContent}
              onChange={(e) => setReportContent(e.target.value)}
              placeholder="Describe what you felt or noticed here..."
              rows={4}
              className={`w-full resize-none rounded-md border-2 p-3 font-serif text-sm focus:outline-none focus:ring-2 ${
                isTheophany
                  ? 'border-theophany-accent/50 bg-theophany-primary/80 text-theophany-text placeholder:text-theophany-muted focus:ring-theophany-accent'
                  : 'border-sanctuary-accent/50 bg-white text-sanctuary-text placeholder:text-sanctuary-muted focus:ring-sanctuary-accent'
              }`}
              maxLength={1000}
            />

            {/* Reflection tags */}
            <div className="flex flex-wrap gap-2">
              {REFLECTION_TAGS.map(tag => (
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

            <button
              type="submit"
              disabled={submitting || !reportContent.trim()}
              className={`rounded-md border-2 px-6 py-2 font-sans text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-40 ${
                isTheophany
                  ? 'border-theophany-accent text-theophany-accent hover:bg-theophany-accent hover:text-theophany-bg'
                  : 'border-sanctuary-accent text-sanctuary-accent hover:bg-sanctuary-accent hover:text-sanctuary-bg'
              }`}
            >
              {submitting ? 'Submitting...' : 'Submit Experience Report'}
            </button>
          </form>
        )}

        {/* Existing reports */}
        <div className="space-y-4">
          {experienceReports.length === 0 ? (
            <p className={`font-serif text-sm italic ${subClass}`}>No experience reports yet.</p>
          ) : (
            experienceReports.map((report) => (
              <div
                key={report.id}
                className={`border-l-4 pl-4 ${isTheophany ? 'border-theophany-accent/60' : 'border-sanctuary-accent/70'}`}
              >
                <p className="font-serif text-sm italic leading-relaxed text-current">{report.content}</p>
                {report.reflection_tag && (
                  <p className={`mt-2 font-sans text-xs font-medium uppercase tracking-wider ${accentClass}`}>
                    {report.reflection_tag}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
