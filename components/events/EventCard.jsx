'use client'
import { useRouter } from 'next/navigation'
import { getEventType, formatEventTime, getSpotsLeft } from '@/lib/utils'
import { EVENT_STATUS } from '@/lib/events'

const TAG_COLORS = {
  drinks:   { bg: '#FEE8E5', color: '#C43A22' },
  coffee:   { bg: '#FEF3E2', color: '#92400E' },
  walk:     { bg: '#DCFCE7', color: '#166534' },
  dinner:   { bg: '#EDE9FE', color: '#5B21B6' },
  language: { bg: '#DBEAFE', color: '#1E40AF' },
  hangout:  { bg: '#FCE7F3', color: '#9D174D' },
}

export default function EventCard({ event }) {
  const router  = useRouter()
  const type    = getEventType(event.type)
  const tagClr  = TAG_COLORS[event.type] || TAG_COLORS.hangout
  const spots   = getSpotsLeft(event)
  const isFull  = event.status === EVENT_STATUS.FULL
  const time    = formatEventTime(event.time)

  return (
    <div
      onClick={() => router.push(`/events/${event.id}`)}
      style={{
        background:   '#fff',
        borderRadius: 'var(--radius-lg)',
        padding:      '22px',
        border:       '1px solid var(--border)',
        boxShadow:    'var(--shadow-sm)',
        cursor:       'pointer',
        transition:   'all 0.22s',
        minWidth:     '240px',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform  = 'translateY(-4px)'
        e.currentTarget.style.boxShadow  = 'var(--shadow-md)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform  = 'none'
        e.currentTarget.style.boxShadow  = 'var(--shadow-sm)'
      }}
    >
      {/* Type tag */}
      <span style={{
        display:       'inline-block',
        fontSize:      '0.7rem',
        fontWeight:    700,
        letterSpacing: '0.3px',
        textTransform: 'uppercase',
        padding:       '4px 10px',
        borderRadius:  'var(--radius-pill)',
        background:    tagClr.bg,
        color:         tagClr.color,
        marginBottom:  '12px',
      }}>
        {type.emoji} {type.label}
      </span>

      {/* Title */}
      <p style={{
        fontFamily:   'var(--font-display)',
        fontWeight:   700,
        fontSize:     '1rem',
        color:        'var(--text)',
        marginBottom: '8px',
        lineHeight:   1.3,
      }}>
        {event.description || `${type.label} in ${event.city}`}
      </p>

      {/* Meta */}
      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '16px' }}>
        📍 {event.location_name}<br />
        ⏰ {time}
      </p>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          fontSize:   '0.78rem',
          fontWeight: 600,
          color:      isFull ? 'var(--text-muted)' : 'var(--coral)',
        }}>
          {isFull ? '🔴 Full' : `${spots}`}
        </span>
        <button
          style={{
            background:   isFull ? 'var(--border)' : 'var(--coral)',
            color:        isFull ? 'var(--text-muted)' : '#fff',
            border:       'none',
            padding:      '8px 18px',
            borderRadius: 'var(--radius-pill)',
            fontSize:     '0.8rem',
            fontWeight:   600,
            cursor:       isFull ? 'not-allowed' : 'pointer',
            fontFamily:   'var(--font-body)',
          }}
          onClick={e => {
            e.stopPropagation()
            if (!isFull) router.push(`/events/${event.id}`)
          }}
        >
          {isFull ? 'Full' : 'Join $2'}
        </button>
      </div>
    </div>
  )
}
