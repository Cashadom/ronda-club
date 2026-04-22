'use client'
import EventCard from './EventCard'
import EmptyState from './EmptyState'

export default function EventList({ events = [], loading }) {
  // 🔍 LOG - Vérifier les événements reçus
  console.log('📋 [EventList] Received events count:', events.length)
  
  if (events.length > 0) {
    console.log('📋 [EventList] First event id:', events[0]?.id)
    console.log('📋 [EventList] First event type of id:', typeof events[0]?.id)
    console.log('📋 [EventList] First event full:', events[0])
  }

  if (loading) {
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: '16px',
      }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{
            background: 'var(--bg-soft)',
            borderRadius: 'var(--radius-lg)',
            height: '180px',
            animation: 'pulse 1.5s ease infinite',
            border: '1px solid var(--border)',
          }} />
        ))}
      </div>
    )
  }

  if (!events.length) return <EmptyState />

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
      gap: '16px',
    }}>
      {events.map(event => {
        // 🔍 LOG - Chaque événement passé à EventCard
        console.log('🎴 [EventList] Passing to EventCard - id:', event?.id)
        return <EventCard key={event.id} event={event} />
      })}
    </div>
  )
}