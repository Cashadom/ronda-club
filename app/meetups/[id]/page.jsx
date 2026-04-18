'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { fetchMeetupById } from '@/lib/meetups'
import { Container } from '@/components/ui/index'
import Link from 'next/link'

export default function MeetupDetailPage() {
  const { id } = useParams()
  const [meetup, setMeetup] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadMeetup() {
      try {
        const data = await fetchMeetupById(id)
        setMeetup(data)
      } catch (error) {
        console.error('Failed to load meetup:', error)
      } finally {
        setLoading(false)
      }
    }
    if (id) loadMeetup()
  }, [id])

  if (loading) {
    return (
      <div style={{ paddingTop: '80px', minHeight: '100vh', background: '#fff' }}>
        <Container>
          <p>Loading meetup...</p>
        </Container>
      </div>
    )
  }

  if (!meetup) {
    return (
      <div style={{ paddingTop: '80px', minHeight: '100vh', background: '#fff' }}>
        <Container>
          <p>Meetup not found.</p>
          <Link href="/">← Back to home</Link>
        </Container>
      </div>
    )
  }

  const meetupDate = meetup.time?.toDate ? meetup.time.toDate() : new Date(meetup.time)

  return (
    <div style={{ paddingTop: '80px', minHeight: '100vh', background: '#fff' }}>
      <Container>
        <Link href="/" style={{
          display: 'inline-block',
          marginBottom: 24,
          color: 'var(--coral)',
          textDecoration: 'none',
        }}>
          ← Back to home
        </Link>

        <div style={{
          background: '#fff',
          borderRadius: 24,
          border: '1px solid var(--border)',
          padding: 32,
          maxWidth: 600,
          margin: '0 auto',
        }}>
          <div style={{
            display: 'inline-block',
            padding: '6px 14px',
            borderRadius: 999,
            background: 'var(--coral-pale)',
            color: 'var(--coral)',
            fontWeight: 700,
            fontSize: '0.8rem',
            marginBottom: 16,
          }}>
            {meetup.type || 'Meetup'}
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2rem',
            marginBottom: 16,
            color: 'var(--text)',
          }}>
            {meetup.title || `${meetup.type} in ${meetup.city}`}
          </h1>

          <p style={{ marginBottom: 12, color: 'var(--text-muted)' }}>
            📍 {meetup.city} • {meetup.location_name}
          </p>

          <p style={{ marginBottom: 12, color: 'var(--text-muted)' }}>
            🕒 {meetupDate.toLocaleString()}
          </p>

          <p style={{ marginBottom: 24, color: 'var(--text-muted)' }}>
            👥 {meetup.participants_count || 0} / {meetup.capacity_max || 9} participants
          </p>

          <button style={{
            width: '100%',
            background: 'var(--coral)',
            color: '#fff',
            border: 'none',
            padding: '14px 24px',
            borderRadius: 'var(--radius-pill)',
            fontWeight: 600,
            fontSize: '1rem',
            cursor: 'pointer',
          }}>
            Join for ${meetup.price || 2}
          </button>
        </div>
      </Container>
    </div>
  )
}