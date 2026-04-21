import { useState, useEffect, useMemo, useRef } from 'react'
import { useAmbientMode } from '../context/AmbientModeContext'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { supabase, getOrCreateSession, hasSupabaseEnv } from '../lib/supabase'
import { markVisited, markWalkthroughDone, isSaved, toggleSaved, getHomeMode } from '../lib/betweenLocal'
import TheophanyDisclaimer from '../components/TheophanyDisclaimer'
import SourceBadge from '../components/SourceBadge'
import PlaceWalkthrough from '../components/PlaceWalkthrough'
import AmbientOrbs from '../components/AmbientOrbs'
import FilmGrain from '../components/FilmGrain'
import Starfield from '../components/Starfield'
import { photosForPlace, photoForPlaceAtTime, placeImageFallbackChain } from '../lib/placePhotoFallback'
import PlaceImage, { PlaceImageFromUrl } from '../components/PlaceImage'

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
  const { setAmbientVariant } = useAmbientMode()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const surpriseMode = searchParams.get('surprise') === '1'
  // Surprise mode no longer hides the address — users need to know WHERE to go.
  // We still scroll to the walkthrough section so the experience comes first.
  const [revealed] = useState(true)
  const walkthroughRef = useRef(null)
  const [place, setPlace] = useState(null)
  const [experienceReports, setExperienceReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [reportContent, setReportContent] = useState('')
  const [contentKind, setContentKind] = useState('review')
  const [stillness, setStillness] = useState(3)
  const [selectedTag, setSelectedTag] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [postFlash, setPostFlash] = useState('')
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const photoInputRef = useRef(null)
  const [flagDone, setFlagDone] = useState(false)
  const [flagBusy, setFlagBusy] = useState(false)
  const [resonanceCount, setResonanceCount] = useState(0)
  const [resonanceSelf, setResonanceSelf] = useState(false)
  const [resonanceBusy, setResonanceBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const textareaRef = useRef(null)

  const isTheophany =
    place?.mode === 'theophany' ||
    (place?.mode === 'both' && getHomeMode() === 'theophany')

  useEffect(() => {
    if (!place) return
    setAmbientVariant(isTheophany ? 'theophany' : 'sanctuary')
  }, [place, isTheophany, setAmbientVariant])

  useEffect(() => {
    fetchPlace()
    fetchExperienceReports()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const walkthroughParam = searchParams.get('walkthrough')
  useEffect(() => {
    if (!place || surpriseMode) return
    if (walkthroughParam !== '1') return
    const t = window.setTimeout(() => {
      walkthroughRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 450)
    return () => window.clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [place?.id, surpriseMode, walkthroughParam])

  useEffect(() => {
    if (place?.id) setSaved(isSaved(place.id))
  }, [place?.id])

  useEffect(() => {
    if (id) markVisited(id)
  }, [id])

  useEffect(() => {
    let cancelled = false
    async function loadResonance() {
      if (!hasSupabaseEnv || !supabase || !id) return
      try {
        const { count, error: cErr } = await supabase
          .from('place_resonance')
          .select('*', { count: 'exact', head: true })
          .eq('place_id', id)
        if (cErr) return
        if (!cancelled) setResonanceCount(count ?? 0)
        const sid = getOrCreateSession()
        const { data, error: rErr } = await supabase
          .from('place_resonance')
          .select('id')
          .eq('place_id', id)
          .eq('session_id', sid)
          .maybeSingle()
        if (rErr) return
        if (!cancelled) setResonanceSelf(!!data)
      } catch {
        /* table missing until migration 009 */
      }
    }
    loadResonance()
    return () => {
      cancelled = true
    }
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

  // Must be above early returns — visitor photos from experience_reports
  // override the AI placeholder on the hero image.
  const visitorPhotoUrls = useMemo(
    () => experienceReports.map((r) => r.photo_url).filter(Boolean),
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

    // Upload photo to Supabase Storage if one was selected
    let uploadedPhotoUrl = null
    if (photoFile) {
      const ext = photoFile.name.split('.').pop()
      const path = `${id}/${sessionId}-${Date.now()}.${ext}`
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('place-photos')
        .upload(path, photoFile, { upsert: false, contentType: photoFile.type })
      if (!uploadErr && uploadData?.path) {
        const { data: urlData } = supabase.storage.from('place-photos').getPublicUrl(uploadData.path)
        uploadedPhotoUrl = urlData?.publicUrl ?? null
      }
    }

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
        contentKind === 'review' && (place.mode === 'sanctuary' || place.mode === 'both') ? stillness : null,
      photo_url: uploadedPhotoUrl,
    }

    let { error } = await supabase.from('experience_reports').insert(extended)

    if (error) {
      const { error: err2 } = await supabase.from('experience_reports').insert(base)
      error = err2
    }

    if (error) {
      const msg =
        error.code === '42501'
          ? "We couldn't save that right now — try again in a moment."
          : 'Something went wrong. Please try again.'
      setPostFlash(msg)
      setTimeout(() => setPostFlash(''), 5000)
    } else {
      setPostFlash(contentKind === 'tip' ? 'Tip posted.' : 'Experience report posted.')
      setTimeout(() => setPostFlash(''), 4000)
      setReportContent('')
      setSelectedTag('')
      setContentKind('review')
      setPhotoFile(null)
      setPhotoPreview(null)
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

  const addResonance = async () => {
    if (!hasSupabaseEnv || !supabase || resonanceSelf || resonanceBusy) return
    setResonanceBusy(true)
    const { error } = await supabase.from('place_resonance').insert({
      place_id: id,
      session_id: getOrCreateSession()
    })
    if (!error) {
      setResonanceSelf(true)
      setResonanceCount((c) => c + 1)
    }
    setResonanceBusy(false)
  }

  if (loading) {
    // Use the user's current home mode so the skeleton matches the destination
    // theme — prevents a sanctuary gold flash when opening a theophany place.
    const loadingIsTheophany = getHomeMode() === 'theophany'
    return (
      <div
        className={`relative flex min-h-0 flex-1 flex-col overflow-hidden ${
          loadingIsTheophany
            ? 'bg-gradient-to-b from-theophany-bg to-theophany-secondary'
            : 'bg-gradient-to-b from-sanctuary-bg to-sanctuary-secondary'
        }`}
      >
        <FilmGrain opacity={0.05} />
        <div className="relative z-10 flex flex-1 flex-col gap-4 p-6 pt-10">
          <div className={`bf-skeleton h-4 w-28 rounded-md ${loadingIsTheophany ? 'bg-theophany-muted/25' : 'bg-sanctuary-muted/25'}`} />
          <div className={`bf-skeleton h-[clamp(160px,min(42dvh,48vmin),400px)] min-h-[160px] w-full rounded-xl ${loadingIsTheophany ? 'bg-theophany-muted/20' : 'bg-sanctuary-muted/20'}`} />
          <div className={`bf-skeleton h-8 w-3/4 max-w-md rounded ${loadingIsTheophany ? 'bg-theophany-muted/25' : 'bg-sanctuary-muted/25'}`} />
          <div className={`bf-skeleton h-20 w-full rounded-lg ${loadingIsTheophany ? 'bg-theophany-muted/15' : 'bg-sanctuary-muted/15'}`} />
          <p className={`pt-4 text-center font-serif text-sm italic ${loadingIsTheophany ? 'text-theophany-muted' : 'text-sanctuary-muted'}`}>
            Opening the space…
          </p>
        </div>
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

  const bgClass = isTheophany
    ? 'bg-theophany-bg text-theophany-text'
    : 'bg-gradient-to-b from-sanctuary-bg via-sanctuary-primary to-sanctuary-secondary text-sanctuary-text'
  const borderClass = isTheophany ? 'border-theophany-accent/45' : 'border-sanctuary-accent/45'
  const accentClass = isTheophany ? 'text-theophany-accent' : 'text-sanctuary-accent'
  const bodyClass = isTheophany ? 'text-theophany-text' : 'text-sanctuary-text'
  const subClass = isTheophany ? 'text-theophany-muted' : 'text-sanctuary-muted'
  const maxLen = contentKind === 'tip' ? TIP_MAX : REVIEW_MAX
  const gallery = photosForPlace(place)
  const hasGooglePlacePhoto = gallery.some((u) => String(u).includes('googleusercontent.com'))
  const heroPick = photoForPlaceAtTime(place)
  const heroChain = placeImageFallbackChain(place, visitorPhotoUrls)

  return (
    <div className={`relative min-h-0 flex-1 overflow-y-auto pb-[max(1rem,env(safe-area-inset-bottom,0px))] ${bgClass}`}>
      {isTheophany && (
        <>
          <Starfield pinToViewport />
          <div
            className="pointer-events-none fixed inset-0 z-[1] min-h-[100dvh]"
            style={{
              background:
                'radial-gradient(ellipse 85% 55% at 50% -15%, rgba(120, 70, 180, 0.22), transparent 52%), radial-gradient(ellipse 90% 70% at 100% 50%, rgba(60, 30, 90, 0.12), transparent 45%), radial-gradient(ellipse_at_center, transparent 16%, rgba(0,0,0,0.78) 100%)'
            }}
          />
        </>
      )}
      {!isTheophany && (
        <>
          <AmbientOrbs variant="sanctuary" />
          <FilmGrain opacity={0.04} />
        </>
      )}

      <div className="relative z-10">
      <div className="p-4 pt-[max(1.5rem,calc(env(safe-area-inset-top,0px)+0.5rem))]">
        <Link to="/" className={`font-sans text-xs font-medium uppercase tracking-wider ${accentClass} hover:underline`}>
          ← Back
        </Link>
      </div>

      {surpriseMode && (
        <div className="px-6 pb-2">
          <p className={`font-serif text-sm italic leading-relaxed ${subClass}`}>
            A random place chose you — go, and let the walkthrough guide you when you arrive.
          </p>
        </div>
      )}

      {(!surpriseMode || revealed) && (
        <div className="relative w-full">
          {visitorPhotoUrls.length > 0 && (
            <p className={`px-4 pb-1 font-sans text-[8px] uppercase tracking-wider ${subClass}`}>
              {visitorPhotoUrls.length === 1 ? 'Visitor photo' : `${visitorPhotoUrls.length} visitor photos`}
            </p>
          )}
          {!visitorPhotoUrls.length && gallery.length > 1 && heroPick.label && (
            <p className={`px-4 pb-1 font-sans text-[8px] uppercase tracking-wider ${subClass}`}>
              AI placeholder · {heroPick.label} (local time) — be the first to add a real photo below
            </p>
          )}
          {hasGooglePlacePhoto && (
            <p className={`px-4 pb-1 font-sans text-[8px] leading-snug opacity-80 ${subClass}`}>
              Photos from Google Places. Google Maps and Google Places data © Google.
            </p>
          )}
          <div className="relative min-h-[160px] h-[clamp(160px,min(42dvh,48vmin),400px)] w-full overflow-hidden">
            {heroChain.length > 0 ? (
              <PlaceImageFromUrl
                url={heroChain[0]}
                isTheophany={isTheophany}
                variant="hero"
                imgClassName={`bf-hero-kenburns h-[115%] w-full min-w-full -translate-y-[5%] object-cover ${
                  isTheophany ? 'brightness-[0.55] saturate-[0.25]' : 'brightness-[1.02] saturate-[0.85]'
                }`}
              />
            ) : (
              <PlaceImage
                place={place}
                isTheophany={isTheophany}
                variant="hero"
                imgClassName={`bf-hero-kenburns h-[115%] w-full min-w-full -translate-y-[5%] object-cover ${
                  isTheophany ? 'brightness-[0.55] saturate-[0.25]' : 'brightness-[1.02] saturate-[0.85]'
                }`}
              />
            )}
            <div
              className={`pointer-events-none absolute inset-0 bg-gradient-to-t ${
                isTheophany
                  ? 'from-theophany-bg via-theophany-bg/40 to-transparent'
                  : 'from-sanctuary-bg via-sanctuary-bg/35 to-transparent'
              }`}
            />
          </div>
          {/* Gallery strip: visitor photos first, then AI placeholders */}
          {(visitorPhotoUrls.length > 1 || (!visitorPhotoUrls.length && gallery.length > 1)) && (
            <div className="flex gap-2 overflow-x-auto px-4 py-2">
              {(visitorPhotoUrls.length > 1 ? visitorPhotoUrls.slice(1) : gallery.slice(1)).map((url) => (
                <PlaceImageFromUrl
                  key={url}
                  url={url}
                  isTheophany={isTheophany}
                  imgClassName="h-20 w-28 shrink-0 rounded object-cover"
                />
              ))}
            </div>
          )}
        </div>
      )}

      <div className={`space-y-4 p-6 ${bodyClass}`}>
        {(!surpriseMode || revealed) && (
          <>
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded border px-2 py-0.5 font-sans text-xs font-medium uppercase tracking-wider ${borderClass} ${accentClass}`}
                >
                  {place.mode}
                </span>
                <SourceBadge source={place.source} />
              </div>
              <div className="mt-2 flex flex-wrap items-start justify-between gap-2">
                <h1 className="font-serif text-2xl font-medium tracking-tight text-current">{place.name}</h1>
                <button
                  type="button"
                  onClick={() => setSaved(toggleSaved(place.id))}
                  className={`shrink-0 rounded-full border-2 px-3 py-1 font-sans text-xs font-semibold uppercase tracking-wider ${
                    saved
                      ? isTheophany
                        ? 'border-theophany-accent bg-theophany-accent/20 text-theophany-accent'
                        : 'border-sanctuary-accent bg-sanctuary-accent/15 text-sanctuary-accent'
                      : `${borderClass} ${subClass} hover:opacity-90`
                  }`}
                  aria-label={saved ? 'Remove from saved' : 'Save place'}
                >
                  {saved ? 'Saved ♥' : 'Save ♡'}
                </button>
              </div>
              <p className={`mt-1 font-sans text-xs uppercase tracking-wider ${subClass}`}>
                {place.address} · {place.city}, {place.state}
              </p>
              {place.coordinates?.coordinates && (
                <a
                  href={(() => {
                    const [lng, lat] = place.coordinates.coordinates
                    const dest = `${lat},${lng}`
                    const label = encodeURIComponent(place.name)
                    const isApple = /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent) && !window.MSStream
                    return isApple
                      ? `https://maps.apple.com/?daddr=${dest}&dirflg=d&t=m&q=${label}`
                      : `https://www.google.com/maps/dir/?api=1&destination=${dest}&destination_place_name=${label}`
                  })()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`mt-2 inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 font-sans text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                    isTheophany
                      ? 'border-theophany-accent text-theophany-accent hover:bg-theophany-accent/15'
                      : 'border-sanctuary-accent text-sanctuary-accent hover:bg-sanctuary-accent/10'
                  }`}
                >
                  Get Directions →
                </a>
              )}
            </div>

            {place.curated_quote && (
              <blockquote
                className={`border-l-4 py-1 pl-4 font-serif text-sm italic leading-relaxed ${
                  isTheophany ? 'border-theophany-accent/70 text-violet-200/85' : 'border-sanctuary-accent/70 text-sanctuary-muted'
                }`}
              >
                {place.curated_quote}
              </blockquote>
            )}

            {hasSupabaseEnv && (
              <div
                className={`flex flex-wrap items-center gap-3 rounded-lg border px-3 py-2.5 ${borderClass} ${
                  isTheophany ? 'bg-white/[0.06]' : 'bg-black/[0.04]'
                }`}
              >
                <p className={`font-sans text-[11px] ${subClass}`}>
                  <span className="font-medium text-current">{resonanceCount}</span> visitors said this place stayed with
                  them
                </p>
                <button
                  type="button"
                  disabled={resonanceSelf || resonanceBusy}
                  onClick={addResonance}
                  className={`rounded-full border px-3 py-1 font-sans text-[10px] font-semibold uppercase tracking-wider transition-colors disabled:opacity-45 ${
                    isTheophany
                      ? 'border-theophany-accent text-theophany-accent hover:bg-theophany-accent/15'
                      : 'border-sanctuary-accent text-sanctuary-accent hover:bg-sanctuary-accent/10'
                  }`}
                >
                  {resonanceSelf ? 'Counted for you' : resonanceBusy ? '…' : 'This stayed with me'}
                </button>
              </div>
            )}
          </>
        )}

        <div ref={walkthroughRef}>
          <PlaceWalkthrough
            place={place}
            isTheophany={isTheophany}
            borderClass={borderClass}
            accentClass={accentClass}
            subClass={subClass}
            bodyClass={bodyClass}
            onReachedLastStep={() => markWalkthroughDone(place.id)}
          />
        </div>

        {(!surpriseMode || revealed) && (
          <>
            {place.description && place.description.length > 520 && (
              <details className={`rounded-lg border px-3 py-2 ${borderClass}`}>
                <summary className={`cursor-pointer font-sans text-[11px] uppercase tracking-wider ${subClass}`}>
                  Full place description
                </summary>
                <p className={`mt-2 font-serif text-sm italic leading-relaxed ${bodyClass}`}>{place.description}</p>
              </details>
            )}

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
          </>
        )}
      </div>

      {(!surpriseMode || revealed) && (
      <div className={`space-y-6 border-t-2 p-6 ${borderClass} ${bodyClass}`}>
        <div>
          <h2 className="font-serif text-lg font-medium text-current">Experience reports & tips</h2>
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
                Experience report
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

            {/* Photo upload — optional; replaces AI placeholder for this place */}
            <div>
              <p className={`mb-1.5 font-sans text-[10px] uppercase tracking-wider ${subClass}`}>
                Add a photo from your visit (optional)
              </p>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  setPhotoFile(file)
                  setPhotoPreview(URL.createObjectURL(file))
                }}
              />
              {photoPreview ? (
                <div className="relative w-full overflow-hidden rounded-md">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="h-36 w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => { setPhotoFile(null); setPhotoPreview(null) }}
                    className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 font-sans text-[10px] text-white"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className={`flex w-full items-center justify-center gap-2 rounded-md border-2 border-dashed px-4 py-4 font-sans text-[10px] uppercase tracking-wider transition-colors ${
                    isTheophany
                      ? 'border-theophany-accent/35 text-theophany-muted hover:border-theophany-accent/60'
                      : 'border-sanctuary-accent/35 text-sanctuary-muted hover:border-sanctuary-accent/60'
                  }`}
                >
                  Upload photo from this location
                </button>
              )}
            </div>

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
              {submitting ? 'Posting…' : contentKind === 'tip' ? 'Post tip' : 'Post experience report'}
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
          <h3 className={`mb-2 font-sans text-[10px] uppercase tracking-widest ${subClass}`}>Experience reports</h3>
          {reviews.length === 0 ? (
            <div
              className={`rounded-lg border-2 px-4 py-4 ${borderClass} ${
                isTheophany ? 'bg-theophany-primary/50' : 'bg-white/80'
              }`}
            >
              <p className={`font-serif text-sm italic leading-relaxed ${bodyClass}`}>
                No reflections yet — scroll up for the walkthrough, then come back here when something lingers.
              </p>
              <p className={`mt-2 font-sans text-[11px] ${subClass}`}>Prompt: What did you notice first when you imagined standing there?</p>
              <button
                type="button"
                onClick={() => {
                  setContentKind('review')
                  focusComposer()
                }}
                className={`mt-3 rounded-md border-2 px-4 py-2 font-sans text-[10px] font-semibold uppercase tracking-wider ${
                  isTheophany
                    ? 'border-theophany-accent text-theophany-accent hover:bg-theophany-accent/15'
                    : 'border-sanctuary-accent text-sanctuary-accent hover:bg-sanctuary-accent/10'
                }`}
              >
                Write a reflection
              </button>
            </div>
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
      )}
      </div>
    </div>
  )
}
