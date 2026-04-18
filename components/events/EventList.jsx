'use client'
import EventCard from './EventCard'
import EmptyState from './EmptyState'

export default function EventList({ events = [], loading }) {
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
      {events.map(event => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  )
}
