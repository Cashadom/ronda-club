'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { getEventType } from '@/lib/utils'
import { EVENT_STATUS } from '@/lib/events'
import { getUserProfile } from '@/lib/users'

// Import dynamique de la mini carte
const MiniMap = dynamic(() => import('@/components/events/MiniMap'), {
  ssr: false,
  loading: () => <div style={{ height: '100px', background: '#f0f0f0', borderRadius: '12px' }} />
})

const TAG_COLORS = {
  drinks:   { bg: '#FEE8E5', color: '#C43A22' },
  coffee:   { bg: '#FEF3E2', color: '#92400E' },
  walk:     { bg: '#DCFCE7', color: '#166534' },
  dinner:   { bg: '#EDE9FE', color: '#5B21B6' },
  language: { bg: '#DBEAFE', color: '#1E40AF' },
  hangout:  { bg: '#FCE7F3', color: '#9D174D' },
}

export default function EventCard({ event }) {
  const router = useRouter()
  const [host, setHost] = useState(null)

  // Normalisation des champs
  const hostId = event.hostId || event.host_id
  const joinedCount = event.participants_count ?? 0
  const limit = event.capacity_max ?? event.capacity ?? 9
  
  const type = getEventType(event.type)
  const tagClr = TAG_COLORS[event.type] || TAG_COLORS.hangout
  const isFull = joinedCount >= limit
  
  // 🔥 DATE - utiliser startAt
  const eventDate = event.startAt ? new Date(event.startAt) : null
  const isPast = eventDate && eventDate < new Date()
  
  // Formatage simple de la date
  const month = eventDate ? eventDate.toLocaleString('en-US', { month: 'short' }) : '---'
  const day = eventDate ? eventDate.toLocaleString('EN', { day: 'numeric' }) : '--'
  const year = eventDate ? eventDate.toLocaleString('en-US', { year: 'numeric' }) : '----'
  
  // Format date simple (ex: 17 Mar)
  const simpleDate = eventDate ? `${day} ${month}` : 'Date unknown'

  // Coordonnées
  const hasCoordinates = event.coordinates?.lat && event.coordinates?.lng
  const mapCenter = hasCoordinates 
    ? [Number(event.coordinates.lat), Number(event.coordinates.lng)]
    : null

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

  const spotsLeft = limit - joinedCount

  return (
    <div
      onClick={() => !isPast && router.push(`/events/${event.id}`)}
      style={{
        background: isPast ? '#f9f9f9' : '#fff',
        borderRadius: 'var(--radius-lg)',
        padding: '22px',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
        cursor: isPast ? 'default' : 'pointer',
        transition: 'all 0.22s',
        minWidth: '240px',
        position: 'relative',
      }}
      onMouseEnter={e => {
        if (!isPast) {
          e.currentTarget.style.transform = 'translateY(-4px)'
          e.currentTarget.style.boxShadow = 'var(--shadow-md)'
        }
      }}
      onMouseLeave={e => {
        if (!isPast) {
          e.currentTarget.style.transform = 'none'
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
        }
      }}
    >
      {/* 🔥 CERCLE GAUCHE AVEC IMAGE PAST (ou date) */}
      <div style={{
        position: 'absolute',
        top: '16px',
        left: '16px',
        width: 56,
        height: 56,
        borderRadius: '50%',
        background: isPast ? '#f0f0f0' : 'var(--coral-pale)',
        border: `2px solid ${isPast ? 'var(--border)' : 'var(--coral)'}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 5,
        overflow: 'hidden',
      }}>
        {!isPast ? (
          <>
            <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--coral)', textTransform: 'uppercase' }}>
              {month}
            </span>
            <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--coral)' }}>
              {day}
            </span>
          </>
        ) : (
          <Image
            src="/past.png"
            alt="Past event"
            width={56}
            height={56}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        )}
      </div>

      {/* Type tag - décalé à droite pour ne pas toucher le cercle */}
      <div style={{ marginLeft: '70px', marginBottom: '12px' }}>
        <span style={{
          display: 'inline-block',
          fontSize: '0.7rem',
          fontWeight: 700,
          letterSpacing: '0.3px',
          textTransform: 'uppercase',
          padding: '4px 10px',
          borderRadius: 'var(--radius-pill)',
          background: tagClr.bg,
          color: tagClr.color,
        }}>
          {type.emoji} {type.label}
        </span>
      </div>

      {/* Title - TITRE DE L'EVENT (pas meeting point) */}
      <div style={{ marginLeft: '70px' }}>
        <p style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: '1rem',
          color: 'var(--text)',
          marginBottom: '8px',
          lineHeight: 1.3,
        }}>
          {event.title || event.description?.substring(0, 50) || `${type.label} in ${event.city}`}
        </p>
      </div>

      {/* Hosted by */}
      {host && (
        <div style={{ marginLeft: '70px', marginBottom: '12px' }}>
          <Link
            href={`/users/${hostId}`}
            onClick={(e) => e.stopPropagation()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              textDecoration: 'none',
              fontSize: '0.7rem',
              color: 'var(--text-mid)',
            }}
          >
            <span style={{
              width: 18, height: 18, borderRadius: '50%',
              background: 'var(--coral)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '0.65rem',
              fontWeight: 700,
            }}>
              {host.name?.[0] || '👤'}
            </span>
            <span>Hosted by {host.name}</span>
          </Link>
        </div>
      )}

      {/* Description courte */}
      {event.description && !isPast && (
        <div style={{ marginLeft: '70px', marginBottom: '12px' }}>
          <p style={{
            fontSize: '0.75rem',
            color: 'var(--text-mid)',
            fontStyle: 'italic',
            margin: 0,
          }}>
            "{event.description.substring(0, 60)}..."
          </p>
        </div>
      )}

      {/* Mini carte - que pour upcoming */}
      {mapCenter && !isPast && (
        <div style={{
          marginLeft: '70px',
          marginBottom: '16px',
          borderRadius: '12px',
          overflow: 'hidden',
          border: '1px solid var(--border)',
        }}>
          <MiniMap 
            center={mapCenter}
            location={event.meetingPoint || event.location_name}
            height="100px"
          />
        </div>
      )}

      {/* Lieu et ville */}
      <div style={{ marginLeft: '70px', marginBottom: '16px' }}>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
          📍 {event.city}
        </p>
      </div>

      {/* Date simple */}
      <div style={{ marginLeft: '70px', marginBottom: '16px' }}>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
          📅 {simpleDate}
        </p>
      </div>

      {/* Footer */}
      <div style={{ marginLeft: '70px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          fontSize: '0.78rem',
          fontWeight: 600,
          color: isFull ? 'var(--text-muted)' : 'var(--coral)',
        }}>
          {isPast 
            ? `🎉 ${limit} attended` 
            : isFull 
              ? '🔴 Full' 
              : `${spotsLeft} spots left`}
        </span>
        <button
          style={{
            background: isFull || isPast ? 'var(--border)' : 'var(--coral)',
            color: isFull || isPast ? 'var(--text-muted)' : '#fff',
            border: 'none',
            padding: '8px 18px',
            borderRadius: 'var(--radius-pill)',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: isFull || isPast ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font-body)',
          }}
          onClick={e => {
            e.stopPropagation()
            if (!isFull && !isPast) router.push(`/events/${event.id}`)
          }}
        >
          {isPast ? 'Past' : isFull ? 'Full' : `Join $${event.price ?? 2}`}
        </button>
      </div>
    </div>
  )
}