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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sanctuary-bg">
        <p className="font-serif italic text-sanctuary-muted">Loading...</p>
      </div>
    )
  }

  if (!place) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sanctuary-bg">
        <div className="text-center space-y-3">
          <p className="font-serif text-sanctuary-text">Place not found.</p>
          <Link to="/" className="font-sans text-xs uppercase tracking-wider text-sanctuary-accent">← Back</Link>
        </div>
      </div>
    )
  }

  const bgClass = isTheophany ? 'bg-theophany-bg text-theophany-text' : 'bg-sanctuary-bg text-sanctuary-text'
  const borderClass = isTheophany ? 'border-theophany-muted/40' : 'border-sanctuary-accent/20'
  const accentClass = isTheophany ? 'text-theophany-accent' : 'text-sanctuary-accent'

  return (
    <div className={`min-h-screen ${bgClass}`}>
      {/* Back nav */}
      <div className="p-4 pt-6">
        <Link to="/" className={`font-sans text-xs uppercase tracking-wider ${accentClass}`}>
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
      <div className="p-6 space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`font-sans text-xs uppercase tracking-wider px-2 py-0.5 border ${borderClass} ${accentClass}`}>
              {place.mode}
            </span>
            <span className="font-sans text-xs uppercase tracking-wider opacity-50">
              {place.source}
            </span>
          </div>
          <h1 className="font-serif text-2xl mt-2">{place.name}</h1>
          <p className={`font-sans text-xs uppercase tracking-wider mt-1 opacity-60`}>
            {place.address} · {place.city}, {place.state}
          </p>
        </div>

        <p className="font-serif italic leading-relaxed opacity-90">{place.description}</p>

        {/* Tier 1 Feature #7: Theophany disclaimer */}
        {isTheophany && <TheophanyDisclaimer />}

        {/* Tier 1 Feature #8: Tradition + Sensitivity fields */}
        {(place.traditions || place.cultural_sensitivities || place.access_protocols) && (
          <div className={`border rounded p-4 space-y-2 ${borderClass}`}>
            <h3 className="font-sans text-xs uppercase tracking-wider opacity-60">Cultural Context</h3>
            {place.traditions && (
              <p className="font-sans text-sm"><span className="opacity-50">Traditions:</span> {place.traditions}</p>
            )}
            {place.cultural_sensitivities && (
              <p className="font-sans text-sm"><span className="opacity-50">Sensitivities:</span> {place.cultural_sensitivities}</p>
            )}
            {place.access_protocols && (
              <p className="font-sans text-sm"><span className="opacity-50">Access:</span> {place.access_protocols}</p>
            )}
          </div>
        )}

        {/* Category tags */}
        {place.category_tags?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {place.category_tags.map(tag => (
              <span key={tag} className={`font-sans text-xs uppercase tracking-wider px-2 py-1 border rounded ${borderClass} opacity-60`}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Experience Reports section */}
      <div className={`border-t ${borderClass} p-6 space-y-6`}>
        <h2 className="font-serif text-lg">Experience Reports</h2>

        {/* Submit form */}
        {submitted ? (
          <p className="font-serif italic opacity-60 text-sm">Your experience report has been submitted.</p>
        ) : (
          <form onSubmit={submitExperienceReport} className="space-y-3">
            <textarea
              value={reportContent}
              onChange={(e) => setReportContent(e.target.value)}
              placeholder="Describe what you felt or noticed here..."
              rows={4}
              className={`w-full p-3 font-serif text-sm bg-transparent border rounded resize-none focus:outline-none focus:ring-1 ${
                isTheophany
                  ? 'border-theophany-muted/40 placeholder:text-theophany-muted focus:ring-theophany-accent'
                  : 'border-sanctuary-accent/20 placeholder:text-sanctuary-muted focus:ring-sanctuary-accent'
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
                  className={`font-sans text-xs uppercase tracking-wider px-3 py-1 border rounded transition-colors ${
                    selectedTag === tag
                      ? isTheophany
                        ? 'bg-theophany-accent text-theophany-bg border-theophany-accent'
                        : 'bg-sanctuary-accent text-sanctuary-bg border-sanctuary-accent'
                      : borderClass
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>

            <button
              type="submit"
              disabled={submitting || !reportContent.trim()}
              className={`px-6 py-2 font-sans text-xs uppercase tracking-wider border transition-colors disabled:opacity-40 ${
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
            <p className="font-serif italic opacity-40 text-sm">No experience reports yet.</p>
          ) : (
            experienceReports.map((report) => (
              <div key={report.id} className={`border-l-2 pl-4 ${isTheophany ? 'border-theophany-muted/40' : 'border-sanctuary-accent/30'}`}>
                <p className="font-serif text-sm italic leading-relaxed">{report.content}</p>
                {report.reflection_tag && (
                  <p className={`font-sans text-xs uppercase tracking-wider mt-2 ${accentClass} opacity-70`}>
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
