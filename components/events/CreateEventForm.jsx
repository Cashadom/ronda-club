'use client'

import { useState, useEffect, useRef } from 'react'
import { EVENT_TYPES, CAPACITY_MIN, CAPACITY_MAX } from '@/lib/events'
import { HostButton } from './HostButton'
import { geocodeLocation } from '@/lib/geocode'
import dynamic from 'next/dynamic'

// Import dynamique de la carte pour éviter les erreurs SSR
const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div style={{
      height: '240px',
      background: '#f8fafc',
      borderRadius: 'var(--radius-md)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '0.85rem',
      color: 'var(--text-muted)'
    }}>
      🗺️ Loading map...
    </div>
  )
})

const MIN_HOURS_BEFORE_EVENT = 3

const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: 'var(--radius-md)',
  border: '1.5px solid var(--border)',
  fontFamily: 'var(--font-body)',
  fontSize: '0.95rem',
  color: 'var(--text)',
  background: '#fff',
  outline: 'none',
  transition: 'border-color 0.2s',
}

const labelStyle = {
  display: 'block',
  fontSize: '0.85rem',
  fontWeight: 600,
  color: 'var(--text-mid)',
  marginBottom: '6px',
}

// Headers pour Nominatim
const NOMINATIM_HEADERS = {
  'User-Agent': 'RondaApp/1.0 (contact@ronda.com)'
}

export default function CreateEventForm({ userId, userCity }) {
  const [form, setForm] = useState({
    type:          'drinks',
    city:          userCity || '',
    meetingPoint:  '',        // Champ libre OBLIGATOIRE
    date:          '',
    time:          '',
    capacity:      9,
    description:   '',
  })
  const [step, setStep] = useState(1)
  const [isGeocoding, setIsGeocoding] = useState(false)
  
  // États pour l'autocomplétion de la VILLE uniquement
  const [citySuggestions, setCitySuggestions] = useState([])
  const [mapCenter, setMapCenter] = useState(null)
  const [coordinates, setCoordinates] = useState(null)
  const [searchTimeout, setSearchTimeout] = useState(null)
  const [isSearching, setIsSearching] = useState(false)

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const selectedType = EVENT_TYPES.find(t => t.value === form.type)

  const isValidEventTime = () => {
    if (!form.date || !form.time) return false
    const [year, month, day] = form.date.split('-')
    const [hours, minutes] = form.time.split(':')
    const selected = new Date(year, month - 1, day, hours, minutes)
    const now = new Date()
    const minAllowed = new Date(now.getTime() + MIN_HOURS_BEFORE_EVENT * 60 * 60 * 1000)
    return selected >= minAllowed
  }

  const getEventDateTime = () => {
    if (!form.date || !form.time) return null
    return new Date(`${form.date}T${form.time}`).toISOString()
  }

  // Validation : city ET meetingPoint sont OBLIGATOIRES
  const isValid = 
    form.city.trim() &&
    form.meetingPoint.trim() &&
    form.date &&
    form.time &&
    isValidEventTime()

  // 🔍 Recherche Nominatim uniquement pour la VILLE
  const searchCity = async (query) => {
    if (query.length < 3) {
      setCitySuggestions([])
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&featuretype=city`,
        { headers: NOMINATIM_HEADERS }
      )
      const data = await response.json()
      setCitySuggestions(data)
    } catch (error) {
      console.error('Error fetching city suggestions:', error)
    } finally {
      setIsSearching(false)
    }
  }

  // Gestionnaire pour la ville
  const handleCityChange = (e) => {
    const value = e.target.value
    set('city', value)
    
    if (searchTimeout) clearTimeout(searchTimeout)
    const timeoutId = setTimeout(() => searchCity(value), 500)
    setSearchTimeout(timeoutId)
  }

  // Sélection d'une ville suggérée
  const handleSelectCitySuggestion = (suggestion) => {
    const lat = parseFloat(suggestion.lat)
    const lon = parseFloat(suggestion.lon)
    
    set('city', suggestion.display_name)
    setMapCenter([lat, lon])
    setCoordinates({ lat, lng: lon, name: suggestion.display_name })
    setCitySuggestions([])
  }

  // Géocodage automatique basé sur la ville
  useEffect(() => {
    if (!form.city || form.city.length < 3) return
    
    const geocodeCity = async () => {
      try {
        const geo = await geocodeLocation(form.city)
        if (geo) {
          setCoordinates({
            lat: geo.lat,
            lng: geo.lng,
            name: geo.displayName,
          })
          setMapCenter([geo.lat, geo.lng])
        }
      } catch (error) {
        console.warn('Geocoding failed:', error)
      }
    }
    
    const timeoutId = setTimeout(geocodeCity, 800)
    return () => clearTimeout(timeoutId)
  }, [form.city])

  const handleReview = async () => {
    if (!isValid) return
    
    setIsGeocoding(true)
    try {
      let finalCoordinates = coordinates
      
      if (!finalCoordinates && form.city.trim()) {
        const geo = await geocodeLocation(form.city.trim())
        if (geo) {
          finalCoordinates = {
            lat: geo.lat,
            lng: geo.lng,
            name: geo.displayName,
          }
          setCoordinates(finalCoordinates)
          setMapCenter([geo.lat, geo.lng])
        }
      }
      
      setStep(2)
    } catch (geoError) {
      console.warn('Geocoding failed, continuing without coordinates:', geoError)
      setStep(2)
    } finally {
      setIsGeocoding(false)
    }
  }

  // 🔥 CORRECTION : eventData avec startAt et title
  const eventData = {
    type: form.type,
    title: `${selectedType.label} in ${form.city.trim()}`,
    city: form.city.trim(),
    meetingPoint: form.meetingPoint.trim(),
    location_name: form.meetingPoint.trim(),
    startAt: getEventDateTime(),  // ← CHANGÉ : time → startAt
    capacity: form.capacity,
    description: form.description.trim(),
    capacity_min: CAPACITY_MIN,
    capacity_max: CAPACITY_MAX,
    ...(coordinates && { coordinates }),
  }

  if (step === 2) {
    return (
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>
        <div style={{
          background: 'var(--coral-pale)',
          border: '1px solid var(--coral-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '28px',
          marginBottom: '24px',
        }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '1.5px',
            textTransform: 'uppercase', color: 'var(--coral)', marginBottom: '16px' }}>
            Review your event
          </p>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem',
            fontWeight: 700, marginBottom: '16px', color: 'var(--text)' }}>
            {selectedType.emoji} {selectedType.label}
          </h3>
          {[
            ['📍 Meeting point', form.meetingPoint.trim()],
            ['🏙 City', form.city.trim()],
            ['⏰ Time', `${form.date} at ${form.time}`],
            ['👥 Capacity', `${form.capacity} people max`],
            form.description.trim() && ['💬 About', form.description.trim()],
            coordinates && ['🗺️ Map', '📍 Location detected'],
          ].filter(Boolean).map(([label, value]) => (
            <div key={label} style={{ display: 'flex', gap: '12px',
              fontSize: '0.88rem', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)', minWidth: '100px' }}>{label}</span>
              <span style={{ color: 'var(--text)', fontWeight: 500 }}>{value}</span>
            </div>
          ))}
          
          {/* Mini map dans la review */}
          {coordinates && mapCenter && (
            <div style={{ marginTop: '16px', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              <MapComponent center={mapCenter} location={form.city} height="160px" />
            </div>
          )}
        </div>

        <HostButton eventData={eventData} userId={userId} />

        <button onClick={() => setStep(1)} style={{
          background: 'none', border: 'none', color: 'var(--text-muted)',
          fontSize: '0.85rem', cursor: 'pointer', marginTop: '12px',
          width: '100%', textAlign: 'center', padding: '8px',
        }}>
          ← Edit event
        </button>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto' }}>
      {/* Event type */}
      <div style={{ marginBottom: '24px' }}>
        <label style={labelStyle}>Event type</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {EVENT_TYPES.map(t => (
            <button
              key={t.value}
              onClick={() => set('type', t.value)}
              style={{
                padding:      '9px 16px',
                borderRadius: 'var(--radius-pill)',
                border:       `1.5px solid ${form.type === t.value ? 'var(--coral)' : 'var(--border)'}`,
                background:   form.type === t.value ? 'var(--coral-pale)' : '#fff',
                color:        form.type === t.value ? 'var(--coral)' : 'var(--text-mid)',
                fontWeight:   600,
                fontSize:     '0.85rem',
                cursor:       'pointer',
                fontFamily:   'var(--font-body)',
                transition:   'all 0.15s',
              }}
            >
              {t.emoji} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* City (obligatoire avec autocomplétion) */}
      <div style={{ marginBottom: '20px', position: 'relative' }}>
        <label style={labelStyle}>City <span style={{ color: '#d64545' }}>*</span></label>
        <input
          style={{ ...inputStyle }}
          placeholder="e.g. Paris, London, Chennai..."
          value={form.city}
          onChange={handleCityChange}
          onFocus={e => e.target.style.borderColor = 'var(--coral)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
        
        {citySuggestions.length > 0 && (
          <ul style={{
            position: 'absolute',
            zIndex: 1000,
            background: '#fff',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            marginTop: '4px',
            width: '100%',
            maxHeight: '240px',
            overflowY: 'auto',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          }}>
            {citySuggestions.map((sugg, idx) => (
              <li
                key={idx}
                onClick={() => handleSelectCitySuggestion(sugg)}
                style={{
                  padding: '10px 16px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  borderBottom: idx < citySuggestions.length - 1 ? '1px solid var(--border-light)' : 'none',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--coral-pale)'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}
              >
                🏙️ {sugg.display_name}
              </li>
            ))}
          </ul>
        )}
        
        {isSearching && (
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            🔍 Searching...
          </p>
        )}
      </div>

      {/* Meeting Point (champ libre OBLIGATOIRE) */}
      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>
          📍 Meeting point / Venue <span style={{ color: '#d64545' }}>*</span>
          <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 400, color: 'var(--text-muted)', marginTop: '2px' }}>
            Be specific — e.g., "In front of the main entrance", "Next to the red bench", "Café terrace"
          </span>
        </label>
        <input
          style={{ ...inputStyle }}
          placeholder="e.g. In front of 59th street entrance, next to the fountain"
          value={form.meetingPoint}
          onChange={e => set('meetingPoint', e.target.value)}
          onFocus={e => e.target.style.borderColor = 'var(--coral)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
        {!form.meetingPoint && (
          <p style={{ fontSize: '0.7rem', color: '#d64545', marginTop: '4px' }}>
            ⚠️ Please specify an exact meeting point so everyone can find you
          </p>
        )}
      </div>

      {/* Mini Map Preview (basée sur la ville) */}
      {mapCenter && (
        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>City preview</label>
          <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border)' }}>
            <MapComponent center={mapCenter} location={form.city} height="200px" />
          </div>
        </div>
      )}

      {/* Date + Time */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
        <div>
          <label style={labelStyle}>Date</label>
          <input
            type="date"
            style={inputStyle}
            value={form.date}
            onChange={e => set('date', e.target.value)}
            min={new Date().toISOString().split('T')[0]}
          />
        </div>
        <div>
          <label style={labelStyle}>Time</label>
          <input
            type="time"
            style={inputStyle}
            value={form.time}
            onChange={e => set('time', e.target.value)}
          />
        </div>
      </div>

      {/* Time validation */}
      {form.date && form.time && !isValidEventTime() && (
        <p style={{ fontSize: '0.78rem', color: '#d64545', marginTop: '-12px', marginBottom: '20px' }}>
          ⏱️ Event must start at least {MIN_HOURS_BEFORE_EVENT} hours from now.
        </p>
      )}

      {/* Capacity */}
      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>
          Max participants — {CAPACITY_MIN} min · {form.capacity} max
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <input
            type="range"
            min={CAPACITY_MIN}
            max={CAPACITY_MAX}
            value={form.capacity}
            onChange={e => set('capacity', parseInt(e.target.value))}
            style={{ flex: 1, accentColor: 'var(--coral)' }}
          />
          <span style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: '1.3rem',
            color: 'var(--coral)',
            minWidth: '32px',
            textAlign: 'center',
          }}>
            {form.capacity}
          </span>
        </div>
      </div>

      {/* Description */}
      <div style={{ marginBottom: '28px' }}>
        <label style={labelStyle}>Short description <span style={{ fontWeight: 400 }}>(optional)</span></label>
        <textarea
          style={{ ...inputStyle, resize: 'none', height: '80px' }}
          placeholder="e.g. Casual after-work drinks, everyone welcome. English + Tamil speakers."
          value={form.description}
          maxLength={140}
          onChange={e => set('description', e.target.value)}
        />
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'right', marginTop: '4px' }}>
          {form.description.length}/140
        </p>
      </div>

      <button
        onClick={handleReview}
        disabled={!isValid || isGeocoding}
        style={{
          width: '100%',
          background: 'var(--coral)',
          color: '#fff',
          border: 'none',
          padding: '14px 24px',
          borderRadius: 'var(--radius-pill)',
          fontWeight: 600,
          fontSize: '0.95rem',
          cursor: (!isValid || isGeocoding) ? 'not-allowed' : 'pointer',
          opacity: (!isValid || isGeocoding) ? 0.6 : 1,
        }}
      >
        {isGeocoding ? 'Detecting location...' : 'Review event →'}
      </button>
    </div>
  )
}