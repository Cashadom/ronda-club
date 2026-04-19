'use client'
import { useState } from 'react'
import { startCheckout } from '@/lib/stripe'
import { getEventType } from '@/lib/utils'
import Button from '@/components/ui/Button'

// ─── JoinButton ────────────────────────────────────────────────────────────
export function JoinButton({ event, userId, alreadyJoined, isFull }) {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

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
        ✓ You're in
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
        Event is full
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

  return (
    <div>
      <Button onClick={handleJoin} loading={loading} style={{ width: '100%' }}>
        Reserve my spot — $2 →
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
        $2 commitment fee · Refunded if meetup cancelled · Shows you're serious
      </p>
    </div>
  )
}

// ─── HostButton ────────────────────────────────────────────────────────────
export function HostButton({ eventData, userId }) {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

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
    </div>
  )
}