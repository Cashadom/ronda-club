// ─── index.jsx (landing components) ──────────────────────────────────────────
'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

// ─────────────────────────────────────────────────────────────────────────────
// HERO — split 60/40 avec photo pleine droite
// ─────────────────────────────────────────────────────────────────────────────
export function HeroSection() {
  return (
    <section style={{
      minHeight: '100vh',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      position: 'relative',
      overflow: 'hidden',
      background: '#0F0E0D',
    }}>
      {/* Top accent bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '3px', zIndex: 10,
        background: 'linear-gradient(90deg, var(--coral) 0%, #FF8F7A 50%, var(--coral) 100%)',
      }} />

      {/* Blob déco gauche */}
      <div style={{
        position: 'absolute', width: 500, height: 500, borderRadius: '50%',
        background: 'rgba(255,107,81,0.08)', top: -100, left: -80,
        filter: 'blur(100px)', pointerEvents: 'none', zIndex: 1,
      }} />

      {/* ── COLONNE GAUCHE — texte ── */}
      <div style={{
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '120px 5% 80px 7%', position: 'relative', zIndex: 2,
      }}>
        <div className="eyebrow animate-fadeUp" style={{ marginBottom: '32px' }}>
          <span className="eyebrow-dot" />
          Live in cities worldwide
        </div>

        <h1 className="animate-fadeUp delay-1" style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2.6rem, 5vw, 4.4rem)',
          fontWeight: 900,
          lineHeight: 1.06,
          letterSpacing: '-2px',
          color: '#F5F3F1',
          marginBottom: '22px',
        }}>
          In every city,<br />people cross paths.<br />
          <em style={{ fontStyle: 'italic', fontWeight: 300, color: 'var(--coral)' }}>
            But rarely connect.
          </em>
        </h1>

        <p className="animate-fadeUp delay-2" style={{
          fontSize: 'clamp(0.95rem, 1.6vw, 1.08rem)',
          color: 'rgba(255,255,255,0.5)',
          lineHeight: 1.78,
          maxWidth: '400px',
          marginBottom: '40px',
        }}>
          Ronda makes real-life meetings simple.<br />
          Small groups. Real presence. One tap.
        </p>

        <div className="animate-fadeUp delay-3" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <Link href="/events" className="btn-primary">
            Join tonight's meetup →
          </Link>
          <Link href="/create" className="btn-ghost">
            Host a meetup
          </Link>
        </div>

        <p className="animate-fadeUp delay-3" style={{
          fontSize: '0.78rem', color: 'rgba(255,255,255,0.3)', marginBottom: '36px',
        }}>
          🛡 Refunded if you don't love your first night
        </p>

        <div className="trust-row animate-fadeUp delay-4">
          <div className="trust-avatars">
            {['facea', 'faceb', 'facec', 'faced', 'facee'].map((face, i) => (
              <img key={i} src={`/faces/${face}.png`} alt="" />
            ))}
          </div>
          <div className="trust-text">
            <div className="stars">★★★★★</div>
            <p><strong>3,000+ people</strong> already in the community</p>
          </div>
        </div>
      </div>

      {/* ── COLONNE DROITE — photo ── */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        backgroundImage: 'url(/header.png)',
        backgroundSize: 'cover', backgroundPosition: 'center',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to right, #0F0E0D 0%, transparent 35%)',
          zIndex: 1,
        }} />
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '180px',
          background: 'linear-gradient(to top, #0F0E0D 0%, transparent 100%)',
          zIndex: 1,
        }} />

        {/* Floating live card */}
        <div style={{
          position: 'absolute', bottom: 48, right: 36, zIndex: 3,
          background: 'rgba(255,255,255,0.96)',
          borderRadius: 16, padding: '14px 18px',
          boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
          minWidth: 200,
        }}>
          <div className="live-badge" style={{ marginBottom: 8 }}>Live now</div>
          <p style={{ fontSize: '0.88rem', fontWeight: 600, color: '#1C1917', marginBottom: 3 }}>
            Drinks Night — Barcelona
          </p>
          <p style={{ fontSize: '0.78rem', color: '#78716C' }}>Tonight · El Born · 3 spots left</p>
        </div>
      </div>
    </section>
  )
}

// ─── UpcomingEventsSection (temporaire) ─────────────────────────────────────
export function UpcomingEventsSection() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadEvents() {
      try {
        setEvents([])
      } catch (error) {
        console.error('Failed to load events:', error)
      } finally {
        setLoading(false)
      }
    }
    loadEvents()
  }, [])

  if (loading) {
    return (
      <section className="section-gap" style={{ background: '#fff' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>Loading events...</p>
        </div>
      </section>
    )
  }

  if (events.length === 0) {
    return (
      <section className="section-gap" style={{ background: '#fff' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>No upcoming events yet. Be the first to host one!</p>
        </div>
      </section>
    )
  }

  return (
    <section className="section-gap" style={{ background: '#fff' }}>
      <div className="container">
        <div className="section-header">
          <div className="eyebrow" style={{ margin: '0 auto 12px', width: 'fit-content' }}>
            <span className="eyebrow-dot" />
            What's happening in the world
          </div>
          <h2>The next meetups, live now</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {events.map(event => (
            <Link key={event.id} href={`/events/${event.id}`} className="card" style={{ textDecoration: 'none', display: 'block' }}>
              <div className="eyebrow" style={{ marginBottom: 12, display: 'inline-flex' }}>
                {event.type}
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: 8 }}>
                {event.title || `${event.type} meetup`}
              </h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: 6 }}>📍 {event.city}</p>
              <p style={{ color: 'var(--text-muted)', marginBottom: 16, fontSize: '0.85rem' }}>
                🕒 {event.time?.toDate ? new Date(event.time.toDate()).toLocaleString() : 'Date TBD'}
              </p>
              <p className="price-badge" style={{ display: 'inline-flex' }}>$2 to join</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── HowItWorks — avec ligne de progression ─────────────────────────────────
export function HowItWorks() {
  const steps = [
    { num: '01', icon: '📍', title: "Find tonight's event", desc: 'Browse small meetups near you — drinks, coffee, walks, dinners. Updated daily.' },
    { num: '02', icon: '✅', title: 'Join with one tap', desc: "Pay $2 to confirm your spot. Max 9 people. Your commitment makes it real." },
    { num: '03', icon: '🤝', title: 'Show up. Connect.', desc: 'Meet in real life. Every attendance builds your Trust Score.' },
  ]

  return (
    <section className="section-gap" style={{ background: 'var(--bg-soft)' }} id="how-it-works">
      <div className="container">
        <div className="section-header">
          <div className="eyebrow" style={{ margin: '0 auto 12px', width: 'fit-content' }}>
            <span className="eyebrow-dot" />
            How it works
          </div>
          <h2>Three steps.<br />One real connection.</h2>
        </div>

        <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          {/* Ligne de progression */}
          <div style={{
            position: 'absolute', top: 28, left: 'calc(16.6% + 12px)', right: 'calc(16.6% + 12px)',
            height: '2px',
            backgroundImage: 'repeating-linear-gradient(90deg, var(--coral) 0, var(--coral) 8px, transparent 8px, transparent 18px)',
            opacity: 0.3, pointerEvents: 'none', zIndex: 0,
          }} />

          {steps.map((s, i) => (
            <div key={s.num} className="card" style={{ position: 'relative', zIndex: 1 }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: 'var(--coral-pale)', border: '2px solid var(--coral-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '16px',
              }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 900, color: 'var(--coral)' }}>{s.num}</span>
              </div>
              <div style={{ fontSize: '1.7rem', marginBottom: '14px' }}>{s.icon}</div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, marginBottom: '8px' }}>{s.title}</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.65 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── StatsBar — fond sombre #0F0E0D ─────────────────────────────────────────
export function StatsBar() {
  const stats = [
    { n: '3K', unit: '+', l: 'Community members' },
    { n: '6–9', unit: '', l: 'People per event' },
    { n: '$', unit: '2', l: 'To join any meetup' },
    { n: '6', unit: '', l: 'Event types' },
  ]

  return (
    <div style={{ background: '#0F0E0D', padding: '52px 5%', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 0, flexWrap: 'wrap', maxWidth: '860px', margin: '0 auto' }}>
        {stats.map((s, i) => (
          <div key={s.n + s.unit} style={{
            textAlign: 'center', flex: '1 1 180px',
            padding: '12px 24px',
            borderRight: i < stats.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none',
          }}>
            <div style={{
              fontFamily: 'var(--font-display)', fontSize: 'clamp(2.2rem, 4vw, 3rem)',
              fontWeight: 900, color: '#fff', lineHeight: 1, marginBottom: '6px',
            }}>
              {s.n}<span style={{ color: 'var(--coral)' }}>{s.unit}</span>
            </div>
            <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '.04em' }}>{s.l}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── CitiesMarquee ─────────────────────────────────────────────────────────
export function CitiesMarquee() {
  const cities = ['🗺 London', '🗺 New York', '🗺 Berlin', '🗺 Paris',
    '🗺 Singapore', '🗺 Lisbon', '🗺 Toronto', '🗺 Barcelona',
    '🗺 Amsterdam', '🗺 Tokyo', '🗺 Melbourne', '🗺 Dubai', '🗺 Chennai']
  const doubled = [...cities, ...cities]

  return (
    <div style={{ background: 'var(--bg-soft)', padding: '40px 0', overflow: 'hidden' }}>
      <div className="container" style={{ textAlign: 'center' }}>
        <div className="eyebrow" style={{ margin: '0 auto 20px', width: 'fit-content' }}>
          <span className="eyebrow-dot" />
          Growing city by city
        </div>
        <div style={{ display: 'flex', gap: '12px', width: 'max-content' }} className="animate-marquee">
          {doubled.map((c, i) => (
            <span key={i} style={{
              background: '#fff', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-pill)', padding: '9px 20px',
              fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-mid)',
              whiteSpace: 'nowrap', boxShadow: 'var(--shadow-sm)',
            }}>
              {c}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── TrustSection — split bicolore ──────────────────────────────────────────
export function TrustSection() {
  const cards = [
    { icon: '⭐', title: 'Trust Score', desc: '+1 for every event you attend. −1 for no-shows. Your reputation travels with you.' },
    { icon: '👥', title: 'Small groups only', desc: '6–9 people. Everyone gets seen, heard, remembered. No crowds.' },
    { icon: '💳', title: 'Commitment by design', desc: "$2 to join isn't about money. It's a signal. People who pay, show up." },
    { icon: '🌍', title: 'Works in any city', desc: 'New city, same trust. Your score follows you wherever you go.' },
  ]

  return (
    <section style={{ overflow: 'hidden' }}>
      <div style={{
        maxWidth: '1080px', margin: '0 auto',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, alignItems: 'stretch',
      }}>
        {/* Colonne gauche — fond sombre */}
        <div style={{
          background: '#0F0E0D', padding: '80px 5% 80px 7%',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
        }}>
          <div className="eyebrow" style={{ marginBottom: '14px' }}>
            <span className="eyebrow-dot" />
            Safety & Trust
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 3.5vw, 2.8rem)',
            fontWeight: 900, color: '#F5F3F1', marginBottom: '16px', lineHeight: 1.1,
          }}>
            Built so you<br />actually{' '}
            <em style={{ fontStyle: 'italic', color: 'var(--coral)', fontWeight: 300 }}>show up.</em>
          </h2>
          <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.78, maxWidth: '380px' }}>
            Every feature is designed to make real meetings reliable. The $2 isn't the price — it's the promise.
          </p>
        </div>

        {/* Colonne droite — cards sur fond blanc */}
        <div style={{ background: '#fff', padding: '48px 5% 48px 4%', display: 'grid', gap: '12px', alignContent: 'center' }}>
          {cards.map(c => (
            <div key={c.title} className="card" style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div style={{
                width: 42, height: 42, minWidth: 42, borderRadius: 11,
                background: 'var(--coral-pale)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: '1.15rem',
              }}>
                {c.icon}
              </div>
              <div>
                <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', marginBottom: '3px' }}>
                  {c.title}
                </h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{c.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── FinalCTA — avec glow coral + prix $2 en grand ──────────────────────────
export function FinalCTA() {
  return (
    <section className="section-gap" style={{ paddingBottom: '100px' }}>
      <div className="container">
        <div style={{
          background: 'var(--bg-dark)', borderRadius: '28px', padding: '80px 5%',
          textAlign: 'center', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
            background: 'linear-gradient(90deg, var(--coral), #FF8F7A)',
          }} />

          {/* Glow central coral */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400, height: 400, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,107,81,0.16) 0%, transparent 68%)',
            pointerEvents: 'none',
          }} />

          <div className="eyebrow" style={{ margin: '0 auto 12px', width: 'fit-content', background: 'rgba(255,107,81,0.12)', borderColor: 'rgba(255,107,81,0.25)' }}>
            <span className="eyebrow-dot" />
            Ready?
          </div>

          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: 900, color: '#fff', marginBottom: '10px', position: 'relative', lineHeight: 1.1,
          }}>
            Your city is more<br />alive than you think.
          </h2>

          {/* Prix mis en avant */}
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <span className="price-badge" style={{ fontSize: 'clamp(3rem, 6vw, 4.5rem)', background: 'linear-gradient(135deg, var(--coral) 0%, #FF8F7A 100%)', backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent', display: 'inline-block' }}>
              $2
            </span>
            <span style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.4)', marginLeft: 10 }}>to join your first meetup</span>
          </div>

          <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, maxWidth: '380px', margin: '0 auto 32px', position: 'relative' }}>
            Join Ronda and meet someone worth knowing — tonight.
          </p>

          {/* Badge urgence */}
          <div className="live-badge" style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '24px',
            background: 'rgba(220,38,38,0.15)', borderColor: 'rgba(220,38,38,0.3)', color: '#FECACA',
          }}>
            <span className="dot" style={{ width: 7, height: 7, background: '#EF4444', borderRadius: '50%', animation: 'pulseDot 1.4s ease infinite', display: 'inline-block' }} />
            12 spots left tonight across all cities
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', position: 'relative' }}>
            <Link href="/events" className="btn-primary" style={{ boxShadow: '0 8px 28px rgba(255,107,81,0.4)' }}>
              Join your first meetup →
            </Link>
            <Link href="/create" className="btn-ghost" style={{ background: 'rgba(255,255,255,0.07)', color: '#fff', borderColor: 'rgba(255,255,255,0.12)' }}>
              Host a meetup
            </Link>
          </div>

          <p style={{ marginTop: 20, fontSize: '0.78rem', color: 'rgba(255,255,255,0.28)', position: 'relative' }}>
            🛡 Full refund if you don't love your first night. No questions asked.
          </p>
        </div>
      </div>
    </section>
  )
}

// ─── Footer — fond sombre #0F0E0D avec mini CTA ─────────────────────────────
export function Footer() {
  return (
    <footer style={{
      background: '#0F0E0D',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      padding: '36px 5%',
    }}>
      <div className="container" style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', flexWrap: 'wrap', gap: '20px',
      }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.4rem', color: 'var(--coral)', marginBottom: '4px' }}>
            ronda
          </div>
          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.28)' }}>Real meetups. Real people.</p>
        </div>

        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          <Link href="/events" style={{ fontSize: '0.83rem', color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>Events</Link>
          <a href="#how-it-works" style={{ fontSize: '0.83rem', color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>How it works</a>
          <Link href="/create" style={{ fontSize: '0.83rem', color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>Host</Link>
          <Link href="/terms" style={{ fontSize: '0.83rem', color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>Terms</Link>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
          <Link href="/events" className="btn-primary" style={{ padding: '8px 20px', fontSize: '0.82rem', boxShadow: '0 4px 14px rgba(255,107,81,0.3)' }}>
            Join now →
          </Link>
          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.18)' }}>© 2026 Ronda</p>
        </div>
      </div>
    </footer>
  )
}