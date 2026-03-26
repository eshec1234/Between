import { useMemo } from 'react'

export default function Starfield() {
  const stars = useMemo(
    () =>
      Array.from({ length: 55 }, (_, i) => ({
        cx: `${(Math.random() * 100).toFixed(1)}%`,
        cy: `${(Math.random() * 100).toFixed(1)}%`,
        r: (0.4 + Math.random() * 1.2).toFixed(1),
        dur: (2.5 + Math.random() * 4).toFixed(1),
        delay: (Math.random() * 4).toFixed(1)
      })),
    []
  )

  return (
    <svg
      className="pointer-events-none fixed inset-0 z-0 opacity-[0.42]"
      width="100%"
      height="100%"
      aria-hidden
    >
      <title>Decorative stars</title>
      {stars.map((s, i) => (
        <circle
          key={i}
          cx={s.cx}
          cy={s.cy}
          r={s.r}
          fill="#9dd4d4"
          style={{
            animation: `btwink ${s.dur}s ease-in-out infinite`,
            animationDelay: `${s.delay}s`
          }}
        />
      ))}
    </svg>
  )
}
