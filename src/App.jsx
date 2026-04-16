import { useState, useEffect, useRef, Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { getOrCreateSession, hasSupabaseEnv, syncAnonymousSession } from './lib/supabase'
import { hasMapboxEnv } from './lib/env'
import Onboarding from './components/Onboarding'
import AppFrame from './components/AppFrame'
import { AmbientModeProvider } from './context/AmbientModeContext'
import ZenAmbient from './components/ZenAmbient'
import RunawayOnboardingLoop from './components/RunawayOnboardingLoop'

const Home = lazy(() => import('./pages/Home'))
const PlaceDetail = lazy(() => import('./pages/PlaceDetail'))
const SubmitPlace = lazy(() => import('./pages/SubmitPlace'))
const About = lazy(() => import('./pages/About'))
const FAQPage = lazy(() => import('./pages/FAQPage'))

function PageLoader() {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center bg-sanctuary-bg">
      <p className="font-serif italic text-sanctuary-muted text-sm opacity-60">Loading…</p>
    </div>
  )
}

function RouteAnnouncer() {
  const location = useLocation()
  const liveRef = useRef(null)

  useEffect(() => {
    const h1 = document.querySelector('h1')
    if (h1) {
      h1.setAttribute('tabindex', '-1')
      h1.focus()
    } else if (liveRef.current) {
      liveRef.current.textContent = document.title
    }
  }, [location.pathname])

  return (
    <div
      ref={liveRef}
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    />
  )
}

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
    <AmbientModeProvider>
      <AppFrame>
        {import.meta.env.DEV && (!hasSupabaseEnv || !hasMapboxEnv) && (
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
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/place/:id" element={<PlaceDetail />} />
              <Route path="/submit" element={<SubmitPlace />} />
            </Routes>
          </Suspense>
          {!hasSeenOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}
          <RunawayOnboardingLoop active={!hasSeenOnboarding} />
          <ZenAmbient showRunawayButton={hasSeenOnboarding} />
        </div>
      </AppFrame>
    </AmbientModeProvider>
  )
}

function App() {
  return (
    <Router>
      <RouteAnnouncer />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/about" element={<About />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/*" element={<MainApp />} />
        </Routes>
      </Suspense>
    </Router>
  )
}

export default App
