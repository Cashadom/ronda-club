import { doc, updateDoc, increment } from 'firebase/firestore'
import { db } from './firebase'

// ─── Score deltas ──────────────────────────────────────────────────────────
export const TRUST_DELTA = {
  ATTENDED:        +1,
  NO_SHOW:         -1,
  HOST_COMPLETED:  +2,
  HOST_CANCELLED:  -2,
}

// ─── Levels ───────────────────────────────────────────────────────────────
export const TRUST_LEVELS = [
  { min: 0,   max: 2,   label: 'New',        color: '#78716C' },
  { min: 3,   max: 5,   label: 'Rising',     color: '#F59E0B' },
  { min: 6,   max: 10,  label: 'Reliable',   color: '#FF6B51' },
  { min: 11,  max: 20,  label: 'Trusted',    color: '#10B981' },
  { min: 21,  max: 999, label: 'Ambassador', color: '#7C3AED' },
]

/**
 * Get trust level object for a given score.
 */
export function getTrustLevel(score) {
  return (
    TRUST_LEVELS.find(l => score >= l.min && score <= l.max) ||
    TRUST_LEVELS[0]
  )
}

/**
 * Update a user's trust score by delta.
 * Uses Firestore increment() for atomicity.
 * Called server-side after attendance is marked.
 */
export async function updateTrustScore(userId, delta) {
  const ref = doc(db, 'users', userId)
  await updateDoc(ref, {
    trust_score: increment(delta),
  })
}

/**
 * Apply trust changes after an event.
 * Pass array of { userId, attended: boolean }.
 */
export async function applyEventTrustUpdates(participants) {
  const updates = participants.map(({ userId, attended }) =>
    updateTrustScore(userId, attended ? TRUST_DELTA.ATTENDED : TRUST_DELTA.NO_SHOW)
  )
  await Promise.all(updates)
}
