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

export const EVENT_TYPES = [
  { value: 'drinks',   label: 'Drinks',         emoji: '🍻' },
  { value: 'coffee',   label: 'Coffee',          emoji: '☕' },
  { value: 'walk',     label: 'Walk',            emoji: '🚶' },
  { value: 'dinner',   label: 'Dinner',          emoji: '🍽' },
  { value: 'language', label: 'Language Meetup', emoji: '🗣' },
  { value: 'hangout',  label: 'Social Hangout',  emoji: '🎯' },
]

export const EVENT_STATUS = {
  OPEN:      'open',
  CONFIRMED: 'confirmed',
  FULL:      'full',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
}

// ─── Helper: convert string date to Timestamp ────────────────────────────
function parseDateTimeToTimestamp(dateTimeStr) {
  if (!dateTimeStr) return null
  try {
    return Timestamp.fromDate(new Date(dateTimeStr))
  } catch (e) {
    console.error('Invalid date:', dateTimeStr)
    return null
  }
}

// ─── FETCH DEPUIS meetups UNIQUEMENT ─────────────────────────────────────

/**
 * 🔥 Récupérer les événements à venir (depuis meetups)
 */
export async function fetchUpcomingEventsGlobal(maxResults = 4) {
  const now = new Date()
  console.log('🔍 [fetchUpcomingEventsGlobal] Current time:', now.toISOString())
  
  const q = query(
    collection(db, 'meetups'),
    where('status', '==', 'open'),
    orderBy('time', 'asc'),
    limit(100)
  )
  
  const snapshot = await getDocs(q)
  console.log('🔍 [fetchUpcomingEventsGlobal] Total docs in meetups with status=open:', snapshot.size)
  
  snapshot.docs.forEach(doc => {
    const data = doc.data()
    const eventDate = data.time?.toDate ? data.time.toDate() : new Date(data.time)
    console.log(`🔍 [fetchUpcomingEventsGlobal] Event: ${doc.id}`, {
      status: data.status,
      time: eventDate.toISOString(),
      timeType: data.time?.toDate ? 'Timestamp' : typeof data.time,
      isFuture: eventDate > now,
      city: data.city,
    })
  })
  
  const events = snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(event => {
      const eventDate = event.time?.toDate?.() || new Date(event.time)
      return eventDate > now
    })
    .slice(0, maxResults)
  
  console.log(`📡 [fetchUpcomingEventsGlobal] Returning ${events.length} events from meetups`)
  return events
}

/**
 * 🔥 Récupérer les événements passés (depuis meetups) - CORRIGÉ sans 'in'
 */
export async function fetchPastEventsGlobal(limitCount = 10) {
  const now = new Date()
  console.log('🔍 [fetchPastEventsGlobal] Current time:', now.toISOString())
  
  // 🔥 Requête simplifiée : pas de where('status', 'in', [...])
  // On trie par time descendant et on filtre côté JavaScript
  const q = query(
    collection(db, 'meetups'),
    orderBy('time', 'desc'),
    limit(limitCount * 2) // On prend plus pour compenser le filtre
  )
  
  const snapshot = await getDocs(q)
  console.log('🔍 [fetchPastEventsGlobal] Total docs read:', snapshot.size)
  
  const events = snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(event => {
      const eventDate = event.time?.toDate?.() || new Date(event.time)
      // Garde seulement les événements PASSÉS
      return eventDate < now
    })
    .slice(0, limitCount)
  
  console.log(`📡 [fetchPastEventsGlobal] Returning ${events.length} past events from meetups`)
  return events
}

/**
 * 🔥 Récupérer les événements par ville (depuis meetups)
 */
export async function fetchEventsByCity(city, maxResults = 20) {
  const now = new Date()
  
  const q = query(
    collection(db, 'meetups'),
    where('city', '==', city),
    where('status', '==', 'open'),
    orderBy('time', 'asc'),
    limit(maxResults * 3)
  )
  
  const snapshot = await getDocs(q)
  
  const cityEvents = snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(event => {
      const eventDate = event.time?.toDate?.() || new Date(event.time)
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

/**
 * 🔥 Récupérer un événement par ID (depuis meetups)
 */
export async function fetchEventById(eventId) {
  console.log('🔍 fetchEventById - READING FROM: meetups')
  console.log('🔍 Event ID:', eventId)
  
  const meetupRef = doc(db, 'meetups', eventId)
  const meetupSnap = await getDoc(meetupRef)
  
  if (meetupSnap.exists()) {
    const data = meetupSnap.data()
    console.log('✅ FOUND IN MEETUPS!')
    return { id: meetupSnap.id, ...data }
  }
  
  console.log('⚠️ NOT FOUND in meetups, checking old "events" collection...')
  const oldEventRef = doc(db, 'events', eventId)
  const oldEventSnap = await getDoc(oldEventRef)
  
  if (oldEventSnap.exists()) {
    console.warn('🚨 WARNING: Event found in OLD "events" collection')
    return null
  }
  
  console.log('❌ Event not found')
  return null
}

/**
 * 🔥 Récupérer tous les événements (pour admin)
 */
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

// ─── JOIN EVENT (via Stripe webhook) ─────────────────────────────────────

export async function confirmPaidJoin(eventId, userId, userName, stripeSessionId) {
  const meetupRef = doc(db, 'meetups', eventId)
  const participantRef = doc(collection(db, 'participants'))

  try {
    await runTransaction(db, async (tx) => {
      const meetupSnap = await tx.get(meetupRef)

      if (!meetupSnap.exists()) {
        throw new Error('EVENT_NOT_FOUND')
      }

      const meetup = meetupSnap.data()
      const meetupLimit = meetup.capacity_max || CAPACITY_MAX
      const currentParticipants = meetup.participants_count || 0

      if (currentParticipants >= meetupLimit) {
        throw new Error('EVENT_FULL')
      }

      const existingQuery = query(
        collection(db, 'participants'),
        where('event_id', '==', eventId),
        where('user_id', '==', userId)
      )
      const existingSnap = await getDocs(existingQuery)
      if (!existingSnap.empty) {
        throw new Error('ALREADY_JOINED')
      }

      const newCount = currentParticipants + 1

      let newStatus = EVENT_STATUS.OPEN
      if (newCount >= meetupLimit) newStatus = EVENT_STATUS.FULL
      else if (newCount >= CAPACITY_MIN) newStatus = EVENT_STATUS.CONFIRMED

      tx.update(meetupRef, {
        participants_count: newCount,
        status: newStatus,
        updatedAt: serverTimestamp(),
      })

      tx.set(participantRef, {
        user_id:    userId,
        user_name:  userName,
        event_id:   eventId,
        status:     'joined',
        stripe_session_id: stripeSessionId,
        paid_at:    serverTimestamp(),
        created_at: serverTimestamp(),
      })
    })

    console.log(`✅ confirmPaidJoin: User ${userId} joined event ${eventId}`)
    return { success: true }
  } catch (err) {
    console.error('[confirmPaidJoin] transaction failed:', err.message)
    return { success: false, reason: err.message }
  }
}

export async function hasUserJoined(eventId, userId) {
  const q = query(
    collection(db, 'participants'),
    where('event_id', '==', eventId),
    where('user_id', '==', userId)
  )
  const snap = await getDocs(q)
  return !snap.empty
}

export async function getEventParticipants(eventId) {
  const q = query(
    collection(db, 'participants'),
    where('event_id', '==', eventId)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function getUserEvents(userId) {
  const q = query(
    collection(db, 'participants'),
    where('user_id', '==', userId),
    orderBy('created_at', 'desc')
  )
  const snap = await getDocs(q)
  
  const events = []
  for (const doc of snap.docs) {
    const participant = { id: doc.id, ...doc.data() }
    const eventSnap = await getDoc(doc(db, 'meetups', participant.event_id))
    if (eventSnap.exists()) {
      events.push({
        ...participant,
        event: { id: eventSnap.id, ...eventSnap.data() }
      })
    }
  }
  return events
}

// ─── ATTENDANCE ────────────────────────────────────────────────────────────

export async function markAttendance(eventId, userId, status) {
  if (!['attended', 'no_show'].includes(status)) {
    throw new Error('Invalid status. Use "attended" or "no_show".')
  }

  const q = query(
    collection(db, 'participants'),
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

// ─── CREATE EVENT (pending_event) ────────────────────────────────────────

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
    time: eventData.time,
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