'use client'
import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { fetchEventById } from '@/lib/events'
import { onAuthChange } from '@/lib/auth'
import EventDetail from '@/components/events/EventDetail'
import Link from 'next/link'

export default function EventPage() {
  const { id }        = useParams()
  const searchParams  = useSearchParams()
  const router        = useRouter()
  const [event, setEvent]   = useState(null)
  const [user,  setUser]    = useState(undefined) // undefined = loading
  const [error, setError]   = useState(null)

  const justJoined  = searchParams.get('joined')  === '1'
  const wasCancelled = searchParams.get('cancelled') === '1'

  useEffect(() => {
    const unsub = onAuthChange(u => setUser(u))
    return () => unsub()
  }, [])

  useEffect(() => {
    async function load() {
      try {
        const ev = await fetchEventById(id)
        if (!ev) { setError('Event not found'); return }
        setEvent(ev)
      } catch (err) {
        setError(err.message)
      }
    }
    if (id) load()
  }, [id])

  if (error) {
    return (
      <div style={{ paddingTop: '120px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <p style={{ marginBottom: '16px' }}>{error}</p>
        <Link href="/events" style={{ color: 'var(--coral)' }}>← Back to events</Link>
      </div>
    )
  }

  if (!event || user === undefined) {
    return (
      <div style={{ paddingTop: '120px', textAlign: 'center' }}>
        <div style={{ width: 32, height: 32, border: '3px solid var(--coral)',
          borderTopColor: 'transparent', borderRadius: '50%',
          animation: 'spin 0.7s linear infinite', margin: '0 auto' }} />
      </div>
    )
  }

  return (
    <div style={{ paddingTop: '80px', minHeight: '100vh', background: '#fff' }}>

      {/* Success banner */}
      {justJoined && (
        <div style={{
          background: '#DCFCE7', borderBottom: '1px solid #BBF7D0',
          padding: '14px 5%', textAlign: 'center',
          fontSize: '0.9rem', fontWeight: 600, color: '#166534',
        }}>
          🎉 You're in! See you there. Bring cash for your drinks.
        </div>
      )}

      {wasCancelled && (
        <div style={{
          background: '#FEF3C7', borderBottom: '1px solid #FDE68A',
          padding: '14px 5%', textAlign: 'center',
          fontSize: '0.9rem', color: '#92400E',
        }}>
          Payment cancelled. Your spot is not reserved yet.
        </div>
      )}

      {/* Back nav */}
      <div style={{ padding: '20px 5%' }}>
        <Link href="/events" style={{
          fontSize: '0.875rem', color: 'var(--text-muted)',
          textDecoration: 'none', display: 'inline-flex',
          alignItems: 'center', gap: '6px',
        }}>
          ← All events
        </Link>
      </div>

      <EventDetail event={event} currentUser={user} />

      <div style={{ height: '80px' }} />
    </div>
  )
}
