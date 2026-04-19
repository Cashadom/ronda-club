'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { fetchUpcomingEventsGlobal } from '@/lib/events'

// Définir MEETUP_TYPES directement dans le fichier pour éviter l'erreur d'import
const MEETUP_TYPES = [
  { value: 'drinks',   label: 'Drinks',         emoji: '🍻' },
  { value: 'coffee',   label: 'Coffee',          emoji: '☕' },
  { value: 'walk',     label: 'Walk',            emoji: '🚶' },
  { value: 'dinner',   label: 'Dinner',          emoji: '🍽' },
  { value: 'language', label: 'Language Meetup', emoji: '🗣' },
  { value: 'hangout',  label: 'Social Hangout',  emoji: '🎯' },
]

export default function UpcomingMeetups() {
  const [meetups, setMeetups] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadMeetups() {
      try {
        // 🔥 Récupère 4 events depuis la collection 'events'
        const data = await fetchUpcomingEventsGlobal(4)
        console.log('📅 Events loaded:', data.length) // Debug temporaire
        setMeetups(data)
      } catch (error) {
        console.error('Error loading events:', error)
      } finally {
        setLoading(false)
      }
    }
    loadMeetups()
  }, [])

  const getMeetupTypeLabel = (typeValue) => {
    const found = MEETUP_TYPES.find(t => t.value === typeValue)
    return found ? `${found.emoji} ${found.label}` : typeValue || 'Meetup'
  }

  if (loading) {
    return (
      <section style={{ padding: '80px 5%', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>Loading events...</p>
        </div>
      </section>
    )
  }

  // 🔥 Affiche un message si aucun event (au lieu de return null)
  if (meetups.length === 0) {
    return (
      <section style={{ padding: '80px 5%', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>No upcoming events yet. Be the first to create one!</p>
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
            Create an event →
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
          What's happening in the world
        </p>

        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2rem, 4vw, 3rem)',
          fontWeight: 900,
          color: 'var(--text)',
          marginBottom: 30
        }}>
          The next meetups, live now
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 20
        }}>
          {meetups.map(meetup => {
            // Normalisation des champs
            const meetupType = meetup.type || meetup.category || 'hangout'
            const city = meetup.city || meetup.location || ''
            const place = meetup.location_name || ''
            
            // Participants normalisés
            const participants = meetup.participants ?? meetup.participants_count ?? 0
            const limit = meetup.participantsLimit ?? meetup.capacity_max ?? 9
            
            // Date normalisée
            const rawDate = meetup.time || meetup.dateTime
            const meetupDate = rawDate?.toDate ? rawDate.toDate() : new Date(rawDate)
            const isValidDate = meetupDate instanceof Date && !isNaN(meetupDate.getTime())
            
            // Prix normalisé
            const price = meetup.price ?? 2
            
            return (
              <Link
                key={meetup.id}
                href={`/events/${meetup.id}`}
                style={{
                  textDecoration: 'none',
                  color: 'inherit',
                  background: '#fff',
                  border: '1px solid var(--border)',
                  borderRadius: 20,
                  padding: 20,
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
                }}
              >
                <div style={{
                  display: 'inline-block',
                  padding: '4px 10px',
                  borderRadius: 999,
                  background: 'var(--coral-pale)',
                  color: 'var(--coral)',
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                  marginBottom: 12
                }}>
                  {getMeetupTypeLabel(meetupType)}
                </div>

                <h3 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.2rem',
                  marginBottom: 8,
                  color: 'var(--text)'
                }}>
                  {meetup.title || `${meetupType} in ${city}`}
                </h3>

                <p style={{ color: 'var(--text-muted)', marginBottom: 6, fontSize: '0.9rem' }}>
                  📍 {city}{place ? ` • ${place}` : ''}
                </p>

                <p style={{ color: 'var(--text-muted)', marginBottom: 8, fontSize: '0.85rem' }}>
                  🕒 {isValidDate ? meetupDate.toLocaleString() : 'Date TBD'}
                </p>

                <p style={{ color: 'var(--text-muted)', marginBottom: 16, fontSize: '0.85rem' }}>
                  👥 {participants} / {limit} participants
                </p>

                <p style={{ fontWeight: 600, color: 'var(--coral)', fontSize: '0.9rem' }}>
                  Join ${price} →
                </p>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}