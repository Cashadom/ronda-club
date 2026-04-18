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

// ─── Create Event ─────────────────────────────────────────────────────────
export async function createEvent(eventData) {
  const ref = await addDoc(collection(db, 'events'), {
    creatorId:          eventData.creatorId,
    creatorName:        eventData.creatorName,
    title:              eventData.title,
    category:           eventData.category,
    description:        eventData.description,
    location:           eventData.location,
    dateTime:           eventData.dateTime,
    participants:       0,
    participantsLimit:  CAPACITY_MAX,
    isPaidEvent:        eventData.isPaidEvent || false,
    isOnline:           eventData.isOnline || false,
    onlineLink:         eventData.onlineLink || null,
    imageUrl:           eventData.imageUrl || null,
    coordinates:        eventData.coordinates || null,
    inclusive:          eventData.inclusive || false,
    acceptWaitingList:  eventData.acceptWaitingList || false,
    status:             EVENT_STATUS.OPEN,
    createdAt:          serverTimestamp(),
  })
  return ref.id
}

// ─── Fetch Events ──────────────────────────────────────────────────────────
/**
 * Fetch upcoming events globally for homepage.
 * Returns events with dateTime >= now, sorted by dateTime asc.
 */
export async function fetchUpcomingEventsGlobal(maxResults = 3) {
  const now = new Date().toISOString()
  
  // Get all events, filter and sort in memory (since we can't do complex queries without index)
  const q = query(
    collection(db, 'events'),
    limit(50) // Get recent events to filter
  )
  
  const snapshot = await getDocs(q)
  
  const events = snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(event => {
      // Only show open/confirmed events
      if (event.status && !['open', 'confirmed'].includes(event.status)) return false
      // Only show upcoming events
      return event.dateTime >= now
    })
    .sort((a, b) => a.dateTime.localeCompare(b.dateTime))
    .slice(0, maxResults)
  
  return events
}

/**
 * Fetch upcoming events for a specific city.
 */
export async function fetchEventsByCity(city, maxResults = 20) {
  const now = new Date().toISOString()
  
  const q = query(
    collection(db, 'events'),
    where('location', '==', city),
    limit(maxResults * 2)
  )
  
  const snapshot = await getDocs(q)
  
  const events = snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(event => {
      if (event.status && !['open', 'confirmed'].includes(event.status)) return false
      return event.dateTime >= now
    })
    .sort((a, b) => a.dateTime.localeCompare(b.dateTime))
    .slice(0, maxResults)
  
  return events
}

/**
 * Fetch a single event by ID.
 */
export async function fetchEventById(eventId) {
  const snap = await getDoc(doc(db, 'events', eventId))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

/**
 * Fetch all events (admin use).
 */
export async function fetchAllEvents(limitCount = 50) {
  const q = query(
    collection(db, 'events'),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ─── Join Event (ATOMIC) ───────────────────────────────────────────────────
export async function joinEvent(eventId, userId, userName) {
  const eventRef = doc(db, 'events', eventId)
  const participantRef = doc(collection(db, 'participants'))

  try {
    await runTransaction(db, async (tx) => {
      const eventSnap = await tx.get(eventRef)

      if (!eventSnap.exists()) {
        throw new Error('EVENT_NOT_FOUND')
      }

      const event = eventSnap.data()

      // Hard cap check
      if (event.participants >= CAPACITY_MAX) {
        throw new Error('EVENT_FULL')
      }

      // Check user not already joined
      const existingQuery = query(
        collection(db, 'participants'),
        where('event_id', '==', eventId),
        where('user_id', '==', userId)
      )
      const existingSnap = await getDocs(existingQuery)
      if (!existingSnap.empty) {
        throw new Error('ALREADY_JOINED')
      }

      const newCount = event.participants + 1

      // Determine new status
      let newStatus = EVENT_STATUS.OPEN
      if (newCount >= CAPACITY_MAX) newStatus = EVENT_STATUS.FULL
      else if (newCount >= CAPACITY_MIN) newStatus = EVENT_STATUS.CONFIRMED

      // Atomic write
      tx.update(eventRef, {
        participants: newCount,
        status: newStatus,
      })

      tx.set(participantRef, {
        user_id:    userId,
        user_name:  userName,
        event_id:   eventId,
        status:     'joined',
        paid_at:    serverTimestamp(),
        created_at: serverTimestamp(),
      })
    })

    return { success: true }
  } catch (err) {
    console.error('[joinEvent] transaction failed:', err.message)
    return { success: false, reason: err.message }
  }
}

// ─── Attendance ────────────────────────────────────────────────────────────
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

  await updateDoc(snap.docs[0].ref, { attendance_status: status, marked_at: serverTimestamp() })
}

export async function getEventParticipants(eventId) {
  const q = query(
    collection(db, 'participants'),
    where('event_id', '==', eventId)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
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

export async function getUserEvents(userId) {
  const q = query(
    collection(db, 'participants'),
    where('user_id', '==', userId),
    orderBy('created_at', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ─── Admin ────────────────────────────────────────────────────────────────
export async function adminUpdateEventStatus(eventId, status) {
  await updateDoc(doc(db, 'events', eventId), { status })
}