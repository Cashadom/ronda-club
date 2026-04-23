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
  PENDING: 'pending',
  PAID: 'paid',
  CANCELLED: 'cancelled',
  FULL: 'full',
  COMPLETED: 'completed',
}

// ─── FETCH DEPUIS meetups UNIQUEMENT ─────────────────────────────────────

/**
 * 🔥 Récupérer les événements à venir (status = 'paid' ET startAt > now)
 */
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
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(event => {
      // ✅ Ne garder que les events payés ET avec une date valide ET future
      if (event.status !== 'paid') return false
      if (!event.startAt) return false
      const eventDate = new Date(event.startAt)
      return eventDate > now
    })
    .slice(0, maxResults)
  
  console.log(`📡 [fetchUpcomingEventsGlobal] Returning ${events.length} events`)
  return events
}

/**
 * 🔥 Récupérer les événements passés (status = 'paid' ET startAt < now)
 */
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
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(event => {
      // ✅ Ne garder que les events payés ET avec une date valide ET passée
      if (event.status !== 'paid') return false
      if (!event.startAt) return false
      const eventDate = new Date(event.startAt)
      return eventDate < now
    })
    .slice(0, limitCount)
  
  console.log(`📡 [fetchPastEventsGlobal] Returning ${events.length} past events`)
  return events
}

/**
 * 🔥 Récupérer les événements par ville (status = 'paid' uniquement)
 */
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
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(event => {
      if (event.status !== 'paid') return false
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
      
      // ✅ Vérifier que l'event est bien payé
      if (meetup.status !== 'paid') {
        throw new Error('EVENT_NOT_AVAILABLE')
      }

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

      // ✅ On ne touche PAS au status de l'event (garde 'paid')
      tx.update(meetupRef, {
        participants_count: newCount,
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

// ─── CREATE EVENT (pending_event) - DEPRECATED ───────────────────────────
// À garder pour compatibilité, mais plus utilisé
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