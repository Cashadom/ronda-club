import { EVENT_TYPES, CAPACITY_MAX } from './events'

/**
 * Format a Firestore Timestamp or Date to readable string.
 * e.g. "Tonight · 8:00 PM" or "Sat 14 Jun · 7:30 PM"
 */
export function formatEventTime(timestamp) {
  if (!timestamp) return ''
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  const now = new Date()

  const isToday    = date.toDateString() === now.toDateString()
  const tomorrow   = new Date(now); tomorrow.setDate(now.getDate() + 1)
  const isTomorrow = date.toDateString() === tomorrow.toDateString()

  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  if (isToday)    return `Tonight · ${timeStr}`
  if (isTomorrow) return `Tomorrow · ${timeStr}`

  const dateStr = date.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
  return `${dateStr} · ${timeStr}`
}

/**
 * 🔥 CORRIGÉ: Get spots left display string.
 * Supporte les nouveaux champs (participants, participantsLimit)
 * et reste compatible avec l'ancien format (participants_count, capacity)
 * 
 * e.g. "3 spots left" or "Full"
 */
export function getSpotsLeft(event) {
  // Normalisation des champs (backend récent + ancien)
  const participants = event.participants ?? event.participants_count ?? 0
  const limit = event.participantsLimit ?? event.capacity ?? CAPACITY_MAX
  
  const left = limit - participants
  
  if (left <= 0) return 'Full'
  if (left === 1) return '1 spot left'
  return `${left} spots left`
}

/**
 * Get event type config (emoji + label) by value.
 */
export function getEventType(value) {
  return EVENT_TYPES.find(t => t.value === value) || EVENT_TYPES[0]
}

/**
 * Detect city from browser geolocation.
 * Returns city string or fallback.
 */
export async function detectCity() {
  if (typeof window === 'undefined') return 'chennai'

  // Try localStorage cache first
  const cached = localStorage.getItem('ronda_city')
  if (cached) return cached

  return 'chennai' // Default fallback for MVP
}

/**
 * Save city preference to localStorage.
 */
export function saveCity(city) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('ronda_city', city.toLowerCase())
  }
}

/**
 * Format trust score with level label.
 */
export function formatTrustDisplay(score) {
  if (score === 0) return 'New member'
  if (score < 0)  return `${score} (needs improvement)`
  return `+${score}`
}

/**
 * Generate initials from name for avatar fallback.
 */
export function getInitials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

/**
 * Slugify a string for URLs.
 */
export function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}