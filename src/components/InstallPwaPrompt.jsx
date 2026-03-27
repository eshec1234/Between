import { useEffect, useState } from 'react'

const DISMISS_KEY = 'between_pwa_install_dismissed'

export default function InstallPwaPrompt({ isTheophany }) {
  const [deferred, setDeferred] = useState(null)
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === '1')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (dismissed) return
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
    if (isStandalone) return

    const onBip = (e) => {
      e.preventDefault()
      setDeferred(e)
      setVisible(true)
    }
    window.addEventListener('beforeinstallprompt', onBip)
    return () => window.removeEventListener('beforeinstallprompt', onBip)
  }, [dismissed])

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1')
    setDismissed(true)
    setVisible(false)
  }

  const install = async () => {
    if (!deferred?.prompt) return
    await deferred.prompt()
    setDeferred(null)
    setVisible(false)
  }

  if (!visible || dismissed) return null

  return (
    <div
      className={`mx-4 mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2.5 ${
        isTheophany
          ? 'border-theophany-accent/40 bg-theophany-primary/60'
          : 'border-sanctuary-accent/40 bg-sanctuary-primary/80'
      }`}
    >
      <p className={`font-sans text-[11px] leading-snug ${isTheophany ? 'text-theophany-text' : 'text-sanctuary-text'}`}>
        <span className="font-semibold">Add Between to your home screen</span>
        <span className={`block ${isTheophany ? 'text-theophany-muted' : 'text-sanctuary-muted'}`}>
          Install the PWA for quick, anonymous access nearby.
        </span>
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={dismiss}
          className={`rounded px-2 py-1 font-sans text-[10px] uppercase tracking-wider ${
            isTheophany ? 'text-theophany-muted hover:text-theophany-text' : 'text-sanctuary-muted hover:text-sanctuary-text'
          }`}
        >
          Not now
        </button>
        <button
          type="button"
          onClick={install}
          className={`rounded px-3 py-1 font-sans text-[10px] font-semibold uppercase tracking-wider ${
            isTheophany
              ? 'bg-theophany-accent text-theophany-bg'
              : 'bg-sanctuary-accent text-sanctuary-bg'
          }`}
        >
          Install
        </button>
      </div>
    </div>
  )
}
