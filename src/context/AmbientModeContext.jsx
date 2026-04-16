import { createContext, useContext, useMemo, useState } from 'react'
import { getHomeMode } from '../lib/betweenLocal'

const AmbientModeContext = createContext(null)

export function AmbientModeProvider({ children }) {
  const [variant, setAmbientVariant] = useState(() => getHomeMode())

  const value = useMemo(
    () => ({ variant, setAmbientVariant }),
    [variant]
  )

  return <AmbientModeContext.Provider value={value}>{children}</AmbientModeContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAmbientMode() {
  const ctx = useContext(AmbientModeContext)
  if (!ctx) {
    throw new Error('useAmbientMode must be used within AmbientModeProvider')
  }
  return ctx
}
