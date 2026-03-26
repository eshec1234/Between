import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { getOrCreateSession, hasSupabaseEnv, syncAnonymousSession } from './lib/supabase'
import { hasMapboxEnv } from './lib/env'
import Home from './pages/Home'
import PlaceDetail from './pages/PlaceDetail'
import SubmitPlace from './pages/SubmitPlace'
import About from './pages/About'
import FAQPage from './pages/FAQPage'
import Onboarding from './components/Onboarding'
import AppFrame from './components/AppFrame'

function MainApp() {
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(
    () => localStorage.getItem('between_onboarding_seen') === 'true'
  )

  useEffect(() => {
    getOrCreateSession()
    syncAnonymousSession()
  }, [])

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') syncAnonymousSession()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  const handleOnboardingComplete = () => {
    localStorage.setItem('between_onboarding_seen', 'true')
    setHasSeenOnboarding(true)
  }

  return (
    <AppFrame>
      {(!hasSupabaseEnv || !hasMapboxEnv) && (
        <div className="relative z-10 mx-4 mt-4 mb-2 shrink-0 border border-amber-400/40 bg-amber-100/20 px-3 py-2 text-xs font-sans uppercase tracking-wider text-sanctuary-text space-y-1">
          {!hasSupabaseEnv && (
            <p>Missing Supabase env vars: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.</p>
          )}
          {!hasMapboxEnv && (
            <p>Missing Mapbox env var: VITE_MAPBOX_TOKEN (or VITE_MAPBOX_ACCESS_TOKEN).</p>
          )}
        </div>
      )}
      <div className="relative flex min-h-0 flex-1 flex-col">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/place/:id" element={<PlaceDetail />} />
          <Route path="/submit" element={<SubmitPlace />} />
        </Routes>
        {!hasSeenOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}
      </div>
    </AppFrame>
  )
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/about" element={<About />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/*" element={<MainApp />} />
      </Routes>
    </Router>
  )
}

export default App
