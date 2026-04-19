'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { getEventType, formatEventTime, getSpotsLeft } from '@/lib/utils'
import { EVENT_STATUS, getEventParticipants, markAttendance, CAPACITY_MIN } from '@/lib/events'
import { getUserProfile } from '@/lib/users'
import { updateTrustScore, TRUST_DELTA } from '@/lib/trust'
import { JoinButton } from './JoinButton'
import AvatarStack from './AvatarStack'
import TrustBadge from './TrustBadge'
import { getWeatherForLocation } from '@/lib/weather'

// Import dynamique de la carte pour éviter les erreurs SSR
const MapComponent = dynamic(() => import('@/components/events/MapComponent'), {
  ssr: false,
  loading: () => (
    <div style={{
      height: '200px',
      background: '#f8fafc',
      borderRadius: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '0.85rem',
      color: 'var(--text-muted)'
    }}>
      🗺️ Loading map...
    </div>
  )
})

export default function EventDetail({ event, currentUser }) {
  const [participants, setParticipants] = useState([])
  const [host, setHost]                 = useState(null)
  const [alreadyJoined, setAlreadyJoined] = useState(false)
  const [markingDone, setMarkingDone]   = useState(false)
  const [weather, setWeather]           = useState(null)
  const [weatherLoading, setWeatherLoading] = useState(false)

  // Normalisation des champs (backend → front)
  const hostId = event.hostId || event.host_id
  const joinedCount = event.participants ?? event.participants_count ?? 0
  const limit = event.participantsLimit ?? event.capacity_max ?? event.capacity ?? 0
  
  const type = getEventType(event.type)
  const isFull = joinedCount >= limit || event.status === EVENT_STATUS.FULL
  const isHost = currentUser?.uid === hostId
  const spotsLeft = getSpotsLeft({ ...event, participants: joinedCount, participantsLimit: limit })
  const confirmed = joinedCount >= CAPACITY_MIN

  // Météo
  useEffect(() => {
    async function loadWeather() {
      if (event.coordinates?.lat && event.coordinates?.lng) {
        setWeatherLoading(true)
        try {
          const weatherData = await getWeatherForLocation(event.coordinates.lat, event.coordinates.lng)
          if (weatherData) setWeather(weatherData)
        } catch (err) {
          console.error('Weather fetch failed:', err)
        } finally {
          setWeatherLoading(false)
        }
      }
    }
    loadWeather()
  }, [event.coordinates])

  // Countdown
  const [countdown, setCountdown] = useState('')
  useEffect(() => {
    const tick = () => {
      const eventTime = event.time?.toDate ? event.time.toDate() : new Date(event.time)
      const diff = eventTime - new Date()
      if (diff <= 0) { setCountdown('Happening now!'); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      setCountdown(h > 24
        ? `${Math.floor(h / 24)}d ${h % 24}h`
        : `${h}h ${m}m`)
    }
    tick()
    const t = setInterval(tick, 60000)
    return () => clearInterval(t)
  }, [event.time])

  useEffect(() => {
    async function load() {
      const parts = await getEventParticipants(event.id)
      const users = await Promise.all(
        parts.slice(0, 6).map(p => getUserProfile(p.user_id))
      )
      setParticipants(users.filter(Boolean))

      if (currentUser) {
        setAlreadyJoined(parts.some(p => p.user_id === currentUser.uid))
      }

      const hostProfile = hostId ? await getUserProfile(hostId) : null
      setHost(hostProfile)
    }
    load()
  }, [event.id, currentUser, hostId])

  async function handleMarkAttendance(userId, attended) {
    setMarkingDone(true)
    await markAttendance(event.id, userId, attended ? 'attended' : 'no_show')
    await updateTrustScore(userId, attended ? TRUST_DELTA.ATTENDED : TRUST_DELTA.NO_SHOW)
  }

  // Vérifier si on a des coordonnées pour la carte
  const hasCoordinates = event.coordinates?.lat && event.coordinates?.lng
  const mapCenter = hasCoordinates 
    ? [parseFloat(event.coordinates.lat), parseFloat(event.coordinates.lng)]
    : null

  // Debug logs
  console.log('🔍 EVENT COMPLETE:', event)
  console.log('🔍 COORDINATES RAW:', event.coordinates)
  console.log('🔍 hasCoordinates:', hasCoordinates)
  console.log('🔍 mapCenter:', mapCenter)

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '0 5%' }}>
      {/* Type + status */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '16px' }}>
        <span style={{
          fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.3px',
          textTransform: 'uppercase', padding: '4px 10px',
          borderRadius: 'var(--radius-pill)',
          background: 'var(--coral-pale)', color: 'var(--coral)',
        }}>
          {type.emoji} {type.label}
        </span>
        {confirmed && (
          <span style={{
            fontSize: '0.72rem', fontWeight: 700, padding: '4px 10px',
            borderRadius: 'var(--radius-pill)',
            background: '#DCFCE7', color: '#166534',
          }}>
            ✓ Confirmed
          </span>
        )}
        {!confirmed && (
          <span style={{
            fontSize: '0.72rem', color: 'var(--text-muted)',
            fontStyle: 'italic',
          }}>
            Needs {CAPACITY_MIN - joinedCount} more to confirm
          </span>
        )}
      </div>

      {/* Title */}
      <h1 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'clamp(1.6rem, 4vw, 2.2rem)',
        fontWeight: 900,
        color: 'var(--text)',
        marginBottom: '8px',
        lineHeight: 1.1,
      }}>
        {event.title || event.meetingPoint || event.location_name || `${type.label} in ${event.city}`}
      </h1>

      {/* Created by */}
      {host && (
        <div style={{ marginBottom: '20px' }}>
          <Link 
            href={`/users/${hostId}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              textDecoration: 'none',
              background: 'var(--bg-soft)',
              padding: '6px 14px',
              borderRadius: 'var(--radius-pill)',
              fontSize: '0.8rem',
            }}
          >
            <span style={{ fontSize: '0.9rem' }}>👤</span>
            <span style={{ color: 'var(--text-mid)' }}>Created by</span>
            <span style={{ fontWeight: 600, color: 'var(--text)' }}>{host.name}</span>
            <TrustBadge score={host.trust_score || 0} showLabel={false} />
          </Link>
        </div>
      )}

      {/* Host info */}
      {host && (
        <Link 
          href={`/users/${hostId}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '24px',
            textDecoration: 'none',
          }}
        >
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'var(--coral)',
            backgroundImage: host.photo_url ? `url(${host.photo_url})` : 'none',
            backgroundSize: 'cover',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: '0.8rem', fontWeight: 700,
          }}>
            {!host.photo_url && host.name?.[0]}
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-mid)', fontWeight: 500 }}>
              Hosted by {host.name}
            </span>
          </div>
          <TrustBadge score={host.trust_score || 0} showLabel />
        </Link>
      )}

      {/* Key info card */}
      <div style={{
        background: 'var(--bg-soft)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
        border: '1px solid var(--border)',
        marginBottom: '24px',
      }}>
        {[
          ['📍', event.location_name || event.meetingPoint || event.city],
          ['⏰', formatEventTime(event.time)],
          ['⏱', `Starts in ${countdown}`],
          ['👥', `${joinedCount} joined · ${spotsLeft}`],
          ...(weather && !weatherLoading ? [['🌡️', `${weather.temp}°C · ${weather.description}`]] : []),
          ...(weatherLoading ? [['🌡️', 'Loading weather...']] : []),
        ].map(([icon, text]) => (
          <div key={icon} style={{
            display: 'flex', gap: '12px', alignItems: 'flex-start',
            marginBottom: '12px', fontSize: '0.9rem',
          }}>
            <span>{icon}</span>
            <span style={{ color: 'var(--text-mid)' }}>{text}</span>
          </div>
        ))}

        {/* 🗺️ CARTE */}
        {mapCenter && (
          <div style={{ marginTop: '16px' }}>
            <div style={{
              borderRadius: '12px',
              overflow: 'hidden',
              border: '1px solid var(--border)'
            }}>
              <MapComponent 
                center={mapCenter}
                location={event.meetingPoint || event.location_name || event.city}
                height="200px"
              />
            </div>
            {event.meetingPoint && (
              <p style={{
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
                marginTop: '8px',
                textAlign: 'center'
              }}>
                📍 Exact meeting point: {event.meetingPoint}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Participants */}
      {participants.length > 0 && (
        <div style={{ marginBottom: '28px' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)',
            textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
            Who's coming
          </p>
          <AvatarStack users={participants} count={joinedCount} />
        </div>
      )}

      {/* Join CTA */}
      {!isHost && (
        <JoinButton
          event={event}
          userId={currentUser?.uid}
          alreadyJoined={alreadyJoined}
          isFull={isFull}
        />
      )}

      {/* Host: mark attendance */}
      {isHost && event.status === EVENT_STATUS.CONFIRMED && !markingDone && (
        <div style={{
          background: 'var(--coral-pale)',
          border: '1px solid var(--coral-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          marginTop: '24px',
        }}>
          <p style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '12px' }}>
            Mark attendance after the event
          </p>
          {participants.map(u => (
            <div key={u.id} style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', padding: '8px 0',
              borderBottom: '1px solid var(--coral-border)',
            }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-mid)' }}>{u.name}</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleMarkAttendance(u.id, true)}
                  style={{ padding: '6px 14px', borderRadius: 'var(--radius-pill)',
                    background: '#DCFCE7', color: '#166534', border: 'none',
                    fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  ✓ Attended
                </button>
                <button
                  onClick={() => handleMarkAttendance(u.id, false)}
                  style={{ padding: '6px 14px', borderRadius: 'var(--radius-pill)',
                    background: '#FEE2E2', color: '#991B1B', border: 'none',
                    fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  ✗ No-show
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Refund policy - NOUVEAU TEXTE */}
      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <p style={{
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          marginBottom: '8px',
        }}>
          💵 $2 commitment fee to reserve your spot.
        </p>
        <p style={{
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          marginBottom: '8px',
        }}>
          🔄 Refunded if the meetup is cancelled or doesn't happen.
        </p>
        <p style={{
          fontSize: '0.7rem',
          color: 'var(--text-muted)',
        }}>
          🍽️ Food and drinks are paid separately at the venue.
        </p>
      </div>
    </div>
  )
}