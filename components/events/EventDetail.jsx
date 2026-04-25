'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { getEventType } from '@/lib/utils'
import { getEventParticipants, markAttendance, CAPACITY_MIN } from '@/lib/events'
import { getUserProfile } from '@/lib/users'
import { updateTrustScore, TRUST_DELTA } from '@/lib/trust'
import { JoinButton } from './JoinButton'
import AvatarStack from './AvatarStack'
import TrustBadge from './TrustBadge'
import EditEventButton from './EditEventButton'

// Import dynamique de la carte
const MapComponent = dynamic(() => import('@/components/events/MapComponent'), {
  ssr: false,
  loading: () => <div style={{ height: '180px', background: '#f8fafc', borderRadius: '20px' }} />
})

export default function EventDetail({ event, currentUser }) {
  const [participants, setParticipants] = useState([])
  const [host, setHost] = useState(null)
  const [alreadyJoined, setAlreadyJoined] = useState(false)
  const [markingDone, setMarkingDone] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  // Normalisation des champs
  const hostId = event.hostId || event.host_id
  const joinedCount = event.participants_count ?? 0
  const limit = event.capacity_max ?? 9
  
  const eventDate = event.startAt ? new Date(event.startAt) : null
  const isValidDate = eventDate && !isNaN(eventDate.getTime())
  const isPast = isValidDate && eventDate < new Date()
  const isPaid = event.status === 'paid' || event.status === 'active' || event.status === 'confirmed'
  const isCancelled = event.status === 'cancelled'
  
  const type = getEventType(event.type)
  const isFull = joinedCount >= limit
  const isHost = currentUser?.uid === hostId
  const spotsLeft = limit - joinedCount
  const confirmed = joinedCount >= CAPACITY_MIN

  // 🔥 Vérifier si l'édition est encore possible (jusqu'à 12h avant)
  const canEdit = () => {
    if (!isValidDate) return false
    if (isPast || isCancelled) return false
    const hoursBeforeEvent = (eventDate - new Date()) / (1000 * 60 * 60)
    return hoursBeforeEvent >= 12
  }
  const isEditAllowed = canEdit()

  // Calcul du délai pour le message de remboursement
  const getRefundMessage = () => {
    if (!eventDate) return ''
    const diffInHours = (eventDate - new Date()) / (1000 * 60 * 60)
    if (diffInHours >= 72) return 'Refund: $1 (if cancelled ≥72h before)'
    return 'Refund: $0 (if cancelled <72h before)'
  }

  // Formatage date
  const formattedDate = isValidDate 
    ? eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' · ' + eventDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : 'Date TBD'

  // Badge de statut
  const getStatusBadge = () => {
    if (isCancelled) return { text: 'Cancelled', color: '#991B1B', bg: '#FEE2E2' }
    if (isPast) return { text: 'Past', color: '#666', bg: '#f0f0f0' }
    if (isFull) return { text: 'Full', color: '#991B1B', bg: '#FEE2E2' }
    if (spotsLeft <= 2) return { text: `Only ${spotsLeft} left`, color: '#92400E', bg: '#FEF3C7' }
    if (confirmed) return { text: '✓ Confirmed', color: '#166534', bg: '#DCFCE7' }
    if (joinedCount >= 3) return { text: 'Active', color: '#C43A22', bg: '#FEE8E5' }
    return null
  }
  const statusBadge = getStatusBadge()

  // Chargement participants
  useEffect(() => {
    async function load() {
      try {
        const parts = await getEventParticipants(event.id)
        const users = await Promise.all(
          parts.slice(0, 6).map(p => getUserProfile(p.user_id))
        )
        setParticipants(users.filter(Boolean))
        if (currentUser) setAlreadyJoined(parts.some(p => p.user_id === currentUser.uid))
      } catch (err) {
        console.error('Failed to load participants:', err)
      }
      
      try {
        const hostProfile = hostId ? await getUserProfile(hostId) : null
        setHost(hostProfile)
      } catch (err) {
        console.error('Failed to load host:', err)
      }
    }
    load()
  }, [event.id, currentUser, hostId])

  async function handleMarkAttendance(userId, attended) {
    setMarkingDone(true)
    await markAttendance(event.id, userId, attended ? 'attended' : 'no_show')
    await updateTrustScore(userId, attended ? TRUST_DELTA.ATTENDED : TRUST_DELTA.NO_SHOW)
  }

  async function handleCancelEvent() {
    const refundMessage = getRefundMessage()
    const confirmMessage = `Are you sure you want to cancel this event?\n\n${refundMessage}`
    
    if (!confirm(confirmMessage)) return
    
    setIsCancelling(true)
    try {
      const res = await fetch(`/api/events/${event.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser?.uid, isHost: true }),
      })
      
      const data = await res.json()
      
      if (data.success) {
        alert(data.message)
        window.location.reload()
      } else {
        alert(data.error || 'Failed to cancel event')
      }
    } catch (err) {
      console.error('Error cancelling event:', err)
      alert('Something went wrong')
    } finally {
      setIsCancelling(false)
    }
  }

  async function handleLeaveEvent() {
    const refundMessage = getRefundMessage()
    const confirmMessage = `Are you sure you want to leave this event?\n\n${refundMessage}`
    
    if (!confirm(confirmMessage)) return
    
    setIsLeaving(true)
    try {
      const res = await fetch(`/api/events/${event.id}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser?.uid }),
      })
      
      const data = await res.json()
      
      if (data.success) {
        alert(data.message)
        window.location.reload()
      } else {
        alert(data.error || 'Failed to leave event')
      }
    } catch (err) {
      console.error('Error leaving event:', err)
      alert('Something went wrong')
    } finally {
      setIsLeaving(false)
    }
  }

  const hasCoordinates = event.coordinates?.lat && event.coordinates?.lng
  const mapCenter = hasCoordinates ? [Number(event.coordinates.lat), Number(event.coordinates.lng)] : null

  // Si l'événement est annulé, afficher un message
  if (isCancelled) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        <div style={{
          background: '#fff',
          borderRadius: 28,
          border: '1px solid #FEE2E2',
          padding: '40px',
          textAlign: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>🚫</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 8 }}>Event Cancelled</h2>
          <p style={{ color: 'var(--text-mid)' }}>
            This event has been cancelled. You have been refunded if applicable.
          </p>
          <Link href="/events" style={{
            display: 'inline-block',
            marginTop: 24,
            background: 'var(--coral)',
            color: '#fff',
            padding: '10px 28px',
            borderRadius: 40,
            textDecoration: 'none',
          }}>
            Browse other events →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      
      {/* Carte principale */}
      <div style={{
        background: '#fff',
        borderRadius: 28,
        border: '1px solid var(--coral-border)',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
      }}>
        
        {/* Hero section avec badge */}
        <div style={{ padding: '28px 28px 0 28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{
              padding: '6px 14px',
              borderRadius: 40,
              background: 'var(--coral-pale)',
              color: 'var(--coral)',
              fontSize: '0.75rem',
              fontWeight: 600,
            }}>
              {type.emoji} {type.label}
            </span>
            {statusBadge && (
              <span style={{
                padding: '6px 14px',
                borderRadius: 40,
                background: statusBadge.bg,
                color: statusBadge.color,
                fontSize: '0.75rem',
                fontWeight: 600,
              }}>
                {statusBadge.text}
              </span>
            )}
          </div>
          
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.8rem',
            fontWeight: 800,
            marginBottom: 16,
            color: 'var(--text)',
            lineHeight: 1.2,
          }}>
            {event.title || event.meetingPoint || `${type.label} in ${event.city}`}
          </h1>
          
          {/* Host row */}
          {host && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: 'var(--coral)',
                backgroundImage: host.photo_url ? `url(${host.photo_url})` : 'none',
                backgroundSize: 'cover',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: '1rem', fontWeight: 600,
              }}>
                {!host.photo_url && host.name?.[0]}
              </div>
              <div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-mid)' }}>Hosted by</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontWeight: 600, color: 'var(--text)' }}>{host.name}</span>
                  <TrustBadge score={host.trust_score || 0} showLabel />
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Carte */}
        {mapCenter && (
          <div style={{ padding: '0 28px', marginBottom: 24 }}>
            <div style={{
              borderRadius: 20,
              overflow: 'hidden',
              border: '1px solid var(--coral-border)',
            }}>
              <MapComponent center={mapCenter} location={event.city} height="180px" />
            </div>
          </div>
        )}
        
        {/* Infos compactes */}
        <div style={{ padding: '0 28px' }}>
          <div style={{
            background: 'var(--coral-pale)',
            borderRadius: 20,
            padding: '20px',
            marginBottom: 24,
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-mid)', marginBottom: 4 }}>📍 Location</p>
                <p style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text)' }}>{event.city}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-mid)', marginBottom: 4 }}>📅 Date & Time</p>
                <p style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text)' }}>{formattedDate}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-mid)', marginBottom: 4 }}>👥 Capacity</p>
                <p style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text)' }}>{joinedCount} / {limit} spots</p>
              </div>
              <div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-mid)', marginBottom: 4 }}>📍 Meeting point</p>
                <p style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text)' }}>{event.meetingPoint || 'See description'}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Description */}
        {event.description && (
          <div style={{ padding: '0 28px', marginBottom: 24 }}>
            <p style={{ fontSize: '0.9rem', lineHeight: 1.5, color: 'var(--text-mid)' }}>
              {event.description}
            </p>
          </div>
        )}
        
        {/* Participants section */}
        {participants.length > 0 && (
          <div style={{ padding: '0 28px', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <AvatarStack users={participants} count={joinedCount} />
              <div>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text)' }}>
                  {joinedCount} {joinedCount === 1 ? 'person' : 'people'} going
                </p>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-mid)' }}>
                  {spotsLeft} spots left
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* CTA Section */}
        <div style={{ padding: '24px 28px 32px 28px', borderTop: '1px solid var(--coral-border)', background: '#fff' }}>
          
          {/* 🔥 HOST: Edit + Cancel buttons */}
          {isHost && !isPast && !isCancelled && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              {isEditAllowed && (
                <EditEventButton event={event} userId={currentUser?.uid} />
              )}
              <button
                onClick={handleCancelEvent}
                disabled={isCancelling}
                style={{
                  flex: 1,
                  padding: '14px 24px',
                  borderRadius: 60,
                  background: '#FEE2E2',
                  color: '#991B1B',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  border: 'none',
                  cursor: isCancelling ? 'not-allowed' : 'pointer',
                  opacity: isCancelling ? 0.6 : 1,
                }}
              >
                {isCancelling ? 'Cancelling...' : 'Cancel this event'}
              </button>
            </div>
          )}
          
          {/* PARTICIPANT: Join or Leave button */}
          {!isHost && !isPast && !isCancelled && (
            <>
              {!alreadyJoined && !isFull && isPaid && (
                <JoinButton event={event} userId={currentUser?.uid} alreadyJoined={alreadyJoined} isFull={isFull} />
              )}
              
              {alreadyJoined && (
                <>
                  <div style={{
                    padding: '14px 24px',
                    borderRadius: 60,
                    background: '#DCFCE7',
                    color: '#166534',
                    fontWeight: 600,
                    textAlign: 'center',
                    fontSize: '0.9rem',
                    marginBottom: 12,
                  }}>
                    ✓ You're in! See you there.
                  </div>
                  <button
                    onClick={handleLeaveEvent}
                    disabled={isLeaving}
                    style={{
                      width: '100%',
                      padding: '10px 24px',
                      borderRadius: 60,
                      background: '#FEE2E2',
                      color: '#991B1B',
                      fontWeight: 500,
                      fontSize: '0.85rem',
                      border: 'none',
                      cursor: isLeaving ? 'not-allowed' : 'pointer',
                      opacity: isLeaving ? 0.6 : 1,
                    }}
                  >
                    {isLeaving ? 'Leaving...' : 'Leave event'}
                  </button>
                </>
              )}
              
              {isFull && !alreadyJoined && isPaid && (
                <div style={{
                  padding: '14px 24px',
                  borderRadius: 60,
                  background: '#FEE2E2',
                  color: '#991B1B',
                  fontWeight: 600,
                  textAlign: 'center',
                  fontSize: '0.9rem',
                }}>
                  🔴 This event is full
                </div>
              )}
            </>
          )}
          
          {/* Past event message */}
          {isPast && !isCancelled && (
            <div style={{
              padding: '14px 24px',
              borderRadius: 60,
              background: '#f0f0f0',
              color: '#666',
              fontWeight: 600,
              textAlign: 'center',
              fontSize: '0.9rem',
            }}>
              🕐 This event has passed
            </div>
          )}
          
          {/* Refund policy */}
          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              💵 $2 commitment fee · Refunded 50% if cancelled ≥72h before · 0% if less
            </p>
          </div>
        </div>
      </div>
      
      {/* Mark attendance pour host (si applicable) */}
      {isHost && event.status === 'confirmed' && !markingDone && !isPast && !isCancelled && (
        <div style={{
          marginTop: 24,
          background: 'var(--coral-pale)',
          borderRadius: 20,
          padding: 20,
          border: '1px solid var(--coral-border)',
        }}>
          <p style={{ fontWeight: 600, marginBottom: 16 }}>Mark attendance after the event</p>
          {participants.map(u => (
            <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span>{u.name}</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => handleMarkAttendance(u.id, true)} style={{ padding: '6px 14px', borderRadius: 40, background: '#DCFCE7', color: '#166534', border: 'none', cursor: 'pointer' }}>✓ Attended</button>
                <button onClick={() => handleMarkAttendance(u.id, false)} style={{ padding: '6px 14px', borderRadius: 40, background: '#FEE2E2', color: '#991B1B', border: 'none', cursor: 'pointer' }}>✗ No-show</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}