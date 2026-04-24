'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { fetchUpcomingEventsGlobal, fetchPastEventsGlobal } from '@/lib/events'
import { detectCity, saveCity } from '@/lib/utils'
import { onAuthChange } from '@/lib/auth'
import { Container } from '@/components/ui/index'
import { getUserProfile } from '@/lib/users'

const EVENT_FILTERS = ['All', 'Drinks', 'Coffee', 'Walk', 'Dinner', 'Language', 'Hangout']

// Helper pour formater la date
function formatEventDate(startAt) {
  if (!startAt) return 'Date TBD'
  const eventDate = new Date(startAt)
  if (isNaN(eventDate.getTime())) return 'Date TBD'
  
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate())
  const isToday = eventDay.getTime() === today.getTime()
  const isTomorrow = eventDay.getTime() === tomorrow.getTime()

  const timeStr = eventDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  
  if (isToday) return `Tonight · ${timeStr}`
  if (isTomorrow) return `Tomorrow · ${timeStr}`
  
  return eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' · ' + timeStr
}

// Helper pour le nombre de spots restants
function getSpotsRemainingText(participants, capacity) {
  const remaining = (capacity ?? 9) - (participants ?? 0)
  if (remaining <= 0) return 'Full'
  if (remaining === 1) return '1 spot left'
  return `${remaining} spots left`
}

// Helper pour le badge de statut
function getStatusBadge(participants, capacity, startAt) {
  const remaining = (capacity ?? 9) - (participants ?? 0)
  const eventDate = startAt ? new Date(startAt) : null
  const now = new Date()
  const isToday = eventDate && eventDate.toDateString() === now.toDateString()
  
  if (remaining <= 0) return { text: 'Full', color: '#991B1B', bg: '#FEE2E2' }
  if (isToday) return { text: 'Tonight', color: '#C43A22', bg: '#FEE8E5' }
  if (remaining <= 2) return { text: `Only ${remaining} left`, color: '#92400E', bg: '#FEF3C7' }
  return null
}

export default function EventsPage() {
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [pastEvents, setPastEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [city, setCity] = useState('chennai')
  const [filter, setFilter] = useState('All')
  const [user, setUser] = useState(null)
  const [hosts, setHosts] = useState({})
  const [participantsAvatars, setParticipantsAvatars] = useState({})

  useEffect(() => {
    const unsub = onAuthChange(setUser)
    return () => unsub()
  }, [])

  useEffect(() => {
    detectCity().then(c => setCity(c || 'chennai'))
  }, [])

  async function loadParticipantsAvatars(eventId) {
    try {
      const { getEventParticipants } = await import('@/lib/events')
      const parts = await getEventParticipants(eventId)
      const users = await Promise.all(
        parts.slice(0, 3).map(p => getUserProfile(p.user_id))
      )
      return users.filter(Boolean)
    } catch (err) {
      return []
    }
  }

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [upcoming, past] = await Promise.all([
          fetchUpcomingEventsGlobal(20),
          fetchPastEventsGlobal(10)
        ])
        setUpcomingEvents(upcoming)
        setPastEvents(past)
        
        const hostProfiles = {}
        const avatarsMap = {}
        
        for (const event of [...upcoming, ...past]) {
          const hostId = event.host_id || event.hostId
          if (hostId && !hostProfiles[hostId]) {
            const profile = await getUserProfile(hostId)
            if (profile) hostProfiles[hostId] = profile
          }
          if (event.participants_count > 0) {
            const avatars = await loadParticipantsAvatars(event.id)
            if (avatars.length) avatarsMap[event.id] = avatars
          }
        }
        setHosts(hostProfiles)
        setParticipantsAvatars(avatarsMap)
      } catch (err) {
        console.error('Failed to fetch events:', err)
        setUpcomingEvents([])
        setPastEvents([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filteredUpcoming = filter === 'All'
    ? upcomingEvents
    : upcomingEvents.filter(e => e.type === filter.toLowerCase())

  const filteredPast = filter === 'All'
    ? pastEvents
    : pastEvents.filter(e => e.type === filter.toLowerCase())

  function handleCityChange(e) {
    const c = e.target.value.toLowerCase()
    setCity(c)
    saveCity(c)
  }

  return (
    <div style={{ paddingTop: '80px', minHeight: '100vh', background: '#fff' }}>
      <Container>

        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          padding: '40px 0 28px',
          flexWrap: 'wrap',
          gap: '16px',
        }}>
          <div>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '2px',
              textTransform: 'uppercase', color: 'var(--coral)', marginBottom: '6px' }}>
              Discover
            </p>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
              fontWeight: 900, color: 'var(--text)', lineHeight: 1.1 }}>
              Upcoming meetups in {city}
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', alignItems: 'center' }}>
            <input
              value={city}
              onChange={handleCityChange}
              placeholder="City"
              style={{
                padding: '9px 14px',
                borderRadius: 'var(--radius-pill)',
                border: '1.5px solid var(--border)',
                fontFamily: 'var(--font-body)',
                fontSize: '0.875rem',
                color: 'var(--text)',
                outline: 'none',
                width: '140px',
              }}
            />
            <Link href="/create" style={{
              background: 'var(--coral)', color: '#fff',
              padding: '9px 22px', borderRadius: 'var(--radius-pill)',
              fontFamily: 'var(--font-body)', fontWeight: 600,
              fontSize: '0.875rem', textDecoration: 'none',
              boxShadow: 'var(--coral-shadow)',
            }}>
              + Host event
            </Link>
          </div>
        </div>

        {/* Filter tabs */}
        <div style={{
          display: 'flex', gap: '8px', overflowX: 'auto',
          paddingBottom: '4px', marginBottom: '28px',
          scrollbarWidth: 'none',
        }}>
          {EVENT_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '8px 18px',
                borderRadius: 'var(--radius-pill)',
                border: `1.5px solid ${filter === f ? 'var(--coral)' : 'var(--border)'}`,
                background: filter === f ? 'var(--coral-pale)' : '#fff',
                color: filter === f ? 'var(--coral)' : 'var(--text-mid)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s',
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* SECTION 1: UPCOMING EVENTS - GRID LAYOUT */}
        <section style={{ marginBottom: '60px' }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.5rem',
            fontWeight: 700,
            marginBottom: 20,
            color: 'var(--text)'
          }}>
            📅 Upcoming
          </h2>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
          ) : filteredUpcoming.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px',
              background: 'var(--coral-pale)',
              borderRadius: '24px'
            }}>
              <p>No upcoming events. Be the first to create one!</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '20px',
            }}>
              {filteredUpcoming.map(event => {
                const participantCount = event.participants_count ?? 0
                const capacity = event.capacity_max ?? 9
                const spotsLeft = capacity - participantCount
                const isFull = spotsLeft <= 0
                const statusBadge = getStatusBadge(participantCount, capacity, event.startAt)
                const host = hosts[event.host_id || event.hostId]
                const avatars = participantsAvatars[event.id] || []
                
                return (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <div style={{
                      background: '#fff',
                      borderRadius: 20,
                      padding: '18px',
                      border: '1px solid var(--border)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                      transition: 'all 0.2s',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-4px)'
                      e.currentTarget.style.boxShadow = '0 12px 20px rgba(0,0,0,0.08)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'
                    }}>
                      
                      {/* Badge + Type */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: 20,
                          background: 'var(--coral-pale)',
                          color: 'var(--coral)',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                        }}>
                          {event.type === 'walk' ? '🚶 Walk' : event.type === 'drinks' ? '🍻 Drinks' : event.type === 'coffee' ? '☕ Coffee' : event.type === 'dinner' ? '🍽 Dinner' : event.type === 'language' ? '🗣 Language' : '🎯 Hangout'}
                        </span>
                        {statusBadge && (
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: 20,
                            background: statusBadge.bg,
                            color: statusBadge.color,
                            fontSize: '0.7rem',
                            fontWeight: 600,
                          }}>
                            {statusBadge.text}
                          </span>
                        )}
                      </div>

                      {/* Titre */}
                      <h3 style={{
                        fontSize: '1rem',
                        fontWeight: 700,
                        marginBottom: 8,
                        color: 'var(--text)',
                        lineHeight: 1.3,
                      }}>
                        {event.title || event.meetingPoint || event.location_name || `${event.type} in ${event.city}`}
                      </h3>

                      {/* Host */}
                      {host && (
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-mid)', marginBottom: 12 }}>
                          👤 {host.name}
                        </p>
                      )}

                      {/* Participants avatars + count */}
                      {participantCount > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                          <div style={{ display: 'flex' }}>
                            {avatars.slice(0, 3).map((p, idx) => (
                              <div
                                key={p.id}
                                style={{
                                  width: 24, height: 24, borderRadius: '50%',
                                  background: 'var(--coral-pale)',
                                  border: '2px solid #fff',
                                  marginLeft: idx === 0 ? 0 : -8,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: '0.6rem', fontWeight: 700, color: 'var(--coral)',
                                }}
                                title={p.name}
                              >
                                {p.name?.[0] || '👤'}
                              </div>
                            ))}
                          </div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-mid)' }}>
                            {participantCount} going
                          </span>
                        </div>
                      )}

                      {/* Ville */}
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                        📍 {event.city}
                      </p>

                      {/* Date */}
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                        🕒 {formatEventDate(event.startAt)}
                      </p>

                      {/* Footer: spots left + CTA */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: 'auto',
                        paddingTop: 12,
                        borderTop: '1px solid var(--border)'
                      }}>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: isFull ? 'var(--text-muted)' : 'var(--coral)',
                        }}>
                          {isFull ? 'Full' : getSpotsRemainingText(participantCount, capacity)}
                        </span>
                        {!isFull && (
                          <span style={{
                            background: 'var(--coral)',
                            color: '#fff',
                            padding: '6px 16px',
                            borderRadius: 40,
                            fontSize: '0.75rem',
                            fontWeight: 600,
                          }}>
                            Join ${event.price ?? 2} →
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        {/* SECTION 2: PAST EVENTS */}
        {filteredPast.length > 0 && (
          <section style={{ marginTop: '40px', marginBottom: '60px' }}>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.5rem',
              fontWeight: 700,
              marginBottom: 20,
              color: 'var(--text)'
            }}>
              🕐 Moments created
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {filteredPast.map(event => {
                const eventDate = event.startAt ? new Date(event.startAt) : null
                const isValidDate = eventDate && !isNaN(eventDate.getTime())
                const maxCapacity = event.capacity_max ?? 9
                const cityName = event.city || ''
                const title = event.title || event.description?.substring(0, 50) || `${event.type} meetup`
                const type = event.type || 'meetup'
                const typeLabel = EVENT_FILTERS.find(f => f.toLowerCase() === type) || 'Meetup'
                const host = hosts[event.host_id || event.hostId]
                const month = isValidDate ? eventDate.toLocaleString('en-US', { month: 'short' }) : '---'
                const day = isValidDate ? eventDate.toLocaleString('en-US', { day: 'numeric' }) : '--'
                const simpleDate = isValidDate ? `${day} ${month}` : 'Date unknown'

                return (
                  <div
                    key={event.id}
                    style={{
                      display: 'flex',
                      gap: 20,
                      alignItems: 'center',
                      background: '#f9f9f9',
                      border: '1px solid var(--border)',
                      borderRadius: 20,
                      padding: 20,
                      cursor: 'default',
                    }}
                  >
                    <div style={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      background: '#f0f0f0',
                      border: '2px solid #ccc',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      flexShrink: 0,
                    }}>
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
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: 12,
                          background: 'var(--coral-pale)',
                          color: 'var(--coral)',
                          fontSize: '0.65rem',
                          fontWeight: 600,
                        }}>
                          {typeLabel}
                        </span>
                      </div>
                      
                      <h3 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)' }}>
                        {title}
                      </h3>
                      
                      {host && (
                        <p style={{ margin: '0 0 4px 0', color: 'var(--text-mid)', fontSize: '0.65rem' }}>
                          👤 {host.name}
                        </p>
                      )}
                      
                      {event.description && (
                        <p style={{ margin: '0 0 6px 0', color: 'var(--text-muted)', fontSize: '0.65rem', fontStyle: 'italic' }}>
                          "{event.description.substring(0, 70)}..."
                        </p>
                      )}

                      <p style={{ margin: '0 0 4px 0', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                        📍 {cityName}
                      </p>

                      <p style={{ margin: '0 0 4px 0', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                        📅 {simpleDate}
                      </p>

                      <p style={{ margin: 0, color: 'var(--coral)', fontWeight: 600, fontSize: '0.75rem' }}>
                        🎉 {maxCapacity} attended
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        <div style={{ height: '80px' }} />
      </Container>
    </div>
  )
}