/**
 * Slow-moving color orbs — adds depth without fighting Starfield / content.
 */
export default function AmbientOrbs({ variant = 'sanctuary' }) {
  const isT = variant === 'theophany'
  return (
    <div
      className="pointer-events-none absolute inset-0 z-[2] overflow-hidden"
      aria-hidden="true"
    >
      <div
        className="bf-float-slow absolute -left-[20%] top-[10%] h-[min(55vw,420px)] w-[min(55vw,420px)] rounded-full blur-[80px]"
        style={{
          background: isT
            ? 'radial-gradient(circle at 30% 30%, rgba(100,200,200,0.35) 0%, transparent 70%)'
            : 'radial-gradient(circle at 30% 30%, rgba(255,200,120,0.45) 0%, transparent 70%)',
          animationDelay: '0s'
        }}
      />
      <div
        className="bf-float-slow absolute -right-[15%] top-[40%] h-[min(45vw,360px)] w-[min(45vw,360px)] rounded-full blur-[70px]"
        style={{
          background: isT
            ? 'radial-gradient(circle at 70% 50%, rgba(40,80,120,0.5) 0%, transparent 65%)'
            : 'radial-gradient(circle at 70% 50%, rgba(200,160,90,0.35) 0%, transparent 65%)',
          animationDelay: '-7s'
        }}
      />
      <div
        className="bf-float-slow absolute bottom-[5%] left-[25%] h-[min(40vw,320px)] w-[min(40vw,320px)] rounded-full blur-[90px]"
        style={{
          background: isT
            ? 'radial-gradient(circle at 50% 80%, rgba(20,60,60,0.55) 0%, transparent 68%)'
            : 'radial-gradient(circle at 50% 80%, rgba(255,235,190,0.4) 0%, transparent 68%)',
          animationDelay: '-14s'
        }}
      />
    </div>
  )
}
