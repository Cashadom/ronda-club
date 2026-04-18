'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthChange, signOut } from '@/lib/auth'
import { getUserProfile, updateUserProfile, deleteUserAccount } from '@/lib/users'
import { getTrustLevel } from '@/lib/trust'
import { getUserEvents } from '@/lib/events'
import { Container } from '@/components/ui/index'
import TrustBadge from '@/components/events/TrustBadge'
import Button from '@/components/ui/Button'
import Link from 'next/link'

export default function ProfilePage() {
  const router = useRouter()
  const [user,    setUser]    = useState(undefined)
  const [profile, setProfile] = useState(null)
  const [events,  setEvents]  = useState([])
  const [editing, setEditing] = useState(false)
  const [name,    setName]    = useState('')
  const [city,    setCity]    = useState('')
  const [saving,  setSaving]  = useState(false)
  const [deleting,setDeleting]= useState(false)

  useEffect(() => {
    const unsub = onAuthChange(async u => {
      if (!u) { router.push('/login'); return }
      setUser(u)
      const p = await getUserProfile(u.uid)
      setProfile(p)
      setName(p?.name || '')
      setCity(p?.city || '')
      const ev = await getUserEvents(u.uid)
      setEvents(ev)
    })
    return () => unsub()
  }, [router])

  async function handleSave() {
    setSaving(true)
    await updateUserProfile(user.uid, { name, city: city.toLowerCase() })
    setProfile(p => ({ ...p, name, city: city.toLowerCase() }))
    setEditing(false)
    setSaving(false)
  }

  async function handleSignOut() {
    await signOut()
    router.push('/')
  }

  async function handleDelete() {
    if (!confirm('Delete your account and all data? This cannot be undone.')) return
    setDeleting(true)
    await deleteUserAccount(user.uid)
    await signOut()
    router.push('/')
  }

  if (!profile) {
    return (
      <div style={{ paddingTop: '120px', textAlign: 'center' }}>
        <div style={{ width: 32, height: 32, border: '3px solid var(--coral)',
          borderTopColor: 'transparent', borderRadius: '50%',
          animation: 'spin 0.7s linear infinite', margin: '0 auto' }} />
      </div>
    )
  }

  const level     = getTrustLevel(profile.trust_score || 0)
  const score     = profile.trust_score || 0

  return (
    <div style={{ paddingTop: '80px', minHeight: '100vh', background: '#fff' }}>
      <Container narrow>
        <div style={{ padding: '40px 0 80px' }}>

          {/* Avatar + name */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '36px',
          }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'var(--coral)',
              backgroundImage: user?.photoURL ? `url(${user.photoURL})` : 'none',
              backgroundSize: 'cover',
              border: '3px solid var(--coral-pale)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.8rem', fontFamily: 'var(--font-display)',
              fontWeight: 900, color: '#fff',
            }}>
              {!user?.photoURL && profile.name?.[0]}
            </div>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem',
                fontWeight: 900, color: 'var(--text)', marginBottom: '6px' }}>
                {profile.name}
              </h1>
              <TrustBadge score={score} showLabel />
            </div>
          </div>

          {/* Trust score card */}
          <div style={{
            background: 'var(--coral-pale)',
            border: '1px solid var(--coral-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '28px',
            marginBottom: '24px',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
            textAlign: 'center',
          }}>
            {[
              { label: 'Trust Score',    value: score },
              { label: 'Events Attended', value: profile.events_attended || 0 },
              { label: 'Events Hosted',   value: profile.events_hosted   || 0 },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem',
                  fontWeight: 900, color: 'var(--coral)', lineHeight: 1 }}>
                  {s.value}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)',
                  marginTop: '4px', fontWeight: 500 }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* Trust level */}
          <div style={{
            background: '#fff',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 20px',
            marginBottom: '28px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-mid)' }}>
              Trust level
            </span>
            <span style={{
              fontWeight: 700, fontSize: '0.875rem',
              color: level.color,
            }}>
              ★ {level.label}
            </span>
          </div>

          {/* Edit profile */}
          {editing ? (
            <div style={{
              background: 'var(--bg-soft)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)', padding: '24px', marginBottom: '24px',
            }}>
              <p style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '16px' }}>
                Edit profile
              </p>
              {[
                { label: 'Display name', value: name,  set: setName, placeholder: 'Your name' },
                { label: 'City',         value: city,  set: setCity, placeholder: 'e.g. Chennai' },
              ].map(f => (
                <div key={f.label} style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem',
                    fontWeight: 600, color: 'var(--text-mid)', marginBottom: '6px' }}>
                    {f.label}
                  </label>
                  <input
                    value={f.value}
                    onChange={e => f.set(e.target.value)}
                    placeholder={f.placeholder}
                    style={{
                      width: '100%', padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      border: '1.5px solid var(--border)',
                      fontFamily: 'var(--font-body)', fontSize: '0.9rem',
                      color: 'var(--text)', background: '#fff', outline: 'none',
                    }}
                  />
                </div>
              ))}
              <div style={{ display: 'flex', gap: '10px' }}>
                <Button onClick={handleSave} loading={saving} size="sm">Save</Button>
                <Button variant="secondary" onClick={() => setEditing(false)} size="sm">Cancel</Button>
              </div>
            </div>
          ) : (
            <Button variant="secondary" onClick={() => setEditing(true)}
              style={{ marginBottom: '24px', width: '100%' }}>
              Edit profile
            </Button>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Link href="/events" style={{
              display: 'block', padding: '13px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              textAlign: 'center', textDecoration: 'none',
              fontSize: '0.9rem', color: 'var(--text-mid)',
              fontWeight: 500,
            }}>
              Browse events →
            </Link>
            <button
              onClick={handleSignOut}
              style={{
                padding: '13px', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                background: 'none', fontFamily: 'var(--font-body)',
                fontSize: '0.9rem', color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              Sign out
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              style={{
                padding: '13px', borderRadius: 'var(--radius-md)',
                border: '1px solid #FCA5A5',
                background: 'none', fontFamily: 'var(--font-body)',
                fontSize: '0.85rem', color: '#DC2626',
                cursor: 'pointer', opacity: deleting ? 0.5 : 1,
              }}
            >
              {deleting ? 'Deleting…' : 'Delete account & all data'}
            </button>
          </div>

        </div>
      </Container>
    </div>
  )
}
