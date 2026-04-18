'use client'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { onAuthChange } from '@/lib/auth'
import { getUserProfile } from '@/lib/users'
import CreateEventForm from '@/components/events/CreateEventForm'
import { Container } from '@/components/ui/index'
import Link from 'next/link'

// Composant interne qui utilise useSearchParams
function CreatePageContent() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const [user,    setUser]    = useState(undefined)
  const [profile, setProfile] = useState(null)

  const justCreated = searchParams.get('created') === '1'

  useEffect(() => {
    const unsub = onAuthChange(async u => {
      setUser(u)
      if (u) {
        const p = await getUserProfile(u.uid)
        setProfile(p)
      }
    })
    return () => unsub()
  }, [])

  // Redirect to login if not authenticated
  useEffect(() => {
    if (user === null) {
      router.push('/login?redirect=/create')
    }
  }, [user, router])

  if (user === undefined) {
    return (
      <div style={{ paddingTop: '120px', textAlign: 'center' }}>
        <div style={{ width: 32, height: 32, border: '3px solid var(--coral)',
          borderTopColor: 'transparent', borderRadius: '50%',
          animation: 'spin 0.7s linear infinite', margin: '0 auto' }} />
      </div>
    )
  }

  if (justCreated) {
    return (
      <div style={{ paddingTop: '120px', textAlign: 'center', padding: '120px 5%' }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎉</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem',
          fontWeight: 900, color: 'var(--text)', marginBottom: '12px' }}>
          Event created!
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '32px', lineHeight: 1.7 }}>
          Your event is now live. Share the link with your community<br />
          and wait for people to join.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/events" style={{
            background: 'var(--coral)', color: '#fff',
            padding: '13px 28px', borderRadius: 'var(--radius-pill)',
            fontFamily: 'var(--font-body)', fontWeight: 600, textDecoration: 'none',
          }}>
            See all events
          </Link>
          <Link href="/create" style={{
            background: '#fff', color: 'var(--text)',
            border: '1.5px solid var(--border)',
            padding: '13px 28px', borderRadius: 'var(--radius-pill)',
            fontFamily: 'var(--font-body)', fontWeight: 500, textDecoration: 'none',
          }}>
            Host another
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ paddingTop: '80px', minHeight: '100vh', background: '#fff' }}>
      <Container narrow>
        <div style={{ padding: '40px 0 80px' }}>

          {/* Header */}
          <div style={{ marginBottom: '40px' }}>
            <Link href="/events" style={{
              fontSize: '0.875rem', color: 'var(--text-muted)',
              textDecoration: 'none', display: 'inline-flex',
              alignItems: 'center', gap: '6px', marginBottom: '24px',
            }}>
              ← Back
            </Link>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '2px',
              textTransform: 'uppercase', color: 'var(--coral)', marginBottom: '8px' }}>
              Host an event
            </p>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem',
              fontWeight: 900, color: 'var(--text)', marginBottom: '8px' }}>
              Create tonight's meetup
            </h1>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Takes 30 seconds. $2 host fee. Event goes live immediately.
            </p>
          </div>

          <CreateEventForm
            userId={user?.uid}
            userCity={profile?.city || ''}
          />
        </div>
      </Container>
    </div>
  )
}

// Export principal avec Suspense
export default function CreatePage() {
  return (
    <Suspense fallback={
      <div style={{ paddingTop: '120px', textAlign: 'center' }}>
        <div style={{ width: 32, height: 32, border: '3px solid var(--coral)',
          borderTopColor: 'transparent', borderRadius: '50%',
          animation: 'spin 0.7s linear infinite', margin: '0 auto' }} />
      </div>
    }>
      <CreatePageContent />
    </Suspense>
  )
}