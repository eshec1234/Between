import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase, hasSupabaseEnv } from '../lib/supabase'

const STATES = ['PA', 'NJ', 'NY']
const MODES = ['sanctuary', 'theophany', 'both']

export default function SubmitPlace() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    address: '',
    city: '',
    state: 'PA',
    mode: 'sanctuary',
    description: '',
    traditions: '',
    cultural_sensitivities: '',
    access_protocols: '',
    lat: '',
    lng: ''
  })

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!hasSupabaseEnv || !supabase) {
      setError('Submission is unavailable until Supabase env vars are configured.')
      return
    }

    setSubmitting(true)

    // Coordinates are optional. If omitted, place can still be submitted.
    const hasCoordinates = form.lat !== '' && form.lng !== ''
    const coordinates = hasCoordinates
      ? `SRID=4326;POINT(${form.lng} ${form.lat})`
      : null

    const { error: insertError } = await supabase.from('places').insert({
      name: form.name,
      address: form.address,
      city: form.city,
      state: form.state,
      mode: form.mode,
      description: form.description,
      traditions: form.traditions || null,
      cultural_sensitivities: form.cultural_sensitivities || null,
      access_protocols: form.access_protocols || null,
      coordinates,
      source: 'community'
    })

    if (insertError) {
      if (insertError.code === '42501') {
        setError('Submission blocked by database permissions (RLS). Update Supabase policy to allow anon inserts into places.')
      } else if (insertError.code === 'PGRST205' || insertError.message?.includes("Could not find the table 'public.places'")) {
        setError("Database table 'places' is missing in this Supabase project. Run the SQL migrations to create tables, then retry.")
      } else {
        setError(`Submission failed: ${insertError.message}`)
      }
      setSubmitting(false)
      return
    }

    navigate('/')
  }

  const inputClass = `w-full p-3 font-sans text-sm bg-transparent border border-sanctuary-accent/20 rounded focus:outline-none focus:ring-1 focus:ring-sanctuary-accent placeholder:text-sanctuary-muted`
  const labelClass = `block font-sans text-xs uppercase tracking-wider text-sanctuary-muted mb-1`

  return (
    <div className="min-h-screen bg-sanctuary-bg text-sanctuary-text">
      <div className="max-w-lg mx-auto p-6 pb-24">
        {/* Header */}
        <div className="mb-8">
          <Link to="/" className="font-sans text-xs uppercase tracking-wider text-sanctuary-accent">← Back</Link>
          <h1 className="font-serif text-2xl mt-4">Submit a Place</h1>
          <p className="font-sans text-xs uppercase tracking-wider text-sanctuary-muted mt-1">
            Community submissions are anonymous.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label className={labelClass}>Place Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={set('name')}
              required
              placeholder="e.g. Eastern State Penitentiary Chapel"
              className={inputClass}
            />
          </div>

          {/* Mode */}
          <div>
            <label className={labelClass}>Mode *</label>
            <div className="flex gap-2">
              {MODES.map(m => (
                <label
                  key={m}
                  className={`flex-1 py-2 font-sans text-xs uppercase tracking-wider border rounded transition-colors text-center cursor-pointer ${
                    form.mode === m
                      ? 'bg-sanctuary-accent text-sanctuary-bg border-sanctuary-accent'
                      : 'border-sanctuary-accent/20 text-sanctuary-muted'
                  }`}
                >
                  <input
                    type="radio"
                    name="mode"
                    value={m}
                    checked={form.mode === m}
                    onChange={set('mode')}
                    className="sr-only"
                  />
                  {m}
                </label>
              ))}
            </div>
          </div>

          {/* Address */}
          <div>
            <label className={labelClass}>Street Address *</label>
            <input type="text" value={form.address} onChange={set('address')} required placeholder="2027 Fairmount Ave" className={inputClass} />
          </div>

          {/* City + State */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className={labelClass}>City *</label>
              <input type="text" value={form.city} onChange={set('city')} required placeholder="Philadelphia" className={inputClass} />
            </div>
            <div className="w-24">
              <label className={labelClass}>State *</label>
              <select value={form.state} onChange={set('state')} className={inputClass}>
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Coordinates */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className={labelClass}>Latitude</label>
              <input type="number" step="any" value={form.lat} onChange={set('lat')} placeholder="39.9769" className={inputClass} />
            </div>
            <div className="flex-1">
              <label className={labelClass}>Longitude</label>
              <input type="number" step="any" value={form.lng} onChange={set('lng')} placeholder="-75.1727" className={inputClass} />
            </div>
          </div>
          <p className="font-sans text-xs text-sanctuary-muted">Latitude and longitude are optional.</p>

          {/* Description */}
          <div>
            <label className={labelClass}>Description * <span className="normal-case text-sanctuary-muted/60">(human experience only — no AI-generated text)</span></label>
            <textarea
              value={form.description}
              onChange={set('description')}
              required
              rows={5}
              placeholder="Describe the atmosphere, what you or others have felt here..."
              className={`${inputClass} resize-none`}
              maxLength={2000}
            />
          </div>

          {/* Tier 1 Feature #8: Tradition + Sensitivity fields */}
          <div className="border border-sanctuary-accent/10 rounded p-4 space-y-4">
            <h3 className="font-sans text-xs uppercase tracking-wider text-sanctuary-muted">Cultural Context (Optional)</h3>

            <div>
              <label className={labelClass}>Religious / Spiritual Traditions</label>
              <input type="text" value={form.traditions} onChange={set('traditions')} placeholder="e.g. Quaker, Catholic, Indigenous" className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Cultural Sensitivities</label>
              <input type="text" value={form.cultural_sensitivities} onChange={set('cultural_sensitivities')} placeholder="e.g. Active place of worship — dress respectfully" className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Access Protocols</label>
              <input type="text" value={form.access_protocols} onChange={set('access_protocols')} placeholder="e.g. Open to public weekdays 9–5" className={inputClass} />
            </div>
          </div>

          {error && (
            <p className="font-sans text-xs text-red-500">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 border border-sanctuary-accent text-sanctuary-accent font-sans text-xs uppercase tracking-wider hover:bg-sanctuary-accent hover:text-sanctuary-bg transition-colors disabled:opacity-40"
          >
            {submitting ? 'Submitting...' : 'Submit Place'}
          </button>
        </form>
      </div>
    </div>
  )
}
