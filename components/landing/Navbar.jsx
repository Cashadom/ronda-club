'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { onAuthChange } from '@/lib/auth'

export default function Navbar() {
  const [user, setUser] = useState(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const unsub = onAuthChange(setUser)
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => {
      unsub()
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  const linkStyle = {
    fontSize: '0.875rem',
    fontWeight: 500,
    color: 'var(--text-mid)',
    textDecoration: 'none',
    padding: '8px 10px',
    whiteSpace: 'nowrap',
  }

  const navHeight = 'clamp(60px, 8vw, 74px)'

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 200,
      width: '100%',
      height: navHeight,
      background: scrolled ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.92)',
      backdropFilter: 'blur(16px)',
      borderBottom: scrolled ? '1px solid var(--border)' : '1px solid rgba(0,0,0,0.04)',
      boxSizing: 'border-box',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 clamp(14px, 5vw, 40px)',
        height: navHeight,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}>
        <Link href="/" style={{
          display: 'flex',
          alignItems: 'center',
          minWidth: 0,
          flexShrink: 1,
        }}>
          <img
            src="/logo.png"
            alt="Ronda"
            style={{
              height: 'clamp(34px, 4vw, 48px)',
              width: 'auto',
              maxWidth: '170px',
              objectFit: 'contain',
              cursor: 'pointer',
              display: 'block',
            }}
          />
        </Link>

        <div style={{
          display: 'flex',
          gap: '4px',
          alignItems: 'center',
          flexShrink: 0,
        }}>
          {/* 🔥 LIEN EVENTS SUPPRIMÉ */}
          
          <Link href="/members" style={linkStyle}>Members</Link>

          {user ? (
            <>
              <Link href="/create" style={linkStyle}>Host</Link>

              <Link href="/profile" style={{
                width: 34,
                height: 34,
                minWidth: 34,
                borderRadius: '50%',
                background: 'var(--coral)',
                backgroundImage: user.photoURL ? `url(${user.photoURL})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.8rem',
                textDecoration: 'none',
                marginLeft: 4,
                border: '1px solid var(--coral-border)',
              }}>
                {user.displayName?.[0] || user.email?.[0] || 'U'}
              </Link>
            </>
          ) : (
            <Link href="/login" style={{
              background: 'var(--coral)',
              color: '#fff',
              padding: '9px 14px',
              borderRadius: 'var(--radius-pill)',
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              fontSize: '0.85rem',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              marginLeft: 4,
            }}>
              Join
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}