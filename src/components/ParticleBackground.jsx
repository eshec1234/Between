import { useEffect, useRef } from 'react'

export default function ParticleBackground() {
  const wrapRef = useRef(null)
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const particlesRef = useRef([])
  const sizeRef = useRef({ w: 0, h: 0 })

  useEffect(() => {
    const wrap = wrapRef.current
    const cvs = canvasRef.current
    if (!wrap || !cvs) return
    const ctx = cvs.getContext('2d')

    const initParticles = (w, h) => {
      if (w < 2 || h < 2) return
      particlesRef.current = Array.from({ length: 42 }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.5 + Math.random() * 2,
        speed: 0.1 + Math.random() * 0.14,
        angle: Math.random() * Math.PI * 2,
        drift: 0.002 + Math.random() * 0.004,
        op: 0.05 + Math.random() * 0.2,
        pulse: Math.random() * Math.PI * 2
      }))
    }

    const applySize = (w, h) => {
      const prev = sizeRef.current
      sizeRef.current = { w, h }
      cvs.width = w
      cvs.height = h
      if (prev.w !== w || prev.h !== h) initParticles(w, h)
    }

    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect
      if (!cr) return
      const w = Math.max(1, Math.floor(cr.width))
      const h = Math.max(1, Math.floor(cr.height))
      applySize(w, h)
    })
    ro.observe(wrap)

    const draw = () => {
      const { w, h } = sizeRef.current
      if (w < 2 || h < 2) {
        animRef.current = requestAnimationFrame(draw)
        return
      }
      const t = Date.now() * 0.001
      const particles = particlesRef.current
      ctx.clearRect(0, 0, w, h)
      const cx = w / 2
      const cy = h * 0.44
      const m = Math.min(w, h)

      ;[0.26, 0.36, 0.47, 0.58].forEach((fr, i) => {
        ctx.beginPath()
        ctx.arc(cx, cy, m * fr, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(200,175,110,${0.03 + i * 0.01})`
        ctx.lineWidth = 0.7
        ctx.stroke()
      })

      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + t * 0.04
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.lineTo(cx + Math.cos(a) * m * 0.46, cy + Math.sin(a) * m * 0.46)
        ctx.strokeStyle = 'rgba(200,170,100,0.014)'
        ctx.lineWidth = 0.5
        ctx.stroke()
      }

      particles.forEach((p) => {
        p.angle += p.drift
        p.x += Math.cos(p.angle) * p.speed
        p.y += Math.sin(p.angle) * p.speed * 0.5 - 0.05
        if (p.x < -5) p.x = w + 5
        if (p.x > w + 5) p.x = -5
        if (p.y < -5) p.y = h + 5
        if (p.y > h + 5) p.y = -5
        const g = p.op * (0.65 + 0.35 * Math.sin(t * 1.1 + p.pulse))
        const gr = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5)
        gr.addColorStop(0, `rgba(220,195,130,${g})`)
        gr.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r * 5, 0, Math.PI * 2)
        ctx.fillStyle = gr
        ctx.fill()
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(245,225,165,${Math.min(1, g * 2)})`
        ctx.fill()
      })

      const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, m * 0.46)
      cg.addColorStop(0, `rgba(200,165,80,${0.05 + 0.018 * Math.sin(t * 0.6)})`)
      cg.addColorStop(0.5, 'rgba(160,125,60,0.01)')
      cg.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.beginPath()
      ctx.arc(cx, cy, m * 0.46, 0, Math.PI * 2)
      ctx.fillStyle = cg
      ctx.fill()

      animRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      ro.disconnect()
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [])

  return (
    <div ref={wrapRef} className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <canvas ref={canvasRef} className="h-full w-full" aria-hidden />
    </div>
  )
}
