import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { hasError: false, message: '' }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || 'Unknown error' }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#1a1610] text-[#f0e8d0] flex flex-col items-center justify-center p-6 text-center">
          <p className="font-serif text-lg mb-2">Something went wrong loading Between.</p>
          <p className="font-sans text-xs opacity-70 mb-6 max-w-md">{this.state.message}</p>
          <p className="font-sans text-xs uppercase tracking-wider opacity-50 mb-4">
            Try a hard refresh. If this persists, clear site data for this URL (old app cache).
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-6 py-2 border border-[#c8a870] text-[#e8c870] font-sans text-xs uppercase tracking-wider"
          >
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
