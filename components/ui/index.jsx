// ─── Pill.jsx ──────────────────────────────────────────────────────────────
export function Pill({ children, color, bg, style }) {
  return (
    <span style={{
      display:       'inline-block',
      fontSize:      '0.72rem',
      fontWeight:    700,
      letterSpacing: '0.3px',
      textTransform: 'uppercase',
      padding:       '4px 10px',
      borderRadius:  'var(--radius-pill)',
      background:    bg  || 'var(--coral-pale)',
      color:         color || 'var(--coral)',
      ...style,
    }}>
      {children}
    </span>
  )
}

// ─── SectionHeader.jsx ─────────────────────────────────────────────────────
export function SectionHeader({ label, title, sub, center }) {
  return (
    <div style={{ textAlign: center ? 'center' : 'left', marginBottom: '48px' }}>
      {label && (
        <p style={{
          fontSize:      '0.72rem',
          fontWeight:    700,
          letterSpacing: '2px',
          textTransform: 'uppercase',
          color:         'var(--coral)',
          marginBottom:  '10px',
        }}>
          {label}
        </p>
      )}
      <h2 style={{
        fontFamily:  'var(--font-display)',
        fontSize:    'clamp(1.8rem, 4vw, 2.8rem)',
        fontWeight:  900,
        lineHeight:  1.1,
        color:       'var(--text)',
        marginBottom: sub ? '16px' : 0,
      }}>
        {title}
      </h2>
      {sub && (
        <p style={{
          fontSize:   '1rem',
          color:      'var(--text-muted)',
          lineHeight: 1.7,
          maxWidth:   '480px',
          margin:     center ? '0 auto' : 0,
        }}>
          {sub}
        </p>
      )}
    </div>
  )
}

// ─── Container.jsx ─────────────────────────────────────────────────────────
export function Container({ children, style, narrow }) {
  return (
    <div style={{
      maxWidth:  narrow ? '720px' : '1080px',
      margin:    '0 auto',
      padding:   '0 5%',
      width:     '100%',
      ...style,
    }}>
      {children}
    </div>
  )
}
