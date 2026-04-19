'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getEventType, formatEventTime, getSpotsLeft } from '@/lib/utils'
import { EVENT_STATUS } from '@/lib/events'
import { getUserProfile } from '@/lib/users'

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
  const [host, setHost] = useState(null)

  // Normalisation des champs
  const hostId = event.hostId || event.host_id
  const joinedCount = event.participants ?? event.participants_count ?? 0
  const limit = event.participantsLimit ?? event.capacity ?? 0
  
  const type    = getEventType(event.type)
  const tagClr  = TAG_COLORS[event.type] || TAG_COLORS.hangout
  const spots   = getSpotsLeft(event)
  const isFull  = joinedCount >= limit || event.status === EVENT_STATUS.FULL
  const time    = formatEventTime(event.time)

  // Charger le profil de l'organisateur
  useEffect(() => {
    async function loadHost() {
      if (hostId) {
        const hostProfile = await getUserProfile(hostId)
        setHost(hostProfile)
      }
    }
    loadHost()
  }, [hostId])

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
        {event.title || event.description || `${type.label} in ${event.city}`}
      </p>

      {/* 🔥 NOUVEAU: Hosted by (lien cliquable) */}
      {host && (
        <Link
          href={`/users/${hostId}`}
          onClick={(e) => e.stopPropagation()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            textDecoration: 'none',
            marginBottom: '12px',
            fontSize: '0.7rem',
            color: 'var(--text-mid)',
          }}
        >
          <span style={{
            width: 18, height: 18, borderRadius: '50%',
            background: 'var(--coral)',
            backgroundImage: host.photo_url ? `url(${host.photo_url})` : 'none',
            backgroundSize: 'cover',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '0.65rem',
            fontWeight: 700,
          }}>
            {!host.photo_url && host.name?.[0]}
          </span>
          <span>Hosted by {host.name}</span>
        </Link>
      )}

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