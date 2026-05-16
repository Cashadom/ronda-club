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
    fontSize: '0.85rem',
    fontWeight: 450,
    color: scrolled ? 'var(--text-mid)' : '#44403C',
    textDecoration: 'none',
    padding: '8px 12px',
    transition: 'color 0.2s ease',
  }

  const navHeight = 'clamp(62px, 8vw, 76px)'

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 200,
      width: '100%',
      height: navHeight,
      background: scrolled 
        ? 'rgba(255, 255, 255, 0.96)' 
        : 'rgba(255, 255, 255, 0.88)',
      backdropFilter: 'blur(20px)',
      borderBottom: scrolled 
        ? '1px solid rgba(0, 0, 0, 0.05)' 
        : '1px solid rgba(0, 0, 0, 0.03)',
      transition: 'background 0.3s ease, border-color 0.3s ease',
      boxSizing: 'border-box',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '0 clamp(20px, 5vw, 48px)',
        height: navHeight,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxSizing: 'border-box',
      }}>
        {/* Logo */}
        <Link href="/" style={{
          display: 'flex',
          alignItems: 'center',
          transition: 'opacity 0.2s',
        }}>
          <img
            src="/logo.png"
            alt="Ronda"
            style={{
              height: 'clamp(32px, 3.8vw, 44px)',
              width: 'auto',
              objectFit: 'contain',
              display: 'block',
            }}
          />
        </Link>

        {/* Navigation links */}
        <div style={{
          display: 'flex',
          gap: '6px',
          alignItems: 'center',
        }}>
          <Link 
            href="/members" 
            style={linkStyle}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--coral)'}
            onMouseLeave={e => e.currentTarget.style.color = scrolled ? 'var(--text-mid)' : '#44403C'}
          >
            Community
          </Link>

          {user ? (
            <>
              <Link 
                href="/create" 
                style={linkStyle}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--coral)'}
                onMouseLeave={e => e.currentTarget.style.color = scrolled ? 'var(--text-mid)' : '#44403C'}
              >
                Host
              </Link>

              <Link 
                href="/profile" 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginLeft: 6,
                  textDecoration: 'none',
                }}
              >
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: user.photoURL ? `url(${user.photoURL})` : 'linear-gradient(135deg, var(--coral), #FF8F7A)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 500,
                  fontSize: '0.85rem',
                  border: '1.5px solid rgba(255,107,81,0.2)',
                  transition: 'transform 0.2s ease, border-color 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'scale(1.02)'
                  e.currentTarget.style.borderColor = 'var(--coral)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.borderColor = 'rgba(255,107,81,0.2)'
                }}>
                  {!user.photoURL && (user.displayName?.[0] || user.email?.[0] || 'U')}
                </div>
              </Link>
            </>
          ) : (
            <Link 
              href="/login" 
              style={{
                background: 'transparent',
                color: 'var(--coral)',
                padding: '7px 20px',
                borderRadius: 40,
                fontFamily: 'var(--font-body)',
                fontWeight: 500,
                fontSize: '0.85rem',
                textDecoration: 'none',
                border: '1.5px solid var(--coral-border)',
                transition: 'all 0.2s ease',
                marginLeft: 4,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--coral)'
                e.currentTarget.style.color = '#fff'
                e.currentTarget.style.borderColor = 'var(--coral)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--coral)'
                e.currentTarget.style.borderColor = 'var(--coral-border)'
              }}
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}