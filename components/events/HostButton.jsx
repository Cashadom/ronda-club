'use client'

import { useState } from 'react'
import { auth } from '@/lib/firebase'

export function HostButton({ eventData, userId }) {
  const [isLoading, setIsLoading] = useState(false)

  const handleHost = async () => {
    console.log('[HostButton] 1. Button clicked')
    
    if (!userId) {
      alert('Please log in to create an event')
      return
    }

    setIsLoading(true)

    try {
      // 🔥 RÉCUPÉRER L'UTILISATEUR FIREBASE
      const user = auth.currentUser
      console.log('[HostButton] 2. Current user:', user?.uid)
      
      if (!user) {
        alert('You must be logged in')
        setIsLoading(false)
        return
      }

      // 🔥 FORCER LE RAFFRAÎCHISSEMENT DU TOKEN
      const token = await user.getIdToken(true)
      console.log('[HostButton] 3. Token obtained, length:', token.length)
      console.log('[HostButton] 4. Token preview:', token.substring(0, 50) + '...')

      // 🔥 PRÉPARER LES DONNÉES
      const requestBody = {
        type: 'host',
        userId,
        eventData: {
          type: eventData.type || 'outing',
          city: eventData.city || '',
          meetingPoint: eventData.meetingPoint || '',
          startAt: eventData.startAt || '',
          capacity: Number(eventData.capacity) || 9,
          description: eventData.description || '',
          title: eventData.title || '',
          location_name: eventData.location_name || eventData.meetingPoint || '',
          venue: eventData.venue || '',
          coordinates: eventData.coordinates || null,
          capacity_min: Number(eventData.capacity_min) || 6,
          capacity_max: Number(eventData.capacity_max) || 9,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      }

      console.log('[HostButton] 5. Sending request to /api/stripe/checkout')

      // 🔥 ENVOI AVEC LE TOKEN DANS LE HEADER
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // 🔥 CRUCIAL
        },
        body: JSON.stringify(requestBody),
      })

      console.log('[HostButton] 6. Response status:', res.status)

      const data = await res.json()

      if (!res.ok) {
        console.error('[HostButton] 7. Error response:', data)
        throw new Error(data.error || 'Checkout failed')
      }

      console.log('[HostButton] 8. Success, redirecting to:', data.url)
      window.location.href = data.url

    } catch (err) {
      console.error('[HostButton] Error:', err)
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