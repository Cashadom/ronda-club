'use client'
import { getTrustLevel } from '@/lib/trust'

export default function TrustBadge({ score = 0, showLabel = false }) {
  const level = getTrustLevel(score)

  return (
    <span style={{
      display:     'inline-flex',
      alignItems:  'center',
      gap:         '5px',
      background:  `${level.color}18`,
      color:       level.color,
      fontWeight:  600,
      fontSize:    '0.78rem',
      padding:     '3px 10px',
      borderRadius:'var(--radius-pill)',
      border:      `1px solid ${level.color}30`,
    }}>
      ★ {score}
      {showLabel && <span style={{ opacity: 0.8 }}> · {level.label}</span>}
    </span>
  )
}
