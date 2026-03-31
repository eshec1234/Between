import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ParticleBackground from './ParticleBackground'
import Rule from './Rule'
import LocationConsentModal from './LocationConsentModal'

export default function Onboarding({ onComplete }) {
  const [consented, setConsented] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setShowPrompt(true), 1700)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [])

  const handleAgree = () => {
    localStorage.setItem('between_location_consent', 'yes')
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {},
        () => {},
        { timeout: 15000, maximumAge: 60000 }
      )
    }
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission()
    }
    setConsented(true)
  }

  const handleDecline = () => {
    localStorage.setItem('between_location_consent', 'no')
    setConsented(true)
  }

  const enterMode = (mode) => {
    if (!consented) return
    sessionStorage.setItem('between_initial_mode', mode)
    try {
      localStorage.setItem('between_home_mode', mode)
    } catch {
      /* ignore */
    }
    localStorage.setItem('between_onboarding_seen', 'true')
    onComplete()
  }

  return (
    <div className="fixed inset-0 z-50 min-h-dvh overflow-x-hidden overflow-y-auto bg-[#1a1610] overscroll-none">
      <ParticleBackground />
      <div className="pointer-events-none absolute inset-0 z-[2] bg-[radial-gradient(ellipse_78%_60%_at_50%_45%,transparent_18%,rgba(14,10,5,0.55)_100%)]" />

      <div className="absolute top-0 left-0 right-0 z-20 flex justify-between pl-[max(22px,env(safe-area-inset-left,0px))] pr-[max(22px,env(safe-area-inset-right,0px))] pt-[max(18px,env(safe-area-inset-top,0px))] pb-[18px]">
        <Link
          to="/about"
          className="pointer-events-auto font-sans text-[9px] uppercase tracking-[0.22em] text-[rgba(210,188,125,0.85)]"
        >
          About
        </Link>
        <Link
          to="/faq"
          className="pointer-events-auto font-sans text-[9px] uppercase tracking-[0.22em] text-[rgba(210,188,125,0.85)]"
        >
          FAQ
        </Link>
      </div>

      <div className="relative z-10 flex min-h-dvh flex-col items-center justify-center pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] pl-[max(1.25rem,env(safe-area-inset-left,0px))] pr-[max(1.25rem,env(safe-area-inset-right,0px))] pt-[max(3.25rem,calc(env(safe-area-inset-top,0px)+2.25rem))]">
        <div className="mb-6 w-full max-w-lg text-center">
          {showPrompt && (
            <div className="mb-4 animate-bfIn">
              <Rule />
            </div>
          )}
          <h1
            className="font-display text-[clamp(2rem,10.5vw,3.1rem)] font-light leading-none tracking-[0.52em] text-[#f0e8d0] ml-[0.52em]"
            style={{
              textShadow:
                '0 0 55px rgba(195,155,55,.7), 0 2px 22px rgba(0,0,0,.98), 0 0 110px rgba(195,155,55,.3)'
            }}
          >
            Between
          </h1>
          {showPrompt && (
            <div className="mt-4 animate-bfIn">
              <Rule />
            </div>
          )}
        </div>

        {showPrompt && (
          <div className="w-full max-w-md animate-bfIn sm:max-w-lg">
            <p className="mb-4 text-center font-sans text-[10px] uppercase tracking-[0.26em] text-[rgba(208,192,145,0.85)] [text-shadow:0_1px_14px_rgba(0,0,0,0.95)] sm:mb-5 sm:text-[11px]">
              Where would you like to begin?
            </p>
            <div className="overflow-hidden rounded-xl border border-[rgba(175,150,95,.28)] shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
              <div className="flex min-h-[11rem] items-stretch justify-center sm:min-h-[12rem]">
                <button
                  type="button"
                  onClick={() => enterMode('sanctuary')}
                  className="flex flex-1 cursor-pointer flex-col items-center justify-center gap-3.5 border-r border-[rgba(175,150,95,.22)] bg-[rgba(20,16,8,0.35)] px-4 py-7 outline-none transition-colors hover:bg-[rgba(30,24,10,0.45)] disabled:cursor-not-allowed disabled:opacity-40 sm:px-6 sm:py-8"
                  disabled={!consented}
                >
                  <svg width="18" height="26" viewBox="0 0 18 26" aria-hidden>
                    <line x1="9" y1="1" x2="9" y2="25" stroke="#c8a870" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="1" y1="8" x2="17" y2="8" stroke="#c8a870" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <div className="text-center">
                    <div className="font-display text-[14px] tracking-[0.22em] text-[#caa870] [text-shadow:0_1px_18px_rgba(0,0,0,0.98)] sm:text-[15px]">
                      Sanctuary
                    </div>
                    <div className="mt-2 font-serif text-[10px] italic text-[#9a8048] [text-shadow:0_1px_10px_rgba(0,0,0,0.95)] sm:text-[11px]">
                      A place to remain.
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => enterMode('theophany')}
                  className="flex flex-1 cursor-pointer flex-col items-center justify-center gap-3.5 bg-[rgba(12,18,18,0.32)] px-4 py-7 outline-none transition-colors hover:bg-[rgba(16,26,26,0.48)] disabled:cursor-not-allowed disabled:opacity-40 sm:px-6 sm:py-8"
                  disabled={!consented}
                >
                  <svg width="30" height="20" viewBox="0 0 30 20" aria-hidden>
                    <path
                      d="M1 10 Q15 1 29 10 Q15 19 1 10 Z"
                      fill="none"
                      stroke="#5a9898"
                      strokeWidth="1.1"
                    />
                    <circle cx="15" cy="10" r="3.8" fill="none" stroke="#5a9898" strokeWidth="1.1" />
                    <circle cx="15" cy="10" r="1.7" fill="#5a9898" opacity="0.75" />
                  </svg>
                  <div className="text-center">
                    <div className="font-display text-[14px] tracking-[0.22em] text-[#5a9898] [text-shadow:0_1px_18px_rgba(0,0,0,0.98)] sm:text-[15px]">
                      Theophany
                    </div>
                    <div className="mt-2 font-serif text-[10px] italic text-[#408080] [text-shadow:0_1px_10px_rgba(0,0,0,0.95)] sm:text-[11px]">
                      A place to notice.
                    </div>
                  </div>
                </button>
              </div>
            </div>
            <p className="mt-4 text-center font-sans text-[9px] uppercase tracking-[0.22em] text-[rgba(175,155,105,.55)] sm:mt-5 sm:text-[10px]">
              {consented ? 'tap to enter' : 'respond to the prompt above first'}
            </p>
          </div>
        )}
      </div>

      {!consented && (
        <LocationConsentModal
          onAgree={handleAgree}
          onDecline={handleDecline}
        />
      )}
    </div>
  )
}
