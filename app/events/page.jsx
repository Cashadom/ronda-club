'use client'
import { useState, useEffect } from 'react'
import { fetchEventsByCity } from '@/lib/events'
import { detectCity, saveCity } from '@/lib/utils'
import { onAuthChange } from '@/lib/auth'
import EventList from '@/components/events/EventList'
import { Container } from '@/components/ui/index'
import Link from 'next/link'

const EVENT_FILTERS = ['All', 'Drinks', 'Coffee', 'Walk', 'Dinner', 'Language', 'Hangout']

export default function EventsPage() {
  const [events,  setEvents]  = useState([])
  const [loading, setLoading] = useState(true)
  const [city,    setCity]    = useState('chennai')
  const [filter,  setFilter]  = useState('All')
  const [user,    setUser]    = useState(null)

  useEffect(() => {
    const unsub = onAuthChange(setUser)
    return () => unsub()
  }, [])

  useEffect(() => {
    detectCity().then(c => setCity(c))
  }, [])

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const all = await fetchEventsByCity(city)
        setEvents(all)
      } catch (err) {
        console.error('Failed to fetch events:', err)
        setEvents([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [city])

  const filtered = filter === 'All'
    ? events
    : events.filter(e => e.type === filter.toLowerCase())

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
              Tonight
            </p>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
              fontWeight: 900, color: 'var(--text)', lineHeight: 1.1 }}>
              What's happening tonight
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {/* City selector */}
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

        {/* Events grid */}
        <EventList events={filtered} loading={loading} />

        {/* Footer padding */}
        <div style={{ height: '80px' }} />
      </Container>
    </div>
  )
}
