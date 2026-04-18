'use client'

import { useState } from 'react'

export function HostButton({ eventData, userId }) {
  const [isLoading, setIsLoading] = useState(false)

  const handleHost = async () => {
    if (!userId) {
      alert('Please log in to create an event')
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'host',
          userId,
          eventData: {
            type: eventData.type || 'outing',
            location_name: eventData.location_name || eventData.venueName || '',
            city: eventData.city || '',
            time: eventData.time || eventData.startAt || '',
            capacity: Number(eventData.capacity) || 6,
            description: eventData.description || '',
            title: eventData.title || '',
          },
        }),
      })

      const data = await res.json()

      if (data.error) {
        throw new Error(data.error)
      }

      // Rediriger vers Stripe
      window.location.href = data.url

    } catch (err) {
      console.error('Error:', err)
      alert('Error creating event: ' + err.message)
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleHost}
      disabled={isLoading}
      style={{
        width: '100%',
        padding: '16px 20px',
        borderRadius: 'var(--radius-md)',
        border: 'none',
        background: 'var(--text)',
        color: '#fff',
        fontWeight: 700,
        fontSize: '1rem',
        cursor: isLoading ? 'not-allowed' : 'pointer',
        opacity: isLoading ? 0.7 : 1,
      }}
    >
      {isLoading ? 'Processing...' : 'Create Event — $2'}
    </button>
  )
}