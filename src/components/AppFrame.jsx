/** Full-viewport shell for web (no phone-frame constraints). */
export default function AppFrame({ children, className = '', contentClassName = '' }) {
  return (
    <div
      className={`flex min-h-dvh w-full flex-col overflow-hidden bg-[#1a1610] ${className}`}
    >
      <div className={`relative flex min-h-0 flex-1 flex-col ${contentClassName}`}>{children}</div>
    </div>
  )
}
