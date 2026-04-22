/** Sponsored-slot placeholder for a future revenue model — not a real ad network.
 *  Only renders when VITE_SHOW_AD_DEMOS=true is set in the environment.
 */
const DEMOS = [
  { title: 'Local roastery', line: 'Support spaces that host quiet hours · Demo ad' },
  { title: 'Regional trails fund', line: 'Your visit helps preserve liminal landscapes · Demo ad' },
  { title: 'Student research', line: 'Help expand the verified atlas · Demo ad' }
]

const SHOW = import.meta.env.VITE_SHOW_AD_DEMOS === 'true'

export default function MockAdSlot({ index = 0, isTheophany }) {
  if (!SHOW) return null

  const ad = DEMOS[index % DEMOS.length]
  return (
    <div
      className={`relative overflow-hidden rounded-lg border-2 border-dashed px-3 py-3 ${
        isTheophany
          ? 'border-theophany-muted/40 bg-theophany-primary/30'
          : 'border-sanctuary-muted/35 bg-black/[0.03]'
      }`}
    >
      <div
        className={`absolute right-2 top-2 rounded px-1.5 py-0.5 font-sans text-[7px] uppercase tracking-widest ${
          isTheophany ? 'bg-theophany-bg/80 text-theophany-muted' : 'bg-sanctuary-bg/90 text-sanctuary-muted'
        }`}
      >
        Sponsor demo
      </div>
      <p className={`pr-10 font-display text-sm tracking-wide ${isTheophany ? 'text-theophany-text' : 'text-sanctuary-text'}`}>
        {ad.title}
      </p>
      <p className={`mt-1 font-sans text-[10px] leading-snug ${isTheophany ? 'text-theophany-muted' : 'text-sanctuary-muted'}`}>
        {ad.line}
      </p>
    </div>
  )
}
