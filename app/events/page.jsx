'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { fetchUpcomingEventsGlobal, fetchPastEventsGlobal } from '@/lib/events'
import { detectCity, saveCity } from '@/lib/utils'
import { onAuthChange } from '@/lib/auth'
import EventList from '@/components/events/EventList'
import { Container } from '@/components/ui/index'
import { getUserProfile } from '@/lib/users'

const EVENT_FILTERS = ['All', 'Drinks', 'Coffee', 'Walk', 'Dinner', 'Language', 'Hangout']

// Mini Map pour le Hero Event
const MiniMap = dynamic(() => import('@/components/events/MapComponent'), {
  ssr: false,
  loading: () => <div style={{ height: '120px', width: '200px', background: '#f0f0f0', borderRadius: '16px' }} />
})

// Helper pour formater la date de façon sexy
function formatEventDate(date) {
  const eventDate = date?.toDate ? date.toDate() : new Date(date)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate())

  if (eventDay.getTime() === today.getTime()) {
    return `Tonight · ${eventDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
  } else if (eventDay.getTime() === tomorrow.getTime()) {
    return `Tomorrow · ${eventDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
  }
  return eventDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + 
         ' · ' + eventDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

export default function EventsPage() {
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [pastEvents, setPastEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [city, setCity] = useState('chennai')
  const [filter, setFilter] = useState('All')
  const [user, setUser] = useState(null)
  const [hosts, setHosts] = useState({})

  useEffect(() => {
    const unsub = onAuthChange(setUser)
    return () => unsub()
  }, [])

  useEffect(() => {
    detectCity().then(c => setCity(c || 'chennai'))
  }, [])

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
        
        // Charger les profils des hôtes pour les past events
        const hostProfiles = {}
        for (const event of [...upcoming, ...past]) {
          const hostId = event.host_id || event.hostId
          if (hostId && !hostProfiles[hostId]) {
            const profile = await getUserProfile(hostId)
            if (profile) hostProfiles[hostId] = profile
          }
        }
        setHosts(hostProfiles)
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

  // Hero event = premier upcoming
  const heroEvent = filteredUpcoming[0]
  const restUpcoming = filteredUpcoming.slice(1)
  
  // Coordonnées pour la carte du hero
  const heroMapCenter = heroEvent?.coordinates?.lat && heroEvent?.coordinates?.lng
    ? [Number(heroEvent.coordinates.lat), Number(heroEvent.coordinates.lng)]
    : null

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

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
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

        {/* SECTION 1: UPCOMING EVENTS */}
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
          
          {/* HERO EVENT AVEC MAP */}
          {heroEvent && (
            <Link href={`/events/${heroEvent.id}`} style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'var(--coral-pale)',
                borderRadius: 24,
                padding: 28,
                marginBottom: 32,
                border: '1px solid var(--coral-border)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.1)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 24 }}>
                  {/* Left content */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: 20,
                        background: 'var(--coral)',
                        color: '#fff',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                      }}>⭐ Next in {heroEvent.city}</span>
                      {heroEvent.participants_count >= heroEvent.capacity_max - 2 && (
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: 20,
                          background: '#FEF3C7',
                          color: '#92400E',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                        }}>🔥 Almost full</span>
                      )}
                    </div>
                    <h2 style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.8rem',
                      fontWeight: 800,
                      marginBottom: 8,
                      color: 'var(--text)'
                    }}>
                      {heroEvent.meetingPoint || heroEvent.location_name}
                    </h2>
                    
                    {/* Host info */}
                    {hosts[heroEvent.host_id || heroEvent.hostId] && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%',
                          background: 'var(--coral)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontSize: '0.7rem', fontWeight: 700
                        }}>
                          {hosts[heroEvent.host_id || heroEvent.hostId]?.name?.[0] || '👤'}
                        </div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-mid)' }}>
                          Hosted by {hosts[heroEvent.host_id || heroEvent.hostId]?.name}
                        </span>
                      </div>
                    )}
                    
                    <p style={{ color: 'var(--text-mid)', marginBottom: 8 }}>
                      {formatEventDate(heroEvent.time)}
                    </p>
                    <p style={{ color: 'var(--text-mid)', marginBottom: 12, fontSize: '0.85rem', lineHeight: 1.5 }}>
                      {heroEvent.description?.substring(0, 100)}...
                    </p>
                    <p style={{ color: 'var(--coral)', fontWeight: 600 }}>
                      {heroEvent.participants_count} joined · {heroEvent.capacity_max - heroEvent.participants_count} spots left
                    </p>
                  </div>
                  
                  {/* Right content - MAP */}
                  {heroMapCenter && (
                    <div style={{
                      width: '200px',
                      flexShrink: 0,
                      borderRadius: 16,
                      overflow: 'hidden',
                      border: '1px solid var(--coral-border)'
                    }}>
                      <MiniMap 
                        center={heroMapCenter}
                        location={heroEvent.meetingPoint || heroEvent.location_name}
                        height="120px"
                      />
                    </div>
                  )}
                  
                  <div style={{
                    background: '#fff',
                    padding: '12px 24px',
                    borderRadius: 40,
                    fontWeight: 600,
                    color: 'var(--coral)'
                  }}>
                    Join ${heroEvent.price ?? 2} →
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* REST OF UPCOMING */}
          <EventList events={restUpcoming} loading={loading} />
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
              🕐 Past events · {filteredPast.length}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {filteredPast.map(event => {
                const rawDate = event.time || event.dateTime
                const eventDate = rawDate?.toDate ? rawDate.toDate() : new Date(rawDate)
                const isValidDate = eventDate instanceof Date && !isNaN(eventDate.getTime())
                
                const participants = event.participants_count ?? 0
                const cityName = event.city || ''
                const venueName = event.venue || event.location_name || ''
                const meetingPoint = event.meetingPoint || ''
                const type = event.type || 'meetup'
                const typeLabel = EVENT_FILTERS.find(f => f.toLowerCase() === type) || 'Meetup'
                const host = hosts[event.host_id || event.hostId]
                
                const month = isValidDate ? eventDate.toLocaleString('en-US', { month: 'short' }) : '—'
                const day = isValidDate ? eventDate.toLocaleString('en-US', { day: 'numeric' }) : '—'

                return (
                  <div
                    key={event.id}
                    style={{
                      display: 'flex',
                      gap: 20,
                      alignItems: 'center',
                      background: '#fff',
                      border: '1px solid var(--border)',
                      borderRadius: 20,
                      padding: 20,
                      cursor: 'default',
                      transition: 'all 0.2s',
                    }}
                  >
                    {/* Date circle */}
                    <div style={{
                      width: 64,
                      height: 64,
                      borderRadius: '50%',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      flexShrink: 0,
                      background: 'var(--bg-soft)'
                    }}>
                      <div style={{ fontSize: 12, color: 'var(--text-mid)', textTransform: 'uppercase' }}>{month}</div>
                      <div style={{ fontSize: 20, color: 'var(--text)' }}>{day}</div>
                    </div>

                    {/* Content */}
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
                        <span style={{
                          fontSize: '0.7rem',
                          color: 'var(--text-mid)'
                        }}>
                          {cityName}
                        </span>
                      </div>
                      
                      <h3 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>
                        {meetingPoint || venueName || `${typeLabel} meetup`}
                      </h3>
                      
                      {/* Host info for past events */}
                      {host && (
                        <p style={{ margin: '0 0 4px 0', color: 'var(--text-mid)', fontSize: '0.7rem' }}>
                          👤 Hosted by {host.name}
                        </p>
                      )}
                      
                      {/* Description for past events */}
                      {event.description && (
                        <p style={{ margin: '0 0 4px 0', color: 'var(--text-muted)', fontSize: '0.7rem', fontStyle: 'italic' }}>
                          "{event.description.substring(0, 80)}..."
                        </p>
                      )}

                      <p style={{ margin: '0 0 4px 0', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        {isValidDate ? eventDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Date unknown'}
                      </p>

                      <p style={{ margin: 0, color: 'var(--coral)', fontWeight: 600, fontSize: '0.8rem' }}>
                        👥 {participants} attended
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Footer padding */}
        <div style={{ height: '80px' }} />
      </Container>
    </div>
  )
}