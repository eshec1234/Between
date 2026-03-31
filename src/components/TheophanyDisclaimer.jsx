// Tier 1 Feature #7 — rendered on every Theophany place (and Theophany home)
export default function TheophanyDisclaimer({ className = '' }) {
  return (
    <p
      className={`mt-3 border-t border-theophany-accent/35 pt-3 font-sans text-xs text-theophany-muted ${className}`.trim()}
    >
      Descriptions reflect user reports; Between does not verify supernatural claims.
    </p>
  )
}
