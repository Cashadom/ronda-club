'use client'
import { useState, useEffect } from 'react'
import { getEventType, formatEventTime, getSpotsLeft } from '@/lib/utils'
import { EVENT_STATUS, getEventParticipants, markAttendance, CAPACITY_MIN } from '@/lib/events'
import { getUserProfile } from '@/lib/users'
import { updateTrustScore, TRUST_DELTA } from '@/lib/trust'
import { JoinButton } from './JoinButton'
import AvatarStack from './AvatarStack'
import TrustBadge from './TrustBadge'

export default function EventDetail({ event, currentUser }) {
  const [participants, setParticipants] = useState([])
  const [host, setHost]                 = useState(null)
  const [alreadyJoined, setAlreadyJoined] = useState(false)
  const [markingDone, setMarkingDone]   = useState(false)

  const type     = getEventType(event.type)
  const isFull   = event.status === EVENT_STATUS.FULL
  const isHost   = currentUser?.uid === event.host_id
  const spotsLeft = getSpotsLeft(event)
  const confirmed = event.participants_count >= CAPACITY_MIN

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
      // Fetch user profiles for avatars
      const users = await Promise.all(
        parts.slice(0, 6).map(p => getUserProfile(p.user_id))
      )
      setParticipants(users.filter(Boolean))

      if (currentUser) {
        setAlreadyJoined(parts.some(p => p.user_id === currentUser.uid))
      }

      const hostProfile = await getUserProfile(event.host_id)
      setHost(hostProfile)
    }
    load()
  }, [event.id, currentUser])

  async function handleMarkAttendance(userId, attended) {
    setMarkingDone(true)
    await markAttendance(event.id, userId, attended ? 'attended' : 'no_show')
    await updateTrustScore(userId, attended ? TRUST_DELTA.ATTENDED : TRUST_DELTA.NO_SHOW)
  }

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
            Needs {CAPACITY_MIN - event.participants_count} more to confirm
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
        {event.description || `${type.label} in ${event.city}`}
      </h1>

      {/* Host info */}
      {host && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          marginBottom: '24px',
        }}>
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
        </div>
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
          ['📍', event.location_name],
          ['⏰', formatEventTime(event.time)],
          ['⏱', `Starts in ${countdown}`],
          ['👥', `${event.participants_count} joined · ${spotsLeft}`],
        ].map(([icon, text]) => (
          <div key={icon} style={{
            display: 'flex', gap: '12px', alignItems: 'flex-start',
            marginBottom: '12px', fontSize: '0.9rem',
          }}>
            <span>{icon}</span>
            <span style={{ color: 'var(--text-mid)' }}>{text}</span>
          </div>
        ))}
      </div>

      {/* Participants */}
      {participants.length > 0 && (
        <div style={{ marginBottom: '28px' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)',
            textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
            Who's coming
          </p>
          <AvatarStack users={participants} count={event.participants_count} />
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

      {/* Reminder */}
      <p style={{
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
        textAlign: 'center',
        marginTop: '20px',
        lineHeight: 1.6,
      }}>
        🙌 Bring cash for your own drinks/food · Be on time · Be yourself
      </p>
    </div>
  )
}
