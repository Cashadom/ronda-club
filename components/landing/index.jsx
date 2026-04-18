// ─── HeroSection.jsx ──────────────────────────────────────────────────────
'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import UpcomingMeetups from "@/components/landing/UpcomingMeetups"

export function HeroSection() {
  return (
    <section style={{
      minHeight:      '100vh',
      display:        'flex',
      flexDirection:  'column',
      justifyContent: 'center',
      alignItems:     'center',
      textAlign:      'center',
      padding:        '120px 5% 80px',
      position:       'relative',
      overflow:       'hidden',
      backgroundImage: 'url(/header.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }}>
      {/* Voile blanc pour lisibilité */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(255,255,255,0.78)',
      }} />

      {/* Top accent */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: '4px',
        background: 'linear-gradient(90deg, var(--coral), #FF8F7A, var(--coral))',
        zIndex: 2,
      }} />

      {/* Blobs */}
      <div style={{ position:'absolute', width:560, height:560, borderRadius:'50%',
        background:'rgba(255,107,81,0.07)', top:-80, right:-120, filter:'blur(90px)', pointerEvents:'none', zIndex: 1 }} />
      <div style={{ position:'absolute', width:380, height:380, borderRadius:'50%',
        background:'rgba(255,107,81,0.05)', bottom:-40, left:-80, filter:'blur(80px)', pointerEvents:'none', zIndex: 1 }} />

      <div style={{ position:'relative', maxWidth:'860px', zIndex: 2 }}>
        {/* Pill */}
        <div className="animate-fadeUp" style={{
          display:'inline-flex', alignItems:'center', gap:'7px',
          background:'var(--coral-pale)', border:'1px solid var(--coral-border)',
          color:'var(--coral)', fontSize:'0.78rem', fontWeight:700,
          letterSpacing:'1.2px', textTransform:'uppercase',
          padding:'6px 16px', borderRadius:'var(--radius-pill)', marginBottom:'32px',
        }}>
          <span className="animate-pulse" style={{ width:6, height:6, borderRadius:'50%', background:'var(--coral)' }} />
          Live in cities worldwide
        </div>

        <h1 className="animate-fadeUp delay-1" style={{
          fontFamily:   'var(--font-display)',
          fontSize:     'clamp(2.8rem, 7.5vw, 5.8rem)',
          fontWeight:   900,
          lineHeight:   1.04,
          letterSpacing:'-2.5px',
          color:        'var(--text)',
          marginBottom: '24px',
        }}>
          In every city,<br />people cross paths.<br />
          <em style={{ fontStyle:'italic', fontWeight:300, color:'var(--coral)' }}>
            But rarely connect.
          </em>
        </h1>

        <p className="animate-fadeUp delay-2" style={{
          fontSize:'clamp(1rem, 2vw, 1.2rem)', color:'var(--text-muted)',
          lineHeight:1.7, maxWidth:'480px', margin:'0 auto 44px',
        }}>
          Ronda makes real-life meetings simple.<br />
          Small groups. Real presence. One tap.
        </p>

        <div className="animate-fadeUp delay-3" style={{ display:'flex', gap:'12px', justifyContent:'center', flexWrap:'wrap' }}>
          <Link href="/events" style={{
            display:'inline-flex', alignItems:'center', gap:'8px',
            background:'var(--coral)', color:'#fff',
            padding:'15px 32px', borderRadius:'var(--radius-pill)',
            fontFamily:'var(--font-body)', fontWeight:600, fontSize:'1rem',
            textDecoration:'none', boxShadow:'var(--coral-shadow)',
            transition:'all 0.22s',
          }}>
            Join tonight's meetup →
          </Link>
          <Link href="/create" style={{
            display:'inline-flex', alignItems:'center',
            background:'#fff', color:'var(--text)',
            border:'1.5px solid var(--border)',
            padding:'15px 32px', borderRadius:'var(--radius-pill)',
            fontFamily:'var(--font-body)', fontWeight:500, fontSize:'1rem',
            textDecoration:'none', transition:'all 0.22s',
          }}>
            Host a meetup
          </Link>
        </div>

        {/* Social proof */}
        <div className="animate-fadeUp delay-4" style={{
          display:'flex', alignItems:'center', gap:'14px',
          justifyContent:'center', marginTop:'52px',
        }}>
          <div style={{ display:'flex' }}>
            {['#FF6B51','#3B82F6','#10B981','#F59E0B','#8B5CF6'].map((bg, i) => (
              <div key={i} style={{
                width:36, height:36, borderRadius:'50%',
                border:'2.5px solid #fff',
                marginLeft: i === 0 ? 0 : -9,
                background:bg,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:'0.75rem', fontWeight:700, color:'#fff',
              }}>
                {['A','K','R','M','P'][i]}
              </div>
            ))}
          </div>
          <p style={{ fontSize:'0.88rem', color:'var(--text-muted)' }}>
            <strong style={{ color:'var(--text)' }}>3,000+ people</strong> already in the community
          </p>
        </div>
      </div>
    </section>
  )
}

// ─── UpcomingEventsSection.jsx ────────────────────────────────────────────
// NOTE: Ce composant est temporaire. Utilise UpcomingMeetups à la place.
export function UpcomingEventsSection() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadEvents() {
      try {
        // Temporairement vide - utiliser fetchUpcomingMeetupsGlobal à la place
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
      <section style={{ padding: '80px 5%', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>Loading events...</p>
        </div>
      </section>
    )
  }

  if (events.length === 0) {
    return (
      <section style={{ padding: '80px 5%', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>No upcoming events yet. Be the first to host one!</p>
        </div>
      </section>
    )
  }

  return (
    <section style={{ padding: '80px 5%', background: '#fff' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <p style={{
          fontSize: '0.75rem',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          color: 'var(--coral)',
          fontWeight: 700,
          marginBottom: 12
        }}>
          What's happening in the world
        </p>

        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2rem, 4vw, 3rem)',
          fontWeight: 900,
          color: 'var(--text)',
          marginBottom: 30
        }}>
          The next meetups, live now
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 20
        }}>
          {events.map(event => (
            <Link
              key={event.id}
              href={`/events/${event.id}`}
              style={{
                textDecoration: 'none',
                color: 'inherit',
                background: '#fff',
                border: '1px solid var(--border)',
                borderRadius: 20,
                padding: 20,
                boxShadow: 'var(--shadow-sm)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
              }}
            >
              <div style={{
                display: 'inline-block',
                padding: '6px 12px',
                borderRadius: 999,
                background: 'var(--coral-pale)',
                color: 'var(--coral)',
                fontWeight: 700,
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                marginBottom: 12
              }}>
                {event.type}
              </div>

              <h3 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.2rem',
                marginBottom: 8,
                color: 'var(--text)'
              }}>
                {event.title || `${event.type} meetup`}
              </h3>

              <p style={{ color: 'var(--text-muted)', marginBottom: 6, fontSize: '0.9rem' }}>
                📍 {event.city}
              </p>

              <p style={{ color: 'var(--text-muted)', marginBottom: 16, fontSize: '0.85rem' }}>
                🕒 {event.time?.toDate ? new Date(event.time.toDate()).toLocaleString() : 'Date TBD'}
              </p>

              <p style={{ fontWeight: 600, color: 'var(--coral)', fontSize: '0.9rem' }}>
                Join for $2 →
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── HowItWorks.jsx ────────────────────────────────────────────────────────
export function HowItWorks() {
  const steps = [
    { num:'01', icon:'📍', title:'Find tonight\'s event', desc:'Browse small meetups near you — drinks, coffee, walks, dinners. Updated daily.' },
    { num:'02', icon:'✅', title:'Join with one tap', desc:'Pay $2 to confirm your spot. Max 9 people. Your commitment makes it real.' },
    { num:'03', icon:'🤝', title:'Show up. Connect.', desc:'Meet in real life. Every attendance builds your Trust Score.' },
  ]

  return (
    <section style={{ background:'var(--bg-soft)', padding:'100px 5%' }}>
      <div style={{ maxWidth:'1080px', margin:'0 auto' }}>
        <p style={{ fontSize:'0.72rem', fontWeight:700, letterSpacing:'2px',
          textTransform:'uppercase', color:'var(--coral)', marginBottom:'12px' }}>
          How it works
        </p>
        <h2 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(2rem, 4vw, 3rem)',
          fontWeight:900, color:'var(--text)', marginBottom:'60px' }}>
          Three steps.<br />One real connection.
        </h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:'24px' }}>
          {steps.map(s => (
            <div key={s.num} style={{
              background:'#fff', borderRadius:'var(--radius-lg)', padding:'32px',
              border:'1px solid var(--border)', boxShadow:'var(--shadow-sm)',
            }}>
              <div style={{ fontFamily:'var(--font-display)', fontSize:'3.5rem',
                fontWeight:900, color:'var(--coral-pale)', lineHeight:1, marginBottom:'4px' }}>
                <span style={{ color:'var(--coral)' }}>{s.num}</span>
              </div>
              <div style={{ fontSize:'1.6rem', marginBottom:'14px' }}>{s.icon}</div>
              <h3 style={{ fontFamily:'var(--font-display)', fontSize:'1.15rem',
                fontWeight:700, color:'var(--text)', marginBottom:'8px' }}>{s.title}</h3>
              <p style={{ fontSize:'0.88rem', color:'var(--text-muted)', lineHeight:1.65 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── StatsBar.jsx ──────────────────────────────────────────────────────────
export function StatsBar() {
  const stats = [
    { n:'3K+',  l:'Community members' },
    { n:'6–9',  l:'People per event'  },
    { n:'$2',   l:'To join any meetup'},
    { n:'6',    l:'Event types'       },
  ]

  return (
    <div style={{ background:'var(--coral)', padding:'56px 5%' }}>
      <div style={{ display:'flex', justifyContent:'center', gap:'72px',
        flexWrap:'wrap', maxWidth:'900px', margin:'0 auto' }}>
        {stats.map(s => (
          <div key={s.n} style={{ textAlign:'center' }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:'3rem',
              fontWeight:900, color:'#fff', lineHeight:1, marginBottom:'4px' }}>{s.n}</div>
            <div style={{ fontSize:'0.85rem', color:'rgba(255,255,255,0.72)' }}>{s.l}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── CitiesMarquee.jsx ─────────────────────────────────────────────────────
export function CitiesMarquee() {
  const cities = ['🗺 London','🗺 New York','🗺 Berlin','🗺 Paris',
    '🗺 Singapore','🗺 Lisbon','🗺 Toronto','🗺 Barcelona',
    '🗺 Amsterdam','🗺 Tokyo','🗺 Melbourne','🗺 Dubai','🗺 Chennai']

  const doubled = [...cities, ...cities]

  return (
    <div style={{ background:'var(--bg-soft)', padding:'40px 0', overflow:'hidden' }}>
      <p style={{ textAlign:'center', fontSize:'0.72rem', letterSpacing:'2px',
        textTransform:'uppercase', color:'var(--text-muted)', fontWeight:600,
        marginBottom:'20px' }}>
        Growing city by city
      </p>
      <div style={{ display:'flex', gap:'12px', width:'max-content' }}
        className="animate-marquee">
        {doubled.map((c, i) => (
          <span key={i} style={{
            background:'#fff', border:'1px solid var(--border)',
            borderRadius:'var(--radius-pill)', padding:'9px 20px',
            fontSize:'0.85rem', fontWeight:500, color:'var(--text-mid)',
            whiteSpace:'nowrap', boxShadow:'var(--shadow-sm)',
          }}>
            {c}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── TrustSection.jsx ──────────────────────────────────────────────────────
export function TrustSection() {
  const cards = [
    { icon:'⭐', title:'Trust Score', desc:'+1 for every event you attend. −1 for no-shows. Your reputation travels with you.' },
    { icon:'👥', title:'Small groups only', desc:'6–9 people. Everyone gets seen, heard, remembered. No crowds.' },
    { icon:'💳', title:'Commitment by design', desc:'$2 to join isn\'t about money. It\'s a signal. People who pay, show up.' },
    { icon:'🌍', title:'Works in any city', desc:'New city, same trust. Your score follows you wherever you go.' },
  ]

  return (
    <section style={{ padding:'100px 5%' }}>
      <div style={{ maxWidth:'1080px', margin:'0 auto',
        display:'grid', gridTemplateColumns:'1fr 1fr', gap:'80px', alignItems:'center' }}>
        <div>
          <p style={{ fontSize:'0.72rem', fontWeight:700, letterSpacing:'2px',
            textTransform:'uppercase', color:'var(--coral)', marginBottom:'12px' }}>
            Safety & Trust
          </p>
          <h2 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(2rem, 4vw, 3rem)',
            fontWeight:900, color:'var(--text)', marginBottom:'16px', lineHeight:1.1 }}>
            Built so you<br />actually{' '}
            <em style={{ fontStyle:'italic', color:'var(--coral)', fontWeight:300 }}>show up.</em>
          </h2>
          <p style={{ fontSize:'1rem', color:'var(--text-muted)', lineHeight:1.75, maxWidth:'420px' }}>
            Every feature is designed to make real meetings reliable. The $2 isn't the price — it's the promise.
          </p>
        </div>
        <div style={{ display:'grid', gap:'14px' }}>
          {cards.map(c => (
            <div key={c.title} style={{
              background:'#fff', borderRadius:'var(--radius-lg)', padding:'22px',
              border:'1px solid var(--border)', boxShadow:'var(--shadow-sm)',
              display:'flex', gap:'14px', alignItems:'flex-start',
            }}>
              <div style={{ width:44, height:44, minWidth:44, borderRadius:12,
                background:'var(--coral-pale)', display:'flex', alignItems:'center',
                justifyContent:'center', fontSize:'1.2rem' }}>
                {c.icon}
              </div>
              <div>
                <h4 style={{ fontFamily:'var(--font-display)', fontWeight:700,
                  fontSize:'0.95rem', color:'var(--text)', marginBottom:'4px' }}>
                  {c.title}
                </h4>
                <p style={{ fontSize:'0.82rem', color:'var(--text-muted)', lineHeight:1.6 }}>
                  {c.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── FinalCTA.jsx ──────────────────────────────────────────────────────────
export function FinalCTA() {
  return (
    <section style={{ padding:'80px 5% 100px' }}>
      <div style={{ maxWidth:'1080px', margin:'0 auto' }}>
        <div style={{
          background:'var(--text)', borderRadius:'28px', padding:'72px 5%',
          textAlign:'center', position:'relative', overflow:'hidden',
        }}>
          <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px',
            background:'linear-gradient(90deg, var(--coral), #FF8F7A)' }} />
          <p style={{ fontSize:'0.72rem', fontWeight:700, letterSpacing:'2px',
            textTransform:'uppercase', color:'#FF8F7A', marginBottom:'12px' }}>
            Ready?
          </p>
          <h2 style={{ fontFamily:'var(--font-display)', fontSize:'clamp(2rem, 4vw, 3rem)',
            fontWeight:900, color:'#fff', marginBottom:'16px' }}>
            Your city is more<br />alive than you think.
          </h2>
          <p style={{ fontSize:'1rem', color:'rgba(255,255,255,0.55)',
            lineHeight:1.7, maxWidth:'400px', margin:'0 auto 44px' }}>
            Join Ronda and meet someone worth knowing — tonight.
          </p>
          <div style={{ display:'flex', gap:'12px', justifyContent:'center', flexWrap:'wrap' }}>
            <Link href="/events" style={{
              background:'var(--coral)', color:'#fff',
              padding:'15px 32px', borderRadius:'var(--radius-pill)',
              fontFamily:'var(--font-body)', fontWeight:600, fontSize:'1rem',
              textDecoration:'none', boxShadow:'var(--coral-shadow)',
            }}>
              Join your first meetup →
            </Link>
            <Link href="/create" style={{
              background:'rgba(255,255,255,0.08)', color:'#fff',
              border:'1.5px solid rgba(255,255,255,0.15)',
              padding:'15px 32px', borderRadius:'var(--radius-pill)',
              fontFamily:'var(--font-body)', fontWeight:500, fontSize:'1rem',
              textDecoration:'none',
            }}>
              Host a meetup
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Footer.jsx ────────────────────────────────────────────────────────────
export function Footer() {
  return (
    <footer style={{
      background:'var(--bg-soft)', borderTop:'1px solid var(--border)',
      padding:'40px 5%',
      display:'flex', justifyContent:'space-between',
      alignItems:'center', flexWrap:'wrap', gap:'16px',
    }}>
      <div style={{ fontFamily:'var(--font-display)', fontWeight:900,
        fontSize:'1.3rem', color:'var(--coral)' }}>
        ronda
      </div>
      <div style={{ display:'flex', gap:'24px' }}>
        {['Events','How it works','Host','Terms'].map(l => (
          <a key={l} href="#" style={{
            fontSize:'0.85rem', color:'var(--text-muted)',
            textDecoration:'none',
          }}>
            {l}
          </a>
        ))}
      </div>
      <p style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>
        © 2026 Ronda · Real meetups. Real people.
      </p>
    </footer>
  )
}