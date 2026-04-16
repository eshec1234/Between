/**
 * Three themed SVG placeholder templates to replace stock photos.
 *
 * Variants:
 *   'card'   — 4:3 ratio   (place cards on Home + ActivityFeed Latest)
 *   'hero'   — 8:3 ratio   (PlaceDetail hero banner)
 *   'square' — 1:1 ratio   (ActivityFeed trending thumbnails)
 *
 * Each variant has full Sanctuary (warm paper) and Theophany (void purple) versions.
 */

const S = {
  bg1:   '#f0e4cc',
  bg2:   '#d4b896',
  sky1:  '#e8dcc8',
  sky2:  '#c8a878',
  wall:  '#e0ccaa',
  accent:'#b8893a',
  muted: '#5c4a32',
  dark:  '#1a1208',
  glow:  'rgba(184,137,58,0.28)',
}

const T = {
  bg1:   '#0a0614',
  bg2:   '#150c28',
  sky1:  '#0e0a1c',
  sky2:  '#060210',
  wall:  '#120920',
  accent:'#a78bfa',
  muted: '#8b7aa8',
  dark:  '#060210',
  glow:  'rgba(167,139,250,0.22)',
}

/* ── Card (4 : 3 — 800 × 600) ──────────────────────────────────────────── */
function CardTemplate({ c }) {
  const uid = c === T ? 't' : 's'
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 800 600"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`bg-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c.bg1} />
          <stop offset="100%" stopColor={c.bg2} />
        </linearGradient>
        <radialGradient id={`archglow-${uid}`} cx="50%" cy="44%" r="44%">
          <stop offset="0%" stopColor={c.accent} stopOpacity="0.32" />
          <stop offset="100%" stopColor={c.accent} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`vig-${uid}`} cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor="transparent" />
          <stop offset="100%" stopColor={c.dark} stopOpacity="0.45" />
        </radialGradient>
        <filter id={`grain-${uid}`}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.75"
            numOctaves="4"
            stitchTiles="stitch"
            result="noise"
          />
          <feColorMatrix type="saturate" values="0" in="noise" result="mono" />
          <feBlend in="SourceGraphic" in2="mono" mode="overlay" result="blend" />
          <feComposite in="blend" in2="SourceGraphic" operator="in" />
        </filter>
      </defs>

      {/* Background */}
      <rect width="800" height="600" fill={`url(#bg-${uid})`} />

      {/* Grain texture */}
      <rect width="800" height="600" fill="transparent" filter={`url(#grain-${uid})`} opacity="0.12" />

      {/* Stone floor — one-point perspective lines */}
      {[-200, 0, 200, 400, 600, 800, 1000].map((x, i) => (
        <line
          key={i}
          x1={400} y1={490}
          x2={x} y2={620}
          stroke={c.muted} strokeWidth="0.7" opacity="0.18"
        />
      ))}
      {/* Horizontal floor seams */}
      {[510, 540, 570].map(y => (
        <line key={y} x1="0" y1={y} x2="800" y2={y}
          stroke={c.muted} strokeWidth="0.7" opacity="0.18" />
      ))}

      {/* Wall panels left + right of arch */}
      <rect x="0"   y="0" width="265" height="600" fill={c.wall} opacity="0.28" />
      <rect x="535" y="0" width="265" height="600" fill={c.wall} opacity="0.28" />

      {/* Decorative horizontal band (entablature) */}
      <rect x="0" y="148" width="800" height="12" fill={c.muted} opacity="0.12" />
      <rect x="0" y="155" width="800" height="3"  fill={c.accent} opacity="0.18" />

      {/* Outer arch shape */}
      <path
        d="M 265,510 L 265,295 Q 265,155 400,155 Q 535,155 535,295 L 535,510 Z"
        fill={`url(#bg-${uid})`}
        stroke={c.accent}
        strokeWidth="2"
        opacity="0.85"
      />

      {/* Atmospheric glow inside arch */}
      <path
        d="M 265,510 L 265,295 Q 265,155 400,155 Q 535,155 535,295 L 535,510 Z"
        fill={`url(#archglow-${uid})`}
      />

      {/* Inner arch molding */}
      <path
        d="M 290,510 L 290,308 Q 290,190 400,190 Q 510,190 510,308 L 510,510"
        fill="none"
        stroke={c.accent}
        strokeWidth="1"
        opacity="0.4"
      />

      {/* Keystone */}
      <polygon points="390,155 400,135 410,155" fill={c.accent} opacity="0.7" />
      <circle cx="400" cy="155" r="5" fill={c.accent} opacity="0.5" />

      {/* Sacred wheel — outer ring */}
      <circle cx="400" cy="345" r="78" fill="none" stroke={c.accent} strokeWidth="1.5" opacity="0.55" />
      {/* Middle ring */}
      <circle cx="400" cy="345" r="54" fill="none" stroke={c.accent} strokeWidth="0.9" opacity="0.38" />
      {/* Inner hub */}
      <circle cx="400" cy="345" r="14" fill="none" stroke={c.accent} strokeWidth="1.2" opacity="0.5" />
      <circle cx="400" cy="345" r="4"  fill={c.accent} opacity="0.55" />

      {/* Wheel spokes × 8 */}
      {[0, 45, 90, 135].map(deg => {
        const r = Math.PI * deg / 180
        const cos = Math.cos(r), sin = Math.sin(r)
        return (
          <g key={deg} opacity="0.38">
            <line
              x1={400 + 14 * cos} y1={345 + 14 * sin}
              x2={400 + 78 * cos} y2={345 + 78 * sin}
              stroke={c.accent} strokeWidth="0.9"
            />
            <line
              x1={400 - 14 * cos} y1={345 - 14 * sin}
              x2={400 - 78 * cos} y2={345 - 78 * sin}
              stroke={c.accent} strokeWidth="0.9"
            />
          </g>
        )
      })}

      {/* Four cardinal diamonds at rim */}
      {[0, 90, 180, 270].map(deg => {
        const r = Math.PI * deg / 180
        const cx = 400 + 78 * Math.cos(r - Math.PI / 2)
        const cy = 345 + 78 * Math.sin(r - Math.PI / 2)
        return (
          <polygon
            key={deg}
            points={`${cx},${cy - 7} ${cx + 5},${cy} ${cx},${cy + 7} ${cx - 5},${cy}`}
            fill={c.accent}
            opacity="0.5"
          />
        )
      })}

      {/* Side wall decorative lines */}
      {[220, 228].map((y, i) => (
        <g key={y}>
          <line x1="30" y1={y} x2="248" y2={y} stroke={c.muted} strokeWidth={i === 0 ? 0.8 : 0.5} opacity="0.22" />
          <line x1="552" y1={y} x2="770" y2={y} stroke={c.muted} strokeWidth={i === 0 ? 0.8 : 0.5} opacity="0.22" />
        </g>
      ))}

      {/* Vignette */}
      <rect width="800" height="600" fill={`url(#vig-${uid})`} />
    </svg>
  )
}

/* ── Hero (8 : 3 — 1600 × 600) ─────────────────────────────────────────── */
function HeroTemplate({ c }) {
  const uid = (c === T ? 't' : 's') + 'h'
  const isD = c === T
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1600 600"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`sky-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={c.bg2}  />
          <stop offset="60%"  stopColor={c.sky1} />
          <stop offset="100%" stopColor={isD ? '#1a0f2e' : '#c8a878'} />
        </linearGradient>
        <radialGradient id={`sun-${uid}`} cx="50%" cy="72%" r="38%">
          <stop offset="0%"   stopColor={c.accent} stopOpacity={isD ? 0.18 : 0.22} />
          <stop offset="100%" stopColor={c.accent} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`vig-${uid}`} cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor="transparent" />
          <stop offset="100%" stopColor={c.dark} stopOpacity="0.5" />
        </radialGradient>
        <filter id={`grain-${uid}`}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.65"
            numOctaves="3"
            stitchTiles="stitch"
            result="noise"
          />
          <feColorMatrix type="saturate" values="0" in="noise" result="mono" />
          <feBlend in="SourceGraphic" in2="mono" mode="overlay" />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
      </defs>

      {/* Sky */}
      <rect width="1600" height="600" fill={`url(#sky-${uid})`} />
      <rect width="1600" height="600" fill="transparent" filter={`url(#grain-${uid})`} opacity="0.1" />

      {/* Atmospheric glow at horizon */}
      <rect width="1600" height="600" fill={`url(#sun-${uid})`} />

      {/* Distant light rays (Sanctuary) or starfield (Theophany) */}
      {isD ? (
        /* Stars */
        Array.from({ length: 60 }, (_, i) => {
          const x = (i * 379 + 113) % 1600
          const y = (i * 251 + 47)  % 320
          const r = i % 5 === 0 ? 2 : 1
          return (
            <circle key={i} cx={x} cy={y} r={r} fill={c.accent}
              opacity={0.15 + (i % 7) * 0.08} />
          )
        })
      ) : (
        /* Light rays */
        [−15, −8, 0, 8, 15].map((angle, i) => {
          const rad = (angle * Math.PI) / 180
          return (
            <line
              key={i}
              x1={800} y1={432}
              x2={800 + 700 * Math.sin(rad)}
              y2={432 - 700 * Math.cos(rad)}
              stroke={c.accent}
              strokeWidth={i === 2 ? 60 : 30}
              opacity="0.04"
            />
          )
        })
      )}

      {/* Ground plane */}
      <rect x="0" y="430" width="1600" height="170" fill={c.dark} opacity="0.55" />

      {/* Foreground reflection on ground */}
      <rect x="0" y="430" width="1600" height="12" fill={c.accent} opacity="0.06" />

      {/* ── Sacred silhouette ── */}
      {/* Main dome */}
      <path
        d="M 700,430 A 100,155 0 0 0 900,430 Z"
        fill={c.dark} opacity="0.88"
      />
      {/* Drum below dome */}
      <rect x="710" y="410" width="180" height="22" fill={c.dark} opacity="0.9" />

      {/* Left minaret */}
      <rect x="645" y="320" width="28" height="114" fill={c.dark} opacity="0.9" />
      <polygon points="645,320 659,295 673,320" fill={c.dark} opacity="0.9" />
      <ellipse cx="659" cy="320" rx="14" ry="6" fill={c.dark} opacity="0.85" />

      {/* Right minaret */}
      <rect x="927" y="320" width="28" height="114" fill={c.dark} opacity="0.9" />
      <polygon points="927,320 941,295 955,320" fill={c.dark} opacity="0.9" />
      <ellipse cx="941" cy="320" rx="14" ry="6" fill={c.dark} opacity="0.85" />

      {/* Small secondary domes */}
      <path d="M 705,430 A 30,42 0 0 0 765,430 Z" fill={c.dark} opacity="0.82" />
      <path d="M 835,430 A 30,42 0 0 0 895,430 Z" fill={c.dark} opacity="0.82" />

      {/* Distant tree line — left side */}
      {Array.from({ length: 14 }, (_, i) => {
        const bx = 30 + i * 46
        const bh = 60 + (i * 37) % 55
        return (
          <g key={i} opacity={0.5 + (i % 3) * 0.12}>
            <rect x={bx + 10} y={430 - bh} width="6" height={bh} fill={c.dark} />
            <ellipse cx={bx + 13} cy={430 - bh} rx={14} ry={22} fill={c.dark} />
          </g>
        )
      })}

      {/* Distant tree line — right side */}
      {Array.from({ length: 14 }, (_, i) => {
        const bx = 1000 + i * 43
        const bh = 55 + (i * 53) % 60
        return (
          <g key={i} opacity={0.45 + (i % 3) * 0.12}>
            <rect x={bx + 10} y={430 - bh} width="6" height={bh} fill={c.dark} />
            <ellipse cx={bx + 13} cy={430 - bh} rx={13} ry={20} fill={c.dark} />
          </g>
        )
      })}

      {/* Ground perspective lines */}
      {[-200, 200, 600, 1000, 1400, 1800].map((x, i) => (
        <line key={i}
          x1={800} y1={432}
          x2={x}   y2={620}
          stroke={c.muted} strokeWidth="0.6" opacity="0.12"
        />
      ))}

      {/* Accent crescent on dome */}
      <circle cx="800" cy="275" r="9"  fill="none" stroke={c.accent} strokeWidth="1.5" opacity="0.6" />
      <circle cx="804" cy="272" r="7"  fill={isD ? c.bg1 : c.bg2} opacity="0.75" />

      {/* Vignette */}
      <rect width="1600" height="600" fill={`url(#vig-${uid})`} />
    </svg>
  )
}

/* ── Square (1 : 1 — 400 × 400) ────────────────────────────────────────── */
function SquareTemplate({ c }) {
  const uid = (c === T ? 't' : 's') + 'q'
  const cx = 200, cy = 200
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 400 400"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={`bg-${uid}`} cx="50%" cy="50%" r="70%">
          <stop offset="0%"   stopColor={c.bg1} />
          <stop offset="100%" stopColor={c.bg2} />
        </radialGradient>
        <radialGradient id={`glow-${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor={c.accent} stopOpacity="0.28" />
          <stop offset="100%" stopColor={c.accent} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`vig-${uid}`} cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor="transparent" />
          <stop offset="100%" stopColor={c.dark} stopOpacity="0.5" />
        </radialGradient>
        <filter id={`grain-${uid}`}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="4"
            stitchTiles="stitch"
            result="noise"
          />
          <feColorMatrix type="saturate" values="0" in="noise" result="mono" />
          <feBlend in="SourceGraphic" in2="mono" mode="overlay" />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
      </defs>

      {/* Background */}
      <rect width="400" height="400" fill={`url(#bg-${uid})`} />
      <rect width="400" height="400" fill="transparent" filter={`url(#grain-${uid})`} opacity="0.14" />

      {/* Central glow */}
      <rect width="400" height="400" fill={`url(#glow-${uid})`} />

      {/* Outer decorative square border */}
      <rect x="18" y="18" width="364" height="364"
        fill="none" stroke={c.accent} strokeWidth="0.8" opacity="0.25" />
      <rect x="24" y="24" width="352" height="352"
        fill="none" stroke={c.accent} strokeWidth="0.4" opacity="0.15" />

      {/* Corner flourishes */}
      {[[30, 30], [370, 30], [30, 370], [370, 370]].map(([x, y], i) => {
        const sx = x < 200 ? 1 : -1
        const sy = y < 200 ? 1 : -1
        return (
          <g key={i} opacity="0.38">
            <line x1={x} y1={y} x2={x + sx * 18} y2={y}   stroke={c.accent} strokeWidth="1.2" />
            <line x1={x} y1={y} x2={x}            y2={y + sy * 18} stroke={c.accent} strokeWidth="1.2" />
          </g>
        )
      })}

      {/* Outermost ring */}
      <circle cx={cx} cy={cy} r="148" fill="none" stroke={c.accent} strokeWidth="0.7" opacity="0.22" />

      {/* Eight-pointed star (two overlapping squares rotated 45°) */}
      {[0, 45].map(rot => {
        const r = (rot * Math.PI) / 180
        const pts = [0, 90, 180, 270].map(deg => {
          const a = (deg * Math.PI) / 180 + r
          return `${cx + 118 * Math.cos(a)},${cy + 118 * Math.sin(a)}`
        }).join(' ')
        return (
          <polygon key={rot}
            points={pts}
            fill="none" stroke={c.accent} strokeWidth="1" opacity="0.28"
          />
        )
      })}

      {/* Middle ring */}
      <circle cx={cx} cy={cy} r="94" fill="none" stroke={c.accent} strokeWidth="1" opacity="0.35" />

      {/* Inner eight-pointed star */}
      {[0, 45].map(rot => {
        const r = (rot * Math.PI) / 180
        const pts = [0, 90, 180, 270].map(deg => {
          const a = (deg * Math.PI) / 180 + r
          return `${cx + 68 * Math.cos(a)},${cy + 68 * Math.sin(a)}`
        }).join(' ')
        return (
          <polygon key={rot}
            points={pts}
            fill="none" stroke={c.accent} strokeWidth="1" opacity="0.3"
          />
        )
      })}

      {/* Inner ring */}
      <circle cx={cx} cy={cy} r="48" fill="none" stroke={c.accent} strokeWidth="1.2" opacity="0.4" />

      {/* Spokes × 8 */}
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i * 45 * Math.PI) / 180
        return (
          <line key={i}
            x1={cx + 16 * Math.cos(a)} y1={cy + 16 * Math.sin(a)}
            x2={cx + 94 * Math.cos(a)} y2={cy + 94 * Math.sin(a)}
            stroke={c.accent} strokeWidth="0.8" opacity="0.3"
          />
        )
      })}

      {/* Cardinal diamonds (N / E / S / W) on outer ring */}
      {[0, 90, 180, 270].map(deg => {
        const a  = (deg * Math.PI) / 180
        const px = cx + 148 * Math.cos(a - Math.PI / 2)
        const py = cy + 148 * Math.sin(a - Math.PI / 2)
        return (
          <polygon key={deg}
            points={`${px},${py - 9} ${px + 6},${py} ${px},${py + 9} ${px - 6},${py}`}
            fill={c.accent} opacity="0.55"
          />
        )
      })}

      {/* Inner intercardinal dots on middle ring */}
      {[45, 135, 225, 315].map(deg => {
        const a  = (deg * Math.PI) / 180
        const px = cx + 94 * Math.cos(a)
        const py = cy + 94 * Math.sin(a)
        return <circle key={deg} cx={px} cy={py} r="3" fill={c.accent} opacity="0.45" />
      })}

      {/* Central hub */}
      <circle cx={cx} cy={cy} r="16" fill="none" stroke={c.accent} strokeWidth="1.5" opacity="0.55" />
      <circle cx={cx} cy={cy} r="6"  fill={c.accent} opacity="0.65" />
      <circle cx={cx} cy={cy} r="2.5" fill={c.bg1}  opacity="0.9" />

      {/* Vignette */}
      <rect width="400" height="400" fill={`url(#vig-${uid})`} />
    </svg>
  )
}

/* ── Public component ───────────────────────────────────────────────────── */

/**
 * @param {object} props
 * @param {boolean} [props.isTheophany]
 * @param {'card'|'hero'|'square'} [props.variant='card']
 * @param {string} [props.className]
 */
export default function PlaceholderImage({ isTheophany, variant = 'card', className }) {
  const c = isTheophany ? T : S

  const Template =
    variant === 'hero'   ? HeroTemplate   :
    variant === 'square' ? SquareTemplate :
                           CardTemplate

  return (
    <div className={`overflow-hidden ${className || ''}`}>
      <Template c={c} />
    </div>
  )
}
