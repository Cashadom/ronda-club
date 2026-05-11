'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { fetchUpcomingEventsGlobal } from '@/lib/events'

// Import dynamique de la mini carte
const MiniMap = dynamic(() => import('@/components/events/MapComponent'), {
  ssr: false,
  loading: () => <div style={{ height: '100px', background: '#f0f0f0', borderRadius: '12px' }} />
})

// ✅ MODIFICATION : Réduction des types (plus de coffee, walk, dinner)
const SOCIAL_TYPES = [
  { value: 'drinks',   label: 'Social Drinks',   emoji: '🍻' },
  { value: 'language', label: 'Language Exchange', emoji: '🗣' },
  { value: 'hangout',  label: 'Night Out',       emoji: '🎯' },
]

export default function UpcomingMeetups() {
  const [meetups, setMeetups] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadMeetups() {
      try {
        const data = await fetchUpcomingEventsGlobal(4)
        console.log('📅 [UpcomingMeetups] Events loaded:', data.length)
        
        if (data.length > 0) {
          console.log('📅 [UpcomingMeetups] First event id:', data[0]?.id)
          console.log('📅 [UpcomingMeetups] First event type of id:', typeof data[0]?.id)
          console.log('📅 [UpcomingMeetups] First event full:', data[0])
        }
        
        setMeetups(data)
      } catch (error) {
        console.error('Error loading events:', error)
      } finally {
        setLoading(false)
      }
    }
    loadMeetups()
  }, [])

  // ✅ MODIFICATION : Label adapté aux nouveaux types
  const getSocialTypeLabel = (typeValue) => {
    const found = SOCIAL_TYPES.find(t => t.value === typeValue)
    if (found) return `${found.emoji} ${found.label}`
    
    // Fallback pour les types legacy (coffee, walk, dinner) → redirigé vers Social Drinks
    if (['coffee', 'walk', 'dinner'].includes(typeValue)) {
      return `🍻 Social Drinks`
    }
    
    return typeValue || 'Social Night'
  }

  // ✅ NOUVELLE FONCTION : Générer un titre basé sur la description
  const getSocialTitle = (meetup) => {
    // Priorité à la description
    if (meetup.description && meetup.description.trim().length > 0) {
      const desc = meetup.description.trim()
      // Prendre les 6 premiers mots
      const words = desc.split(' ')
      const firstSix = words.slice(0, 6).join(' ')
      if (words.length > 6) {
        return `${firstSix}...`
      }
      return firstSix
    }
    
    // Fallback sur le meetingPoint si pas de description
    if (meetup.meetingPoint) return meetup.meetingPoint
    
    // Fallback sur le titre
    if (meetup.title) return meetup.title
    
    // Dernier fallback
    const city = meetup.city || meetup.location || ''
    const meetupType = meetup.type || 'hangout'
    const typeLabel = getSocialTypeLabel(meetupType)
    return `${typeLabel} · ${city}`
  }

  if (loading) {
    return (
      <section style={{ padding: '80px 5%', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>Loading social nights...</p>
        </div>
      </section>
    )
  }

  if (meetups.length === 0) {
    return (
      <section style={{ padding: '80px 5%', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>No social nights yet. Be the first to host one!</p>
          <Link href="/create" style={{
            display: 'inline-block',
            marginTop: 16,
            padding: '10px 24px',
            background: 'var(--coral)',
            color: '#fff',
            borderRadius: 40,
            textDecoration: 'none',
            fontWeight: 600
          }}>
            Host a social night →
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section style={{ padding: '80px 5%', background: '#fff' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <p style={{
          fontSize: '0.75rem',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          color: 'var(--coral)',
          fontWeight: 700,
          marginBottom: 12
        }}>
          Tonight & this week
        </p>

        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2rem, 4vw, 3rem)',
          fontWeight: 900,
          color: 'var(--text)',
          marginBottom: 30
        }}>
          The next social nights
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 20
        }}>
          {meetups.map(meetup => {
            const meetupType = meetup.type || meetup.category || 'hangout'
            const city = meetup.city || meetup.location || ''
            const place = meetup.location_name || ''
            const participants = meetup.participants_count ?? 0
            const limit = Number(meetup.capacity ?? meetup.capacity_max ?? 9)
            
            const rawDate = meetup.startAt || meetup.time || meetup.dateTime
            const meetupDate = rawDate?.toDate ? rawDate.toDate() : new Date(rawDate)
            const isValidDate = meetupDate instanceof Date && !isNaN(meetupDate.getTime())
            const timezone = meetup.timezone || 'UTC'
            const price = meetup.price ?? 2
            
            const hasCoordinates = meetup.coordinates?.lat && meetup.coordinates?.lng
            const mapCenter = hasCoordinates 
              ? [Number(meetup.coordinates.lat), Number(meetup.coordinates.lng)]
              : null
            
            // ✅ MODIFICATION : Texte du bouton dynamique selon le type
            const getButtonText = () => {
              if (meetupType === 'drinks') return `Join the drinks →`
              if (meetupType === 'language') return `Join the exchange →`
              return `Join the social →`
            }
            
            return (
              <Link
                key={meetup.id}
                href={`/events/${meetup.id}`}
                style={{
                  textDecoration: 'none',
                  color: 'inherit',
                  background: '#fff',
                  border: '2px solid var(--coral-border)',
                  borderRadius: 24,
                  padding: 20,
                  boxShadow: '0 4px 12px rgba(255,107,81,0.08)',
                  transition: 'all 0.25s ease',
                  display: 'block',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-6px)'
                  e.currentTarget.style.boxShadow = '0 16px 28px rgba(255,107,81,0.15)'
                  e.currentTarget.style.borderColor = 'var(--coral)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(255,107,81,0.08)'
                  e.currentTarget.style.borderColor = 'var(--coral-border)'
                }}
              >
                <div style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  borderRadius: 999,
                  background: 'var(--coral-pale)',
                  color: 'var(--coral)',
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                  marginBottom: 12
                }}>
                  {getSocialTypeLabel(meetupType)}
                </div>

                <h3 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.2rem',
                  marginBottom: 12,
                  color: 'var(--text)',
                  lineHeight: 1.3
                }}>
                  {getSocialTitle(meetup)}
                </h3>

                {mapCenter && (
                  <div style={{
                    marginBottom: 16,
                    borderRadius: 16,
                    overflow: 'hidden',
                    height: '110px',
                    border: '1px solid var(--coral-border)'
                  }}>
                    <MiniMap 
                      center={mapCenter}
                      location={meetup.meetingPoint || place || city}
                      height="110px"
                    />
                  </div>
                )}

                <p style={{ color: 'var(--text-muted)', marginBottom: 6, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>📍</span> {city}{place ? ` • ${place}` : ''}
                </p>

                <p style={{ color: 'var(--text-muted)', marginBottom: 8, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🕒</span> 
                  {isValidDate
                    ? meetupDate.toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: timezone,
                        timeZoneName: 'short',
                      })
                    : 'Date TBD'}
                </p>

                <p style={{ color: 'var(--text-muted)', marginBottom: 20, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>👥</span> {participants} / {limit} people
                </p>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: 12,
                  borderTop: '1px solid var(--coral-border)'
                }}>
                  <span style={{
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: 'var(--coral)'
                  }}>
                    ${price}
                  </span>
                  <span style={{
                    background: 'var(--coral)',
                    color: '#fff',
                    padding: '8px 20px',
                    borderRadius: 40,
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    transition: 'all 0.2s',
                    cursor: 'pointer',
                    display: 'inline-block'
                  }}>
                    {getButtonText()}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}