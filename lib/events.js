import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  runTransaction,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'

// ─── Constants ────────────────────────────────────────────────────────────
export const CAPACITY_MIN = 6
export const CAPACITY_MAX = 9

// 🔥 NOUVELLES CONSTANTES POUR LA GESTION DES ÉVÉNEMENTS
export const MIN_PARTICIPANTS_ACTIVE = 3      // Seuil pour qu'un event soit "active"
export const MIN_PARTICIPANTS_CONFIRMED = 5   // Seuil pour qu'un event soit "confirmed"
export const AUTO_CANCEL_HOURS = 6            // Heures avant l'event pour auto-cancel
export const REFUND_DEADLINE_HOURS = 72       // Délai pour remboursement 50%

export const EVENT_TYPES = [
  { value: 'drinks',   label: 'Drinks',         emoji: '🍻' },
  { value: 'coffee',   label: 'Coffee',          emoji: '☕' },
  { value: 'walk',     label: 'Walk',            emoji: '🚶' },
  { value: 'dinner',   label: 'Dinner',          emoji: '🍽' },
  { value: 'language', label: 'Language Meetup', emoji: '🗣' },
  { value: 'hangout',  label: 'Social Hangout',  emoji: '🎯' },
]

export const EVENT_STATUS = {
  PENDING: 'pending',      // En attente de paiement
  PAID: 'paid',            // Payé mais pas encore actif
  ACTIVE: 'active',        // ≥3 participants, sera maintenu
  CONFIRMED: 'confirmed',  // ≥5 participants, preuve sociale
  CANCELLED: 'cancelled',  // Annulé
  FULL: 'full',            // Complet
  COMPLETED: 'completed',  // Terminé
}

export const PARTICIPANT_STATUS = {
  JOINED: 'joined',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
}

export const REFUND_STATUS = {
  NONE: 'none',
  PARTIAL: 'partial',
  FULL: 'full',
}

// ─── Helper: calcul du statut d'un événement ─────────────────────────────
export function getEventStatus(participantsCount, startAt, now = new Date()) {
  const eventDate = new Date(startAt)
  
  if (eventDate < now) return EVENT_STATUS.COMPLETED
  
  if (participantsCount >= MIN_PARTICIPANTS_CONFIRMED) return EVENT_STATUS.CONFIRMED
  if (participantsCount >= MIN_PARTICIPANTS_ACTIVE) return EVENT_STATUS.ACTIVE
  if (participantsCount > 0) return EVENT_STATUS.ACTIVE
  
  return EVENT_STATUS.PAID
}

// ─── Helper: vérifier si un remboursement est possible ───────────────────
export function canRefund(eventDate, now = new Date()) {
  const diffInHours = (eventDate - now) / (1000 * 60 * 60)
  return diffInHours >= REFUND_DEADLINE_HOURS
}

// ─── Helper: calculer le montant du remboursement ────────────────────────
export function getRefundAmount(eventDate, now = new Date(), price = 2) {
  const diffInHours = (eventDate - now) / (1000 * 60 * 60)
  if (diffInHours >= REFUND_DEADLINE_HOURS) return Math.floor(price / 2) // 50%
  return 0
}

// ─── Helper: badge text pour l'affichage ─────────────────────────────────
export function getEventBadge(participantsCount, status, startAt) {
  const eventDate = new Date(startAt)
  const now = new Date()
  
  if (status === EVENT_STATUS.CANCELLED) return { text: 'Cancelled', color: '#991B1B', bg: '#FEE2E2' }
  if (eventDate < now) return { text: 'Completed', color: '#666', bg: '#f0f0f0' }
  
  if (participantsCount >= MIN_PARTICIPANTS_CONFIRMED) {
    return { text: '✓ Confirmed', color: '#166534', bg: '#DCFCE7' }
  }
  if (participantsCount >= MIN_PARTICIPANTS_ACTIVE) {
    return { text: 'Small circle', color: '#92400E', bg: '#FEF3C7' }
  }
  return { text: 'Starting soon', color: '#C43A22', bg: '#FEE8E5' }
}

// ─── Helper: mettre à jour le statut d'un event ──────────────────────────
export async function updateEventStatus(eventId) {
  const meetupRef = doc(db, 'meetups', eventId)
  const meetupSnap = await getDoc(meetupRef)
  
  if (!meetupSnap.exists()) return null
  
  const event = meetupSnap.data()
  const newStatus = getEventStatus(event.participants_count || 0, event.startAt)
  
  if (newStatus !== event.status) {
    await updateDoc(meetupRef, {
      status: newStatus,
      updatedAt: serverTimestamp(),
    })
    console.log(`📡 [updateEventStatus] Event ${eventId} status updated to ${newStatus}`)
  }
  
  return newStatus
}

// ─── FETCH DEPUIS meetups UNIQUEMENT ─────────────────────────────────────

export async function fetchUpcomingEventsGlobal(maxResults = 4) {
  const now = new Date()
  console.log('🔍 [fetchUpcomingEventsGlobal] Current time:', now.toISOString())
  
  const q = query(
    collection(db, 'meetups'),
    orderBy('startAt', 'asc'),
    limit(100)
  )
  
  const snapshot = await getDocs(q)
  console.log('🔍 [fetchUpcomingEventsGlobal] Total docs read:', snapshot.size)
  
  const events = snapshot.docs
    .map(doc => {
      const data = doc.data()
      // 🔥 S'assurer que startAt est une date valide
      let startAt = data.startAt || data.time || data.dateTime
      if (!startAt) return null
      
      return {
        id: doc.id,
        ...data,
        startAt: startAt,
      }
    })
    .filter(event => {
      if (!event) return false
      if (event.status === EVENT_STATUS.CANCELLED) return false
      if (!event.startAt) return false
      
      const eventDate = new Date(event.startAt)
      // 🔥 Vérifier que la date est valide et dans le futur
      if (isNaN(eventDate.getTime())) {
        console.warn(`⚠️ [fetchUpcomingEventsGlobal] Invalid date for event ${event.id}: ${event.startAt}`)
        return false
      }
      
      const isFuture = eventDate > now
      console.log(`🔍 Event ${event.id}: date=${eventDate.toISOString()}, isFuture=${isFuture}, now=${now.toISOString()}`)
      return isFuture
    })
    .slice(0, maxResults)
  
  console.log(`📡 [fetchUpcomingEventsGlobal] Returning ${events.length} events`)
  return events
}

export async function fetchPastEventsGlobal(limitCount = 10) {
  const now = new Date()
  console.log('🔍 [fetchPastEventsGlobal] Current time:', now.toISOString())
  
  const q = query(
    collection(db, 'meetups'),
    orderBy('startAt', 'desc'),
    limit(limitCount * 2)
  )
  
  const snapshot = await getDocs(q)
  console.log('🔍 [fetchPastEventsGlobal] Total docs read:', snapshot.size)
  
  const events = snapshot.docs
    .map(doc => {
      const data = doc.data()
      let startAt = data.startAt || data.time || data.dateTime
      if (!startAt) return null
      
      return {
        id: doc.id,
        ...data,
        startAt: startAt,
        display_attendees: data.capacity_max || data.capacity || CAPACITY_MAX,
      }
    })
    .filter(event => {
      if (!event) return false
      if (event.status === EVENT_STATUS.CANCELLED) return false
      if (!event.startAt) return false
      
      const eventDate = new Date(event.startAt)
      if (isNaN(eventDate.getTime())) return false
      
      return eventDate < now
    })
    .slice(0, limitCount)
  
  console.log(`📡 [fetchPastEventsGlobal] Returning ${events.length} past events`)
  return events
}

export async function fetchEventsByCity(city, maxResults = 20) {
  const now = new Date()
  
  const q = query(
    collection(db, 'meetups'),
    where('city', '==', city),
    orderBy('startAt', 'asc'),
    limit(maxResults * 3)
  )
  
  const snapshot = await getDocs(q)
  
  const cityEvents = snapshot.docs
    .map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        startAt: data.startAt || data.time || new Date().toISOString(),
      }
    })
    .filter(event => {
      if (event.status === EVENT_STATUS.CANCELLED) return false
      if (!event.startAt) return false
      const eventDate = new Date(event.startAt)
      return eventDate > now
    })
  
  if (cityEvents.length >= maxResults) {
    return cityEvents.slice(0, maxResults)
  }
  
  const globalEvents = await fetchUpcomingEventsGlobal(100)
  const cityIds = new Set(cityEvents.map(e => e.id))
  const fallbackEvents = globalEvents.filter(e => !cityIds.has(e.id))
  
  return [...cityEvents, ...fallbackEvents].slice(0, maxResults)
}

export async function fetchEventById(eventId) {
  console.log('🔍 fetchEventById - READING FROM: meetups')
  console.log('🔍 Event ID:', eventId)
  
  const meetupRef = doc(db, 'meetups', eventId)
  const meetupSnap = await getDoc(meetupRef)
  
  if (meetupSnap.exists()) {
    const data = meetupSnap.data()
    console.log('✅ FOUND IN MEETUPS!')
    return { 
      id: meetupSnap.id, 
      ...data,
      startAt: data.startAt || data.time || null,
    }
  }
  
  console.log('❌ Event not found')
  return null
}

export async function fetchAllEvents(limitCount = 50) {
  const q = query(
    collection(db, 'meetups'),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  )
  const snap = await getDocs(q)
  console.log(`📡 fetchAllEvents: ${snap.docs.length} events from meetups`)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ─── JOIN EVENT ─────────────────────────────────────────────────────────

export async function confirmPaidJoin(eventId, userId, userName, stripeSessionId, stripePaymentIntent) {
  const meetupRef = doc(db, 'meetups', eventId)

  try {
    const meetupSnap = await getDoc(meetupRef)

    if (!meetupSnap.exists()) {
      throw new Error('EVENT_NOT_FOUND')
    }

    const meetup = meetupSnap.data()
    
    if (meetup.status === EVENT_STATUS.CANCELLED) {
      throw new Error('EVENT_CANCELLED')
    }

    const meetupLimit = meetup.capacity_max || CAPACITY_MAX
    const currentParticipants = meetup.participants_count || 0

    if (currentParticipants >= meetupLimit) {
      throw new Error('EVENT_FULL')
    }

    // Vérifier doublon
    const existingQuery = query(
      collection(db, 'meetup_participants'),
      where('event_id', '==', eventId),
      where('user_id', '==', userId)
    )
    const existingSnap = await getDocs(existingQuery)
    if (!existingSnap.empty) {
      throw new Error('ALREADY_JOINED')
    }

    const newCount = currentParticipants + 1

    // Mettre à jour participants_count
    await updateDoc(meetupRef, {
      participants_count: newCount,
      updatedAt: serverTimestamp(),
    })

    // Ajouter le participant avec les infos Stripe
    await addDoc(collection(db, 'meetup_participants'), {
      user_id: userId,
      user_name: userName || 'User',
      event_id: eventId,
      status: PARTICIPANT_STATUS.JOINED,
      stripe_session_id: stripeSessionId,
      stripe_payment_intent: stripePaymentIntent,
      amount_paid: meetup.price || 2,
      currency: 'usd',
      refund_status: REFUND_STATUS.NONE,
      refund_amount: 0,
      paid_at: serverTimestamp(),
      created_at: serverTimestamp(),
    })

    // Mettre à jour le statut de l'event
    await updateEventStatus(eventId)

    console.log(`✅ confirmPaidJoin: User ${userId} joined event ${eventId}`)
    return { success: true }
  } catch (err) {
    console.error('[confirmPaidJoin] failed:', err.message)
    return { success: false, reason: err.message }
  }
}

export async function hasUserJoined(eventId, userId) {
  const q = query(
    collection(db, 'meetup_participants'),
    where('event_id', '==', eventId),
    where('user_id', '==', userId),
    where('status', '==', PARTICIPANT_STATUS.JOINED)
  )
  const snap = await getDocs(q)
  return !snap.empty
}

export async function getEventParticipants(eventId) {
  const q = query(
    collection(db, 'meetup_participants'),
    where('event_id', '==', eventId),
    where('status', '==', PARTICIPANT_STATUS.JOINED)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function getUserEvents(userId, limitCount = 10) {
  console.log('🔍 [getUserEvents] Looking for user:', userId)
  
  const q = query(
    collection(db, 'meetup_participants'),
    where('user_id', '==', userId)
  )

  const snap = await getDocs(q)
  console.log('🔍 [getUserEvents] Found participants:', snap.size)

  const sortedDocs = snap.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .sort((a, b) => {
      const dateA = a.created_at?.toDate?.() || new Date(0)
      const dateB = b.created_at?.toDate?.() || new Date(0)
      return dateB - dateA
    })
    .slice(0, limitCount)

  const events = []

  for (const participant of sortedDocs) {
    const eventRef = doc(db, 'meetups', participant.event_id)
    const eventSnap = await getDoc(eventRef)

    if (eventSnap.exists()) {
      events.push({
        ...participant,
        event: { id: eventSnap.id, ...eventSnap.data() },
      })
    }
  }

  console.log(`📡 [getUserEvents] Returning ${events.length} events`)
  return events
}

// ─── ATTENDANCE ────────────────────────────────────────────────────────────

export async function markAttendance(eventId, userId, status) {
  if (!['attended', 'no_show'].includes(status)) {
    throw new Error('Invalid status. Use "attended" or "no_show".')
  }

  const q = query(
    collection(db, 'meetup_participants'),
    where('event_id', '==', eventId),
    where('user_id', '==', userId)
  )
  const snap = await getDocs(q)
  if (snap.empty) throw new Error('Participant not found')

  await updateDoc(snap.docs[0].ref, { 
    attendance_status: status, 
    marked_at: serverTimestamp() 
  })
}

// ─── ADMIN ────────────────────────────────────────────────────────────────

export async function adminUpdateEventStatus(eventId, status) {
  await updateDoc(doc(db, 'meetups', eventId), {
    status,
    updatedAt: serverTimestamp()
  })
}

// ─── CREATE EVENT (pending_event) - DEPRECATED ───────────────────────────
export async function createPendingEvent(eventData) {
  const ref = await addDoc(collection(db, 'pending_events'), {
    hostId: eventData.hostId,
    type: eventData.type,
    city: eventData.city,
    meetingPoint: eventData.meetingPoint,
    location_name: eventData.location_name,
    venue: eventData.venue || '',
    description: eventData.description || '',
    price: eventData.price || 2,
    currency: eventData.currency || 'usd',
    capacity: eventData.capacity || 9,
    capacity_min: eventData.capacity_min || CAPACITY_MIN,
    capacity_max: eventData.capacity_max || CAPACITY_MAX,
    startAt: eventData.startAt || eventData.time,
    coordinates: eventData.coordinates || null,
    status: 'pending_payment',
    seatsTaken: 0,
    participants_count: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  console.log(`📝 createPendingEvent: Created pending event ${ref.id}`)
  return ref.id
}