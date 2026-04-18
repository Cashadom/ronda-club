'use client'

const styles = {
  base: {
    display:        'inline-flex',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            '8px',
    fontFamily:     'var(--font-body)',
    fontWeight:     600,
    fontSize:       '0.95rem',
    borderRadius:   'var(--radius-pill)',
    border:         'none',
    cursor:         'pointer',
    transition:     'all 0.2s',
    textDecoration: 'none',
    whiteSpace:     'nowrap',
  },
  primary: {
    background:  'var(--coral)',
    color:       '#fff',
    boxShadow:   'var(--coral-shadow)',
    padding:     '13px 28px',
  },
  secondary: {
    background:  '#fff',
    color:       'var(--text)',
    border:      '1.5px solid var(--border)',
    padding:     '13px 28px',
  },
  ghost: {
    background:  'transparent',
    color:       'var(--text-mid)',
    padding:     '10px 20px',
  },
  sm: { padding: '8px 18px', fontSize: '0.85rem' },
  lg: { padding: '16px 36px', fontSize: '1.05rem' },
}

export default function Button({
  children,
  variant = 'primary',
  size,
  onClick,
  disabled,
  loading,
  type = 'button',
  style,
  ...props
}) {
  const combined = {
    ...styles.base,
    ...styles[variant],
    ...(size ? styles[size] : {}),
    ...(disabled || loading ? { opacity: 0.6, cursor: 'not-allowed' } : {}),
    ...style,
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={combined}
      onMouseEnter={e => {
        if (disabled || loading) return
        if (variant === 'primary') {
          e.currentTarget.style.background = 'var(--coral-hover)'
          e.currentTarget.style.transform  = 'translateY(-2px)'
          e.currentTarget.style.boxShadow  = '0 12px 36px rgba(255,107,81,0.42)'
        } else if (variant === 'secondary') {
          e.currentTarget.style.borderColor = 'var(--coral)'
          e.currentTarget.style.color       = 'var(--coral)'
          e.currentTarget.style.transform   = 'translateY(-1px)'
        }
      }}
      onMouseLeave={e => {
        if (variant === 'primary') {
          e.currentTarget.style.background = 'var(--coral)'
          e.currentTarget.style.transform  = 'none'
          e.currentTarget.style.boxShadow  = 'var(--coral-shadow)'
        } else if (variant === 'secondary') {
          e.currentTarget.style.borderColor = 'var(--border)'
          e.currentTarget.style.color       = 'var(--text)'
          e.currentTarget.style.transform   = 'none'
        }
      }}
      {...props}
    >
      {loading ? (
        <>
          <span style={{ display: 'inline-block', width: 14, height: 14,
            border: '2px solid currentColor', borderTopColor: 'transparent',
            borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          Loading…
        </>
      ) : children}
    </button>
  )
}
