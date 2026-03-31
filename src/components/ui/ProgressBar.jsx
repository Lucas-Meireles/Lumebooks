export default function ProgressBar({ value = 0, className = '' }) {
  const safeValue = Math.max(0, Math.min(100, Number(value) || 0))

  return (
    <div className={`premium-progress-bar ${className}`.trim()}>
      <div
        className="premium-progress-fill"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  )
}