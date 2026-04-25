'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function EditEventButton({ event, userId }) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: event.title || '',
    description: event.description || '',
    meetingPoint: event.meetingPoint || '',
    venue: event.venue || '',
    city: event.city || '',
    startAt: event.startAt ? new Date(event.startAt).toISOString().slice(0, 16) : '',
    capacity_max: event.capacity_max || 9,
  })

  const isHost = userId === (event.hostId || event.host_id)

  if (!isHost) return null

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch(`/api/events/${event.id}/edit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          isHost: true,
          ...formData
        }),
      })

      const data = await res.json()

      if (data.success) {
        alert('Event updated successfully!')
        setIsEditing(false)
        router.refresh()
      } else {
        alert(data.error || 'Failed to update event')
      }
    } catch (err) {
      console.error('Error editing event:', err)
      alert('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (isEditing) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}>
        <div style={{
          background: '#fff',
          borderRadius: 28,
          padding: 28,
          maxWidth: 500,
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
        }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 20 }}>Edit Event</h2>
          
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Title</label>
              <input
                name="title"
                value={formData.title}
                onChange={handleChange}
                style={{ width: '100%', padding: 10, borderRadius: 12, border: '1px solid #ccc' }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                style={{ width: '100%', padding: 10, borderRadius: 12, border: '1px solid #ccc' }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Meeting Point</label>
              <input
                name="meetingPoint"
                value={formData.meetingPoint}
                onChange={handleChange}
                style={{ width: '100%', padding: 10, borderRadius: 12, border: '1px solid #ccc' }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Venue</label>
              <input
                name="venue"
                value={formData.venue}
                onChange={handleChange}
                style={{ width: '100%', padding: 10, borderRadius: 12, border: '1px solid #ccc' }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>City</label>
              <input
                name="city"
                value={formData.city}
                onChange={handleChange}
                style={{ width: '100%', padding: 10, borderRadius: 12, border: '1px solid #ccc' }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Date & Time</label>
              <input
                name="startAt"
                type="datetime-local"
                value={formData.startAt}
                onChange={handleChange}
                style={{ width: '100%', padding: 10, borderRadius: 12, border: '1px solid #ccc' }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Max Capacity</label>
              <input
                name="capacity_max"
                type="number"
                min={6}
                max={9}
                value={formData.capacity_max}
                onChange={handleChange}
                style={{ width: '100%', padding: 10, borderRadius: 12, border: '1px solid #ccc' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 1,
                  background: 'var(--coral)',
                  color: '#fff',
                  border: 'none',
                  padding: 12,
                  borderRadius: 40,
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                style={{
                  flex: 1,
                  background: '#f0f0f0',
                  color: '#666',
                  border: 'none',
                  padding: 12,
                  borderRadius: 40,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      style={{
        flex: 1,
        background: 'transparent',
        border: '1px solid var(--coral-border)',
        color: 'var(--coral)',
        padding: '14px 24px',
        borderRadius: 60,
        fontSize: '0.9rem',
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      ✏️ Edit event
    </button>
  )
}