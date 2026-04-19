import { fetchUpcomingEventsGlobal, fetchEventById } from './events'

// 🔥 Re-export des fonctions pour compatibilité avec l'ancien code
export async function fetchUpcomingMeetupsGlobal(max = 4) {
  return fetchUpcomingEventsGlobal(max)
}

export async function fetchMeetupById(meetupId) {
  return fetchEventById(meetupId)
}

// 🔥 Export direct des fonctions originales pour éviter la confusion
export { fetchUpcomingEventsGlobal, fetchEventById }