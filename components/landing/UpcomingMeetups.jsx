'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { fetchUpcomingEventsGlobal } from '@/lib/events'

const MiniMap = dynamic(() => import('@/components/events/MapComponent'), {
  ssr: false,
  loading: () => <div style={{ height: '100px', background: '#faf9f7', borderRadius: '20px' }} />
})

const SOCIAL_TYPES = [
  { value: 'drinks',   label: 'Social Drinks',   emoji: '🍸' },
  { value: 'language', label: 'Language Exchange', emoji: '🌍' },
  { value: 'hangout',  label: 'Night Out',       emoji: '🌙' },
]

export default function UpcomingMeetups() {
  const [meetups, setMeetups] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadMeetups() {
      try {
        const data = await fetchUpcomingEventsGlobal(4)
        setMeetups(data)
      } catch (error) {
        console.error('Failed to load events:', error)
      } finally {
        setLoading(false)
      }
    }
    loadMeetups()
  }, [])

  const getTypeLabel = (type) => {
    const found = SOCIAL_TYPES.find(t => t.value === type)
    return found || { emoji: '🍸', label: 'Social Night' }
  }

  const formatDate = (dateStr, timezone) => {
    if (!dateStr) return 'Date TBD'
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return 'Date TBD'
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: timezone || 'UTC',
      timeZoneName: 'short',
    })
  }

  if (loading) {
    return (
      <section style={{ padding: '80px 5%', background: '#faf9f7' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--coral)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
        </div>
      </section>
    )
  }

  if (meetups.length === 0) {
    return (
      <section style={{ padding: '80px 5%', background: '#faf9f7' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✨</div>
          <p style={{ color: 'var(--text-mid)' }}>No social nights scheduled yet.</p>
          <Link href="/create" style={{ display: 'inline-block', marginTop: 20, color: 'var(--coral)', fontWeight: 500, textDecoration: 'none', borderBottom: '1px solid var(--coral-border)' }}>
            Be the first to host one →
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section style={{ padding: 'clamp(60px, 10vw, 100px) 5%', background: '#faf9f7' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <p style={{
            fontSize: '0.7rem',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            color: 'var(--coral)',
            fontWeight: 500,
            marginBottom: 12
          }}>
            Join the next ones
          </p>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 4vw, 3.2rem)',
            fontWeight: 400,
            color: 'var(--text)',
            marginBottom: 12
          }}>
            Social nights,<br />close to you
          </h2>
          <div style={{ width: 50, height: 2, background: 'var(--coral)', margin: '0 auto' }} />
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 32
        }}>
          {meetups.map(meetup => {
            const typeInfo = getTypeLabel(meetup.type)
            const attendees = meetup.participants_count || 0
            const capacity = meetup.capacity || 12
            const spotsLeft = capacity - attendees
            const isUrgent = spotsLeft <= 3 && spotsLeft > 0
            const isFull = spotsLeft === 0

            return (
              <Link
                key={meetup.id}
                href={`/events/${meetup.id}`}
                style={{ textDecoration: 'none' }}
              >
                <div style={{
                  background: '#fff',
                  borderRadius: 28,
                  overflow: 'hidden',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                  border: '1px solid #f0ede9',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-6px)'
                  e.currentTarget.style.boxShadow = '0 24px 48px -12px rgba(0,0,0,0.15)'
                  e.currentTarget.style.borderColor = 'var(--coral-border)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.02)'
                  e.currentTarget.style.borderColor = '#f0ede9'
                }}>
                  
                  <div style={{ padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        color: 'var(--coral)',
                        background: 'var(--coral-pale)',
                        padding: '4px 12px',
                        borderRadius: 40,
                      }}>
                        {typeInfo.emoji} {typeInfo.label}
                      </span>
                      {isUrgent && !isFull && (
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 500,
                          color: '#E85D04',
                          background: '#FFF3E8',
                          padding: '4px 10px',
                          borderRadius: 40,
                        }}>
                          Only {spotsLeft} left
                        </span>
                      )}
                      {isFull && (
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 500,
                          color: '#6c6c6c',
                          background: '#f0f0f0',
                          padding: '4px 10px',
                          borderRadius: 40,
                        }}>
                          Full
                        </span>
                      )}
                    </div>

                    <h3 style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.3rem',
                      fontWeight: 500,
                      marginBottom: 12,
                      color: '#1a1a1a',
                      lineHeight: 1.3,
                    }}>
                      {meetup.title || meetup.meetingPoint || `${typeInfo.label} in ${meetup.city}`}
                    </h3>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: 'var(--text-mid)' }}>
                      <span style={{ fontSize: 14 }}>📍</span>
                      <span style={{ fontSize: '0.85rem' }}>{meetup.city}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, color: 'var(--text-mid)' }}>
                      <span style={{ fontSize: 14 }}>🕒</span>
                      <span style={{ fontSize: '0.85rem' }}>{formatDate(meetup.startAt, meetup.timezone)}</span>
                    </div>

                    {meetup.coordinates?.lat && meetup.coordinates?.lng && (
                      <div style={{
                        marginBottom: 16,
                        borderRadius: 20,
                        overflow: 'hidden',
                        height: 100,
                      }}>
                        <MiniMap 
                          center={[meetup.coordinates.lat, meetup.coordinates.lng]}
                          location={meetup.city}
                          height="100px"
                        />
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                      <div style={{ display: 'flex' }}>
                        {[...Array(Math.min(3, attendees))].map((_, i) => (
                          <div key={i} style={{
                            width: 28, height: 28, borderRadius: '50%',
                            background: '#e8e5e1', marginLeft: i === 0 ? 0 : -8,
                            border: '2px solid #fff',
                            backgroundImage: `url(/faces/face${String.fromCharCode(97 + i)}.png)`,
                            backgroundSize: 'cover',
                          }} />
                        ))}
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-mid)' }}>
                        {attendees} {attendees === 1 ? 'person' : 'people'} going
                      </span>
                    </div>
                  </div>

                  <div style={{
                    padding: '16px 20px',
                    borderTop: '1px solid #f0ede9',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#fff',
                  }}>
                    <span style={{
                      fontSize: '1.2rem',
                      fontWeight: 600,
                      color: 'var(--coral)',
                    }}>
                      ${meetup.price || 2}
                    </span>
                    <span style={{
                      background: 'transparent',
                      color: 'var(--coral)',
                      fontWeight: 500,
                      fontSize: '0.85rem',
                      padding: '6px 0',
                      borderBottom: '1px solid var(--coral-border)',
                    }}>
                      Join now →
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        <div style={{ textAlign: 'center', marginTop: 56 }}>
          <Link href="/events" style={{
            color: 'var(--coral)',
            fontWeight: 500,
            textDecoration: 'none',
            borderBottom: '1px solid var(--coral-border)',
            paddingBottom: 4,
          }}>
            See all upcoming nights →
          </Link>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </section>
  )
}