'use client'
import { useState } from 'react'
import { startCheckout } from '@/lib/stripe'
import { getEventType } from '@/lib/utils'
import Button from '@/components/ui/Button'

// ─── JoinButton ────────────────────────────────────────────────────────────
export function JoinButton({ event, userId, alreadyJoined, isFull }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Vérifier si l'événement est annulé
  if (event.status === 'cancelled') {
    return (
      <div style={{
        padding: '14px 28px',
        borderRadius: 'var(--radius-pill)',
        background: '#FEE2E2',
        color: '#991B1B',
        fontWeight: 600,
        fontSize: '0.95rem',
        textAlign: 'center',
      }}>
        🚫 Event cancelled
      </div>
    )
  }

  // Vérifier si l'événement est passé
  const eventDate = event.startAt ? new Date(event.startAt) : null
  const isPast = eventDate && eventDate < new Date()
  
  if (isPast) {
    return (
      <div style={{
        padding: '14px 28px',
        borderRadius: 'var(--radius-pill)',
        background: '#f0f0f0',
        color: '#666',
        fontWeight: 600,
        fontSize: '0.95rem',
        textAlign: 'center',
      }}>
        🕐 Event has passed
      </div>
    )
  }

  if (alreadyJoined) {
    return (
      <div style={{
        padding: '14px 28px',
        borderRadius: 'var(--radius-pill)',
        background: '#DCFCE7',
        color: '#166534',
        fontWeight: 600,
        fontSize: '0.95rem',
        textAlign: 'center',
      }}>
        ✓ You're in! See you there.
      </div>
    )
  }

  if (isFull) {
    return (
      <div style={{
        padding: '14px 28px',
        borderRadius: 'var(--radius-pill)',
        background: 'var(--border)',
        color: 'var(--text-muted)',
        fontWeight: 600,
        fontSize: '0.95rem',
        textAlign: 'center',
      }}>
        🔴 Event is full
      </div>
    )
  }

  async function handleJoin() {
    if (!userId) {
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const type = getEventType(event.type)
      await startCheckout({
        type: 'join',
        eventId: event.id,
        userId,
        eventData: { type: type.label },
      })
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  // Message supplémentaire selon le statut
  const getStatusMessage = () => {
    const participants = event.participants_count ?? 0
    if (participants >= 5) {
      return { text: '✓ Confirmed meetup · Join the group!', color: '#166534' }
    }
    if (participants >= 3) {
      return { text: '🎯 Small circle (3-4 people) · Join now!', color: '#92400E' }
    }
    if (participants === 2) {
      return { text: '🔥 Only 1 more spot to confirm!', color: '#C43A22' }
    }
    if (participants === 1) {
      return { text: '⭐ Be the second to join!', color: '#C43A22' }
    }
    return { text: '✨ Be the first to join!', color: '#C43A22' }
  }

  const statusMsg = getStatusMessage()

  return (
    <div>
      <Button onClick={handleJoin} loading={loading} style={{ width: '100%' }}>
        Reserve my spot — ${event.price ?? 2} →
      </Button>
      
      {error && (
        <p style={{ color: '#C43A22', fontSize: '0.82rem', marginTop: '8px', textAlign: 'center' }}>
          {error}
        </p>
      )}
      
      {/* Message de statut dynamique */}
      <p style={{
        fontSize: '0.75rem',
        color: statusMsg.color,
        textAlign: 'center',
        marginTop: '8px',
        fontWeight: 500,
      }}>
        {statusMsg.text}
      </p>
      
      {/* Politique de remboursement */}
      <p style={{
        fontSize: '0.7rem',
        color: 'var(--text-muted)',
        textAlign: 'center',
        marginTop: '4px',
      }}>
        💵 $2 commitment fee · Refunded 50% if cancelled ≥72h before
      </p>
    </div>
  )
}

// ─── HostButton ────────────────────────────────────────────────────────────
export function HostButton({ eventData, userId }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleHost() {
    if (!userId) {
      window.location.href = '/login?redirect=/create'
      return
    }
    setLoading(true)
    setError(null)
    try {
      await startCheckout({
        type: 'host',
        userId,
        eventData,
      })
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div>
      <Button onClick={handleHost} loading={loading} style={{ width: '100%' }}>
        Host this event — $2 →
      </Button>
      {error && (
        <p style={{ color: '#C43A22', fontSize: '0.82rem', marginTop: '8px', textAlign: 'center' }}>
          {error}
        </p>
      )}
      <p style={{
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
        textAlign: 'center',
        marginTop: '8px',
      }}>
        $2 host fee · Event goes live immediately after payment
      </p>
      <p style={{
        fontSize: '0.7rem',
        color: 'var(--text-muted)',
        textAlign: 'center',
        marginTop: '4px',
      }}>
        💵 Refunded 50% if cancelled ≥72h before event
      </p>
    </div>
  )
}