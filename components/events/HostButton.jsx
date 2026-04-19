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
      // 🔥 TOUS les champs sont maintenant envoyés
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'host',
          userId,
          eventData: {
            // Champs obligatoires
            type: eventData.type || 'outing',
            city: eventData.city || '',
            meetingPoint: eventData.meetingPoint || '',        // 👈 NOUVEAU : point de rencontre
            time: eventData.time || eventData.startAt || '',
            capacity: Number(eventData.capacity) || 9,
            description: eventData.description || '',
            
            // Champs optionnels
            title: eventData.title || '',
            location_name: eventData.location_name || eventData.meetingPoint || eventData.venueName || '',
            venue: eventData.venue || '',                       // 👈 NOUVEAU : établissement
            
            // Géolocalisation
            coordinates: eventData.coordinates || null,         // 👈 NOUVEAU : { lat, lng, name }
            
            // Capacités min/max
            capacity_min: Number(eventData.capacity_min) || 6,  // 👈 NOUVEAU
            capacity_max: Number(eventData.capacity_max) || 9,  // 👈 NOUVEAU
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