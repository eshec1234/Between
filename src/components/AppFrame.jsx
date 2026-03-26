export default function AppFrame({ children, className = '', contentClassName = '' }) {
  return (
    <div className="min-h-dvh bg-[#111110] sm:px-4 sm:py-8">
      <div
        className={`relative mx-auto flex min-h-dvh w-full max-w-[420px] flex-col overflow-hidden bg-[#1a1610] sm:min-h-[700px] sm:max-h-[min(100dvh,700px)] sm:rounded-xl sm:border sm:border-[#332a1f] sm:shadow-[0_25px_80px_rgba(0,0,0,0.5)] ${className}`}
      >
        <div className={`relative flex min-h-0 flex-1 flex-col ${contentClassName}`}>{children}</div>
      </div>
    </div>
  )
}
