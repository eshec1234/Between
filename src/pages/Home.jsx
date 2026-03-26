import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase, hasSupabaseEnv } from '../lib/supabase'
import Map from '../components/Map'
import TheophanyDisclaimer from '../components/TheophanyDisclaimer'

export default function Home() {
  const [mode, setMode] = useState('sanctuary') // 'sanctuary' | 'theophany'
  const [places, setPlaces] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPlaces()
  }, [mode])

  const fetchPlaces = async () => {
    setLoading(true)
    if (!hasSupabaseEnv || !supabase) {
      setPlaces([])
      setLoading(false)
      return
    }
    const { data } = await supabase
      .from('places')
      .select('*')
      .or(`mode.eq.${mode},mode.eq.both`)
      .limit(20)

    setPlaces(data || [])
    setLoading(false)
  }

  const isTheophany = mode === 'theophany'

  return (
    <div className={isTheophany ? 'min-h-screen bg-theophany-bg text-theophany-text' : 'min-h-screen bg-sanctuary-bg text-sanctuary-text'}>
      {/* Header + Mode Toggle */}
      <div className={`fixed top-0 left-0 right-0 z-40 p-4 flex justify-between items-center ${isTheophany ? 'bg-theophany-bg/90 backdrop-blur-sm' : 'bg-sanctuary-bg/90 backdrop-blur-sm'}`}>
        <h1 className="font-serif text-xl tracking-widest">Between</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setMode('sanctuary')}
            className={`px-4 py-2 font-sans text-xs uppercase tracking-wider transition-colors ${
              mode === 'sanctuary'
                ? 'bg-sanctuary-accent text-sanctuary-bg'
                : 'border border-sanctuary-muted text-sanctuary-muted'
            }`}
          >
            Sanctuary
          </button>
          <button
            onClick={() => setMode('theophany')}
            className={`px-4 py-2 font-sans text-xs uppercase tracking-wider transition-colors ${
              mode === 'theophany'
                ? 'bg-theophany-accent text-theophany-bg'
                : 'border border-theophany-muted text-theophany-muted'
            }`}
          >
            Theophany
          </button>
        </div>
      </div>

      {/* Map */}
      <div className="pt-16">
        <Map mode={mode} places={places} />
      </div>

      {/* Feed */}
      <div className="p-4 pb-24 space-y-4">
        {loading ? (
          <p className="text-center font-serif italic pt-8 opacity-60">Finding nearby spaces...</p>
        ) : places.length === 0 ? (
          <div className="text-center pt-12 space-y-3">
            <p className="font-serif italic opacity-60">No places here yet.</p>
            <p className="font-sans text-xs uppercase tracking-wider opacity-40">Be the first to add one.</p>
          </div>
        ) : (
          places.map((place) => (
            <PlaceCard key={place.id} place={place} isTheophany={isTheophany} />
          ))
        )}
      </div>

      {/* Submit FAB */}
      <Link
        to="/submit"
        className={`fixed bottom-6 right-6 w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-lg transition-colors ${
          isTheophany
            ? 'bg-theophany-accent text-theophany-bg'
            : 'bg-sanctuary-accent text-sanctuary-bg'
        }`}
        title="Submit a place"
      >
        +
      </Link>
    </div>
  )
}

function PlaceCard({ place, isTheophany }) {
  return (
    <Link to={`/place/${place.id}`}>
      <div className={`border rounded-lg overflow-hidden transition-opacity hover:opacity-90 ${
        isTheophany
          ? 'bg-theophany-secondary border-theophany-muted/40'
          : 'bg-white border-sanctuary-accent/20'
      }`}>
        {/* Photo or placeholder */}
        <div className="h-32 bg-gray-200 relative">
          {place.photos?.[0] && (
            <img src={place.photos[0]} alt={place.name} className="w-full h-full object-cover" />
          )}
          <div className="absolute top-2 left-2">
            <span className={`text-xs uppercase tracking-wider px-2 py-1 rounded font-sans ${
              place.source === 'verified'
                ? 'bg-black/60 text-white'
                : 'bg-white/80 text-black'
            }`}>
              {place.source}
            </span>
          </div>
        </div>

        <div className="p-4">
          <h3 className="font-serif text-lg mb-1">{place.name}</h3>
          <p className={`font-sans text-xs uppercase tracking-wider mb-2 ${isTheophany ? 'text-theophany-muted' : 'text-sanctuary-muted'}`}>
            {place.city}, {place.state}
          </p>
          <p className="font-serif text-sm italic opacity-80 line-clamp-2">{place.description}</p>

          {/* Tier 1 Feature #8: Tradition/Sensitivity preview */}
          {place.traditions && (
            <p className="mt-2 text-xs opacity-50 font-sans">
              Traditions: {place.traditions}
            </p>
          )}

          {/* Tier 1 Feature #7: Theophany disclaimer on every card */}
          {isTheophany && <TheophanyDisclaimer />}
        </div>
      </div>
    </Link>
  )
}
