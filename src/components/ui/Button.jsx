export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  className = '',
  ...props
}) {
  const classes =
    variant === 'secondary'
      ? `secondary-button ${className}`.trim()
      : `primary-button ${className}`.trim()

  return (
    <button type={type} className={classes} {...props}>
      <span className="button-content">{children}</span>
    </button>
  )
}