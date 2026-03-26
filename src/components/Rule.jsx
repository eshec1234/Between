export default function Rule({ accent = 'rgba(200,170,95,0.6)' }) {
  return (
    <div className="flex items-center justify-center gap-2.5">
      <div
        className="h-px w-7 bg-gradient-to-r from-transparent"
        style={{ backgroundImage: `linear-gradient(to right, transparent, ${accent})` }}
      />
      <div
        className="h-[5px] w-[5px] rounded-full border opacity-85"
        style={{ borderColor: accent }}
      />
      <div
        className="h-px w-7 bg-gradient-to-l from-transparent"
        style={{ backgroundImage: `linear-gradient(to left, transparent, ${accent})` }}
      />
    </div>
  )
}
