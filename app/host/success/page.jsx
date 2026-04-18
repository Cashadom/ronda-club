'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

const cardStyle = {
  background: '#fff',
  border: '1px solid var(--border, #eee)',
  borderRadius: '24px',
  padding: '28px',
  boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
}

const labelStyle = {
  fontSize: '0.78rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '1px',
  color: 'var(--text-muted, #777)',
  marginBottom: '4px',
}

const valueStyle = {
  fontSize: '1rem',
  fontWeight: 600,
  color: 'var(--text, #111)',
}

export default function HostSuccessPage() {
  const [data, setData] = useState(null)
  const [isPublishing, setIsPublishing] = useState(true)
  const [isDone, setIsDone] = useState(false)
  const [paymentConfirmed, setPaymentConfirmed] = useState(false)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const run = async () => {
      const raw = localStorage.getItem('pendingHostEvent')
      const eventId = localStorage.getItem('eventId')

      if (raw) {
        try {
          const parsed = JSON.parse(raw)
          setData(parsed)
        } catch (err) {
          console.error('Failed to parse pendingHostEvent:', err)
        }
      }

      if (!eventId) {
        console.log('No eventId found in localStorage')
        setIsPublishing(false)
        setHasError(true)
        return
      }

      try {
        const response = await fetch('/api/events/confirm-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventId }),
        })

        const result = await response.json()

        if (!result.success) {
          console.error('Payment confirmation failed:', result.error)
          setHasError(true)
          setIsPublishing(false)
          return
        }

        setPaymentConfirmed(true)

        setTimeout(() => {
          setIsDone(true)
          setIsPublishing(false)
          localStorage.removeItem('eventId')
          localStorage.removeItem('pendingHostEvent')
        }, 1200)
      } catch (err) {
        console.error('Error confirming payment:', err)
        setHasError(true)
        setIsPublishing(false)
      }
    }

    run()
  }, [])

  const event = data?.eventData

  return (
    <main
      style={{
        minHeight: '100vh',
        background:
          'linear-gradient(180deg, #FFF7F4 0%, #FFFFFF 35%, #FFFFFF 100%)',
        padding: '48px 20px',
      }}
    >
      <div style={{ maxWidth: '760px', margin: '0 auto' }}>
        <div
          style={{
            textAlign: 'center',
            marginBottom: '28px',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '120px',
              height: '120px',
              marginBottom: '18px',
            }}
          >
            <Image
              src="/confirmation.png"
              alt="Confirmation"
              width={90}
              height={90}
              priority
            />
          </div>

          <p
            style={{
              fontSize: '0.78rem',
              fontWeight: 800,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              color: '#E66A4E',
              marginBottom: '10px',
            }}
          >
            {hasError
              ? 'Payment verification issue'
              : paymentConfirmed
                ? 'Payment confirmed'
                : 'Processing payment'}
          </p>

          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2rem, 4vw, 3.2rem)',
              lineHeight: 1.05,
              marginBottom: '14px',
              color: 'var(--text, #111)',
            }}
          >
            {hasError
              ? 'We could not verify your payment'
              : isDone
                ? 'Your meetup is live'
                : 'Your meetup is almost live'}
          </h1>

          <p
            style={{
              maxWidth: '620px',
              margin: '0 auto',
              fontSize: '1.05rem',
              lineHeight: 1.7,
              color: 'var(--text-mid, #555)',
            }}
          >
            {hasError
              ? 'We were unable to confirm this payment automatically. Please try again or contact support before your event is published.'
              : isDone
                ? 'Your event is now live on Ronda. People nearby can discover it, request to join, and meet in real life.'
                : 'We’re now publishing your event on Ronda. Your meetup will appear shortly and nearby people will be able to discover it.'}
          </p>

          {isPublishing && !hasError && (
            <p
              style={{
                marginTop: '14px',
                color: 'var(--text-muted, #777)',
                fontSize: '0.95rem',
                fontWeight: 600,
              }}
            >
              Publishing your event...
            </p>
          )}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 0.8fr',
            gap: '20px',
          }}
        >
          <section style={cardStyle}>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.4rem',
                marginBottom: '18px',
                color: 'var(--text, #111)',
              }}
            >
              What happens next
            </h2>

            <div
              style={{
                display: 'grid',
                gap: '14px',
              }}
            >
              {[
                'Your event is being published on Ronda.',
                'It will appear to nearby people looking for real meetups.',
                'Participants will be able to discover it and request to join.',
                'You’ll be able to host a small, warm, in-person gathering.',
              ].map((item) => (
                <div
                  key={item}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    color: 'var(--text, #111)',
                    lineHeight: 1.6,
                  }}
                >
                  <span
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '999px',
                      background: '#FFE7DE',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.9rem',
                      flexShrink: 0,
                      marginTop: '1px',
                    }}
                  >
                    ✓
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: '24px',
                padding: '16px 18px',
                borderRadius: '16px',
                background: '#FFF7F4',
                border: '1px solid #F7D7CC',
                color: '#7A4B3E',
                lineHeight: 1.6,
                fontSize: '0.95rem',
              }}
            >
              Small groups create stronger conversations. Ronda is designed to
              make real-life connections feel easier, warmer, and more natural.
            </div>
          </section>

          <aside style={cardStyle}>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.2rem',
                marginBottom: '18px',
                color: 'var(--text, #111)',
              }}
            >
              Event summary
            </h2>

            {event ? (
              <div style={{ display: 'grid', gap: '14px' }}>
                <div>
                  <div style={labelStyle}>Type</div>
                  <div style={valueStyle}>{event.type}</div>
                </div>

                <div>
                  <div style={labelStyle}>Location</div>
                  <div style={valueStyle}>{event.location_name}</div>
                </div>

                <div>
                  <div style={labelStyle}>City</div>
                  <div style={valueStyle}>{event.city}</div>
                </div>

                <div>
                  <div style={labelStyle}>Time</div>
                  <div style={valueStyle}>{event.time}</div>
                </div>

                <div>
                  <div style={labelStyle}>Capacity</div>
                  <div style={valueStyle}>
                    Up to {event.capacity} participants
                  </div>
                </div>

                {event.description ? (
                  <div>
                    <div style={labelStyle}>About</div>
                    <div style={{ ...valueStyle, fontWeight: 500 }}>
                      {event.description}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <p
                style={{
                  color: 'var(--text-mid, #555)',
                  lineHeight: 1.6,
                }}
              >
                We received your payment. Your meetup details will appear here
                once the event draft is restored.
              </p>
            )}

            <a
              href="/events"
              style={{
                display: 'inline-flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
                marginTop: '24px',
                padding: '14px 18px',
                borderRadius: '16px',
                background: '#111',
                color: '#fff',
                textDecoration: 'none',
                fontWeight: 700,
              }}
            >
              Explore meetups
            </a>
          </aside>
        </div>
      </div>
    </main>
  )
}