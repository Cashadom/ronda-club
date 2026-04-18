'use client'

import { useState } from 'react'
import { EVENT_TYPES, CAPACITY_MIN, CAPACITY_MAX } from '@/lib/events'
import { HostButton } from './HostButton'
import Button from '@/components/ui/Button'

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

export default function CreateEventForm({ userId, userCity }) {
  const [form, setForm] = useState({
    type:          'drinks',
    location_name: '',
    city:          userCity || '',
    date:          '',
    time:          '',
    capacity:      9,
    description:   '',
  })
  const [step, setStep] = useState(1) // 1=form, 2=review

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const selectedType = EVENT_TYPES.find(t => t.value === form.type)

  // Validate event time: must be at least MIN_HOURS_BEFORE_EVENT from now
  const isValidEventTime = () => {
    if (!form.date || !form.time) return false

    const [year, month, day] = form.date.split('-')
    const [hours, minutes] = form.time.split(':')
    const selected = new Date(year, month - 1, day, hours, minutes)
    const now = new Date()
    const minAllowed = new Date(now.getTime() + MIN_HOURS_BEFORE_EVENT * 60 * 60 * 1000)

    return selected >= minAllowed
  }

  // Merge date + time into ISO string
  const getEventDateTime = () => {
    if (!form.date || !form.time) return null
    return new Date(`${form.date}T${form.time}`).toISOString()
  }

  // Validation with trim
  const isValid = 
    form.location_name.trim() &&
    form.date &&
    form.time &&
    form.city.trim() &&
    isValidEventTime()

  const eventData = {
    type:          form.type,
    location_name: form.location_name.trim(),
    city:          form.city.trim(),
    time:          getEventDateTime(),
    capacity:      form.capacity,
    description:   form.description.trim(),
    capacity_min:  CAPACITY_MIN,
    capacity_max:  CAPACITY_MAX,
  }

  const handleReview = () => {
    if (!isValid) return
    setStep(2)
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
            ['📍 Location', form.location_name.trim()],
            ['🏙 City',     form.city.trim()],
            ['⏰ Time',     `${form.date} at ${form.time}`],
            ['👥 Capacity', `${CAPACITY_MIN}–${form.capacity} people`],
            form.description.trim() && ['💬 About', form.description.trim()],
          ].filter(Boolean).map(([label, value]) => (
            <div key={label} style={{ display: 'flex', gap: '12px',
              fontSize: '0.88rem', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)', minWidth: '100px' }}>{label}</span>
              <span style={{ color: 'var(--text)', fontWeight: 500 }}>{value}</span>
            </div>
          ))}
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

      {/* Location */}
      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>Venue / Location</label>
        <input
          style={inputStyle}
          placeholder="e.g. The Terrace Bar, Anna Nagar"
          value={form.location_name}
          onChange={e => set('location_name', e.target.value)}
          onFocus={e => e.target.style.borderColor = 'var(--coral)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
      </div>

      {/* City */}
      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>City</label>
        <input
          style={inputStyle}
          placeholder="e.g. Chennai"
          value={form.city}
          onChange={e => set('city', e.target.value)}
          onFocus={e => e.target.style.borderColor = 'var(--coral)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
      </div>

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
            onFocus={e => e.target.style.borderColor = 'var(--coral)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </div>
        <div>
          <label style={labelStyle}>Time</label>
          <input
            type="time"
            style={inputStyle}
            value={form.time}
            onChange={e => set('time', e.target.value)}
            onFocus={e => e.target.style.borderColor = 'var(--coral)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </div>
      </div>

      {/* Time validation error message */}
      {form.date && form.time && !isValidEventTime() && (
        <p style={{
          fontSize: '0.78rem',
          color: '#d64545',
          marginTop: '-12px',
          marginBottom: '20px',
        }}>
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
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          Sweet spot: 8–9 people. Enough energy, still intimate.
        </p>
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
          onFocus={e => e.target.style.borderColor = 'var(--coral)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'right', marginTop: '4px' }}>
          {form.description.length}/140
        </p>
      </div>

      <Button
        onClick={handleReview}
        disabled={!isValid}
        style={{ width: '100%' }}
      >
        Review event →
      </Button>
    </div>
  )
}