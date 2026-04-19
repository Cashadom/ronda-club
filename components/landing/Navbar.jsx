'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { onAuthChange, signOut } from '@/lib/auth'

export default function Navbar() {
  const [user, setUser]         = useState(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const unsub = onAuthChange(setUser)
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => { unsub(); window.removeEventListener('scroll', onScroll) }
  }, [])

  return (
    <nav style={{
      position:       'fixed',
      top:            0, left: 0, right: 0,
      zIndex:         200,
      display:        'flex',
      justifyContent: 'space-between',
      alignItems:     'center',
      padding:        '0 5%',
      height:         '64px',
      background:     scrolled ? 'rgba(255,255,255,0.95)' : 'transparent',
      backdropFilter: scrolled ? 'blur(16px)' : 'none',
      borderBottom:   scrolled ? '1px solid var(--border)' : 'none',
      transition:     'all 0.3s',
    }}>
      <Link href="/">
        <img 
          src="/logo.png"
          alt="Ronda"
          style={{
            height: 177,
            cursor: 'pointer'
          }}
        />
      </Link>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {user ? (
          <>
            <Link href="/events" style={{
              fontSize: '0.875rem', fontWeight: 500,
              color: 'var(--text-mid)', textDecoration: 'none',
              padding: '8px 14px',
            }}>
              Events
            </Link>
            <Link href="/create" style={{
              fontSize: '0.875rem', fontWeight: 500,
              color: 'var(--text-mid)', textDecoration: 'none',
              padding: '8px 14px',
            }}>
              Host
            </Link>
            <Link href="/profile" style={{
              width: 34, height: 32, borderRadius: '50%',
              background: user.photoURL ? 'transparent' : 'var(--coral)',
              backgroundImage: user.photoURL ? `url(${user.photoURL})` : 'none',
              backgroundSize: 'cover',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 700, fontSize: '0.8rem',
              textDecoration: 'none',
            }}>
              {!user.photoURL && user.displayName?.[0]}
            </Link>
          </>
        ) : (
          <>
            <Link href="/events" style={{
              fontSize: '0.875rem', fontWeight: 500,
              color: 'var(--text-mid)', textDecoration: 'none',
              padding: '8px 14px',
            }}>
              Events
            </Link>
            <Link href="/login" style={{
              background:     'var(--coral)',
              color:          '#fff',
              border:         'none',
              padding:        '9px 22px',
              borderRadius:   'var(--radius-pill)',
              fontFamily:     'var(--font-body)',
              fontWeight:     600,
              fontSize:       '0.875rem',
              textDecoration: 'none',
              transition:     'all 0.2s',
            }}>
              Join tonight →
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}