'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Users, Heart, MapPin, Star } from 'lucide-react'
import {
  collection,
  getDocs,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

const CORAL = '#FF7F50'
const CORAL_PALE = '#FFF0EB'

function pickColor(seed = '') {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h << 5) - h + seed.charCodeAt(i)
  return Math.abs(h) % 2 === 0 ? CORAL : CORAL_PALE
}

function getInitials(name) {
  if (!name || name === 'Anonymous') return '?'
  const clean = name.replace(/[^a-zA-Z]/g, '').toUpperCase()
  return clean.slice(0, 2)
}

export default function MembersPage() {
  const router = useRouter()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [visibleCount, setVisibleCount] = useState(30)

  useEffect(() => {
    async function fetchMembers() {
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'))
        const users = usersSnapshot.docs.map(doc => ({
          uid: doc.id,
          name: doc.data().name || doc.data().displayName || doc.data().username || 'Ronda member',
          photoUrl: doc.data().photo_url || doc.data().photoURL || '',
          trustScore: doc.data().trust_score || 0,
          city: doc.data().city || '',
          eventsAttended: doc.data().events_attended || 0,
        }))
        const sortedMembers = users.sort((a, b) => b.trustScore - a.trustScore)
        setMembers(sortedMembers)
      } catch (err) {
        console.error('Error loading members:', err)
        setError('Please sign up to see the community')
      } finally {
        setLoading(false)
      }
    }
    fetchMembers()
  }, [])

  const loadMore = () => setVisibleCount(prev => prev + 30)
  const visibleMembers = members.slice(0, visibleCount)
  const hasMore = visibleCount < members.length
  const totalMembers = members.length

  return (
    <div style={{ minHeight: '100vh', background: '#faf9f7', padding: 'clamp(24px, 5vw, 40px)' }}>
      {/* Header minimal */}
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <button
            onClick={() => router.back()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'transparent',
              border: 'none',
              color: 'var(--text-mid)',
              fontSize: '0.85rem',
              fontWeight: 450,
              cursor: 'pointer',
              padding: '8px 16px',
              borderRadius: 40,
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#f0ede9'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <ArrowLeft size={16} />
            Back
          </button>
        </div>

        {/* Title + subtitle */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{
            display: 'inline-block',
            padding: '4px 12px',
            borderRadius: 40,
            background: CORAL_PALE,
            color: CORAL,
            fontSize: '0.7rem',
            fontWeight: 500,
            marginBottom: 16,
          }}>
            Join the community
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: 400,
            color: 'var(--text)',
            marginBottom: 12,
            letterSpacing: '-0.3px',
          }}>
            Meet the Ronda community
          </h1>
          <p style={{ color: 'var(--text-mid)', maxWidth: 480, margin: '0 auto', lineHeight: 1.6 }}>
            {totalMembers > 0 
              ? `${totalMembers} people already making real connections. Ready to join them?`
              : 'People who turn real-life meetings into lasting friendships.'}
          </p>
        </div>

        {error && (
          <div style={{
            background: '#fff0ed', color: CORAL, padding: '12px 20px', borderRadius: 40, textAlign: 'center', marginBottom: 32
          }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: 20,
          }}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} style={{ textAlign: 'center', animation: 'pulse 1.5s infinite' }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#e8e5e1', margin: '0 auto 12px' }} />
                <div style={{ width: '60%', height: 12, background: '#e8e5e1', margin: '0 auto 6px', borderRadius: 20 }} />
                <div style={{ width: '40%', height: 10, background: '#e8e5e1', margin: '0 auto', borderRadius: 20 }} />
              </div>
            ))}
          </div>
        ) : members.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 32, border: '1px solid #f0ede9' }}>
            <Users size={48} style={{ margin: '0 auto 16px', color: CORAL }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 500, marginBottom: 8 }}>The community is growing</h3>
            <p style={{ color: 'var(--text-mid)' }}>Be among the first to join Ronda.</p>
            <button
              onClick={() => router.push('/create')}
              style={{
                marginTop: 24,
                background: 'transparent',
                color: CORAL,
                border: '1px solid var(--coral-border)',
                padding: '10px 28px',
                borderRadius: 40,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Host a social night →
            </button>
          </div>
        ) : (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: 24,
            }}>
              {visibleMembers.map((member) => {
                const bgColor = pickColor(member.uid)
                const initials = getInitials(member.name)
                return (
                  <div
                    key={member.uid}
                    style={{
                      background: '#fff',
                      borderRadius: 28,
                      padding: '24px 16px 20px',
                      textAlign: 'center',
                      border: '1px solid #f0ede9',
                      transition: 'all 0.25s ease',
                      cursor: 'default',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-4px)'
                      e.currentTarget.style.boxShadow = '0 20px 32px -12px rgba(0,0,0,0.08)'
                      e.currentTarget.style.borderColor = CORAL_PALE
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none'
                      e.currentTarget.style.borderColor = '#f0ede9'
                    }}
                  >
                    <div
                      style={{
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, ${bgColor === CORAL ? CORAL : CORAL_PALE}, ${bgColor === CORAL ? '#FF9F7A' : '#FFE0D5'})`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 14px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                      }}
                    >
                      <span style={{ fontSize: '1.5rem', fontWeight: 500, color: bgColor === CORAL ? '#fff' : CORAL }}>
                        {initials}
                      </span>
                    </div>

                    <h3 style={{
                      fontSize: '0.95rem',
                      fontWeight: 500,
                      color: 'var(--text)',
                      marginBottom: 4,
                    }}>
                      {member.name}
                    </h3>

                    {member.city && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 8 }}>
                        <MapPin size={10} style={{ color: 'var(--text-muted)' }} />
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-mid)' }}>{member.city.split(',')[0]}</span>
                      </div>
                    )}

                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      background: CORAL_PALE,
                      padding: '3px 10px',
                      borderRadius: 40,
                    }}>
                      <Star size={10} style={{ color: CORAL, fill: CORAL }} />
                      <span style={{ fontSize: '0.65rem', fontWeight: 500, color: CORAL }}>
                        {member.trustScore} pts
                      </span>
                    </div>

                    {member.eventsAttended > 0 && (
                      <div style={{ marginTop: 10, fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                        {member.eventsAttended} night{member.eventsAttended !== 1 ? 's' : ''} attended
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {hasMore && (
              <div style={{ textAlign: 'center', marginTop: 48 }}>
                <button
                  onClick={loadMore}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    padding: '10px 28px',
                    borderRadius: 40,
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    color: 'var(--text-mid)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = CORAL
                    e.currentTarget.style.color = CORAL
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border)'
                    e.currentTarget.style.color = 'var(--text-mid)'
                  }}
                >
                  Show more members
                </button>
              </div>
            )}

            {/* CTA for non-members (always visible, even if not logged in) */}
            <div style={{
              marginTop: 64,
              textAlign: 'center',
              padding: '40px 24px',
              background: '#fff',
              borderRadius: 32,
              border: '1px solid #f0ede9',
            }}>
              <Heart size={28} style={{ margin: '0 auto 12px', color: CORAL }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 500, marginBottom: 8 }}>Not part of the community yet?</h3>
              <p style={{ color: 'var(--text-mid)', fontSize: '0.85rem', marginBottom: 20 }}>
                Join a social night and start meeting people for real.
              </p>
              <button
                onClick={() => router.push('/events')}
                style={{
                  background: CORAL,
                  color: '#fff',
                  border: 'none',
                  padding: '10px 28px',
                  borderRadius: 40,
                  fontWeight: 500,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                Join a social night →
              </button>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}