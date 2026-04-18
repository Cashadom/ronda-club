'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthChange } from '@/lib/auth'
import { fetchAllEvents, adminUpdateEventStatus, markAttendance } from '@/lib/events'
import { updateTrustScore, TRUST_DELTA } from '@/lib/trust'
import { getUserProfile, updateUserProfile } from '@/lib/users'
import { Container } from '@/components/ui/index'

const ADMIN_UIDS = (process.env.NEXT_PUBLIC_ADMIN_UIDS || '').split(',').filter(Boolean)

// Status badge colors
const STATUS_COLORS = {
  open:      { bg: '#DBEAFE', color: '#1E40AF' },
  confirmed: { bg: '#DCFCE7', color: '#166534' },
  full:      { bg: '#FEF3C7', color: '#92400E' },
  completed: { bg: '#F3F4F6', color: '#374151' },
  cancelled: { bg: '#FEE2E2', color: '#991B1B' },
}

export default function AdminPage() {
  const router = useRouter()
  const [user,    setUser]    = useState(undefined)
  const [events,  setEvents]  = useState([])
  const [loading, setLoading] = useState(true)
  const [tab,     setTab]     = useState('events')
  const [userUid, setUserUid] = useState('')
  const [userProfile, setUserProfile] = useState(null)
  const [trustAdj, setTrustAdj] = useState(0)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    const unsub = onAuthChange(u => {
      setUser(u)
      if (u && !ADMIN_UIDS.includes(u.uid)) {
        router.push('/')
      }
    })
    return () => unsub()
  }, [router])

  useEffect(() => {
    if (!user || !ADMIN_UIDS.includes(user.uid)) return
    loadEvents()
  }, [user])

  async function loadEvents() {
    setLoading(true)
    const ev = await fetchAllEvents(100)
    setEvents(ev)
    setLoading(false)
  }

  async function handleStatusChange(eventId, status) {
    await adminUpdateEventStatus(eventId, status)
    setEvents(ev => ev.map(e => e.id === eventId ? { ...e, status } : e))
    setMsg(`Event ${eventId.slice(0,6)} → ${status}`)
    setTimeout(() => setMsg(''), 3000)
  }

  async function lookupUser() {
    const p = await getUserProfile(userUid.trim())
    setUserProfile(p)
  }

  async function handleTrustAdjust() {
    if (!userProfile || trustAdj === 0) return
    await updateTrustScore(userProfile.id, trustAdj)
    setUserProfile(p => ({ ...p, trust_score: (p.trust_score || 0) + trustAdj }))
    setMsg(`Trust score adjusted by ${trustAdj > 0 ? '+' : ''}${trustAdj}`)
    setTimeout(() => setMsg(''), 3000)
    setTrustAdj(0)
  }

  if (user === undefined) return null
  if (!ADMIN_UIDS.includes(user?.uid)) return null

  return (
    <div style={{ paddingTop: '80px', minHeight: '100vh', background: 'var(--bg-soft)' }}>
      <Container>
        <div style={{ padding: '32px 0' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: '28px' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem',
              fontWeight: 900, color: 'var(--text)' }}>
              ⚙️ Admin
            </h1>
            <button onClick={loadEvents} style={{
              padding: '8px 16px', borderRadius: 'var(--radius-pill)',
              border: '1px solid var(--border)', background: '#fff',
              cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '0.85rem',
            }}>
              ↻ Refresh
            </button>
          </div>

          {/* Flash message */}
          {msg && (
            <div style={{ background: '#DCFCE7', border: '1px solid #BBF7D0',
              borderRadius: 'var(--radius-md)', padding: '12px 16px',
              marginBottom: '20px', fontSize: '0.875rem', color: '#166534' }}>
              ✓ {msg}
            </div>
          )}

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
            {['events', 'users'].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: '9px 20px', borderRadius: 'var(--radius-pill)',
                border: `1.5px solid ${tab === t ? 'var(--coral)' : 'var(--border)'}`,
                background: tab === t ? 'var(--coral-pale)' : '#fff',
                color: tab === t ? 'var(--coral)' : 'var(--text-mid)',
                fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
                fontFamily: 'var(--font-body)', textTransform: 'capitalize',
              }}>
                {t}
              </button>
            ))}
          </div>

          {/* ── Events tab ── */}
          {tab === 'events' && (
            <div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                {events.length} events total
              </p>
              {loading ? (
                <p style={{ color: 'var(--text-muted)' }}>Loading…</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {events.map(e => {
                    const sc = STATUS_COLORS[e.status] || STATUS_COLORS.open
                    return (
                      <div key={e.id} style={{
                        background: '#fff', borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border)', padding: '18px 20px',
                        display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center', flexWrap: 'wrap', gap: '12px',
                      }}>
                        <div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{
                              fontSize: '0.7rem', fontWeight: 700, padding: '3px 8px',
                              borderRadius: 'var(--radius-pill)',
                              background: sc.bg, color: sc.color,
                              textTransform: 'uppercase',
                            }}>
                              {e.status}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {e.type} · {e.city}
                            </span>
                          </div>
                          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)' }}>
                            {e.location_name}
                          </p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {e.participants_count}/{e.capacity_max} joined · ID: {e.id.slice(0,8)}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {['open','confirmed','completed','cancelled'].map(s => (
                            <button key={s} onClick={() => handleStatusChange(e.id, s)} style={{
                              padding: '5px 12px',
                              borderRadius: 'var(--radius-pill)',
                              border: '1px solid var(--border)',
                              background: e.status === s ? STATUS_COLORS[s]?.bg : '#fff',
                              color: e.status === s ? STATUS_COLORS[s]?.color : 'var(--text-muted)',
                              fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                              fontFamily: 'var(--font-body)',
                            }}>
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Users tab ── */}
          {tab === 'users' && (
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)',
                marginBottom: '16px' }}>
                Look up user by Firebase UID
              </p>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
                <input
                  value={userUid}
                  onChange={e => setUserUid(e.target.value)}
                  placeholder="Firebase UID"
                  style={{
                    flex: 1, padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1.5px solid var(--border)',
                    fontFamily: 'var(--font-body)', fontSize: '0.875rem',
                    color: 'var(--text)', outline: 'none',
                  }}
                />
                <button onClick={lookupUser} style={{
                  padding: '10px 20px', borderRadius: 'var(--radius-md)',
                  background: 'var(--coral)', color: '#fff', border: 'none',
                  fontFamily: 'var(--font-body)', fontWeight: 600, cursor: 'pointer',
                }}>
                  Look up
                </button>
              </div>

              {userProfile && (
                <div style={{
                  background: '#fff', borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border)', padding: '24px',
                }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px' }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: '50%',
                      background: 'var(--coral)',
                      backgroundImage: userProfile.photo_url ? `url(${userProfile.photo_url})` : 'none',
                      backgroundSize: 'cover',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontWeight: 700, fontSize: '1rem',
                    }}>
                      {!userProfile.photo_url && userProfile.name?.[0]}
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, color: 'var(--text)' }}>{userProfile.name}</p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Trust score: {userProfile.trust_score || 0} · City: {userProfile.city || '—'}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Attended: {userProfile.events_attended || 0} · Hosted: {userProfile.events_hosted || 0}
                      </p>
                    </div>
                  </div>

                  {/* Manual trust adjust */}
                  <div>
                    <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-mid)',
                      marginBottom: '10px' }}>
                      Manual trust score adjustment
                    </p>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {[-2,-1,+1,+2].map(d => (
                        <button key={d} onClick={() => setTrustAdj(d)} style={{
                          padding: '8px 16px', borderRadius: 'var(--radius-pill)',
                          border: `1.5px solid ${trustAdj === d ? 'var(--coral)' : 'var(--border)'}`,
                          background: trustAdj === d ? 'var(--coral-pale)' : '#fff',
                          color: trustAdj === d ? 'var(--coral)' : 'var(--text-mid)',
                          fontWeight: 700, cursor: 'pointer',
                          fontFamily: 'var(--font-body)', fontSize: '0.875rem',
                        }}>
                          {d > 0 ? `+${d}` : d}
                        </button>
                      ))}
                      <button onClick={handleTrustAdjust} disabled={trustAdj === 0} style={{
                        padding: '8px 20px', borderRadius: 'var(--radius-pill)',
                        background: 'var(--coral)', color: '#fff', border: 'none',
                        fontFamily: 'var(--font-body)', fontWeight: 600, cursor: 'pointer',
                        opacity: trustAdj === 0 ? 0.5 : 1,
                      }}>
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </Container>
    </div>
  )
}
