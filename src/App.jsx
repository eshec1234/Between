import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { getOrCreateSession } from './lib/supabase'
import Home from './pages/Home'
import PlaceDetail from './pages/PlaceDetail'
import SubmitPlace from './pages/SubmitPlace'
import Onboarding from './components/Onboarding'

function App() {
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(
    localStorage.getItem('between_onboarding_seen') === 'true'
  )

  useEffect(() => {
    // Initialize anonymous session
    getOrCreateSession()
  }, [])

  const handleOnboardingComplete = () => {
    localStorage.setItem('between_onboarding_seen', 'true')
    setHasSeenOnboarding(true)
  }

  return (
    <Router>
      <div className="min-h-screen bg-sanctuary-bg text-sanctuary-text">
        {!hasSeenOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/place/:id" element={<PlaceDetail />} />
          <Route path="/submit" element={<SubmitPlace />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
