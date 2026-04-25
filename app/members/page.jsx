'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Users } from 'lucide-react'
import {
  collection,
  getDocs,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

const CORAL = '#FF7F50'
const CORAL_PALE = '#FFF0EB'

// Fonction pour générer une couleur de fond à partir d'un seed
function pickColor(seed = '') {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h << 5) - h + seed.charCodeAt(i)
  return Math.abs(h) % 2 === 0 ? CORAL : CORAL_PALE
}

// Fonction pour obtenir l'initiale (2-3 lettres max)
function getInitials(name) {
  if (!name || name === 'Anonymous') return '?'
  const clean = name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
  return clean.slice(0, 3)
}

export default function MembersPage() {
  const router = useRouter()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [visibleCount, setVisibleCount] = useState(50)

  useEffect(() => {
    async function fetchMembers() {
      try {
        console.log('🔍 [Members] Fetching users from Firestore...')

        // 🔥 Une seule requête pour tous les utilisateurs
        const usersSnapshot = await getDocs(collection(db, 'users'))
        console.log(`📊 [Members] Found ${usersSnapshot.docs.length} users`)

        const users = usersSnapshot.docs.map(doc => ({
          uid: doc.id,
          name: doc.data().name || doc.data().displayName || doc.data().username || doc.id.slice(0, 8),
          photoUrl: doc.data().photo_url || doc.data().photoURL || '',
          trustScore: doc.data().trust_score || 0,
          city: doc.data().city || '',
        }))

        // Trier par trust score (les plus actifs en premier)
        const sortedMembers = users.sort((a, b) => b.trustScore - a.trustScore)
        
        console.log(`🎉 [Members] Loaded ${sortedMembers.length} members`)
        setMembers(sortedMembers)
      } catch (err) {
        console.error('💥 [Members] Error:', err)
        setError('Failed to load members. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchMembers()
  }, [])

  const loadMore = () => {
    setVisibleCount(prev => prev + 50)
  }

  const visibleMembers = members.slice(0, visibleCount)
  const hasMore = visibleCount < members.length

  return (
    <div style={{ minHeight: '100vh', backgroundColor: CORAL, padding: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <button
          onClick={() => router.back()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#fff',
            color: CORAL,
            border: 'none',
            padding: '10px 20px',
            borderRadius: '40px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#fff' }}>
          <Users size={32} />
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-display)', margin: 0 }}>
            Ronda Community
          </h1>
        </div>
      </div>

      {/* Stats */}
      {!loading && !error && (
        <div style={{ color: '#fff', fontSize: '0.85rem', marginBottom: '20px', opacity: 0.85 }}>
          {members.length} member{members.length !== 1 ? 's' : ''} in the community
        </div>
      )}

      {error && (
        <div style={{
          backgroundColor: '#FEE2E2',
          color: '#991B1B',
          padding: '12px 20px',
          borderRadius: '12px',
          marginBottom: '20px',
        }}>
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '16px',
        }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} style={{
              backgroundColor: '#fff',
              borderRadius: '20px',
              padding: '20px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              animation: 'pulse 1.5s ease-in-out infinite',
              textAlign: 'center',
            }}>
              <div style={{ width: 70, height: 70, borderRadius: '50%', backgroundColor: '#f0f0f0', margin: '0 auto 12px' }} />
              <div style={{ width: '60%', height: 16, backgroundColor: '#f0f0f0', margin: '0 auto 8px', borderRadius: 8 }} />
              <div style={{ width: '40%', height: 12, backgroundColor: '#f0f0f0', margin: '0 auto', borderRadius: 6 }} />
            </div>
          ))}
        </div>
      ) : members.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          backgroundColor: 'rgba(255,255,255,0.9)',
          borderRadius: '24px',
        }}>
          <Users size={48} style={{ margin: '0 auto 16px', color: CORAL }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 8 }}>No members yet</h3>
          <p style={{ color: '#666' }}>Be the first to join Ronda!</p>
          <button
            onClick={() => router.push('/')}
            style={{
              marginTop: '20px',
              backgroundColor: CORAL,
              color: '#fff',
              border: 'none',
              padding: '10px 24px',
              borderRadius: '40px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Join an event →
          </button>
        </div>
      ) : (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '16px',
          }}>
            {visibleMembers.map((member) => {
              const bgColor = pickColor(member.uid)
              const initials = getInitials(member.name)
              return (
                <div
                  key={member.uid}
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: '20px',
                    padding: '16px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)'
                    e.currentTarget.style.boxShadow = '0 12px 20px rgba(0,0,0,0.12)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'
                  }}
                  onClick={() => {}}
                >
                  {/* Avatar */}
                  <div
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      backgroundColor: bgColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 10px',
                      border: `2px solid ${CORAL}`,
                    }}
                  >
                    <span style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff' }}>
                      {initials}
                    </span>
                  </div>

                  {/* Name */}
                  <h3 style={{
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: '#1a1a1a',
                    marginBottom: '4px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {member.name}
                  </h3>

                  {/* City */}
                  {member.city && (
                    <p style={{ fontSize: '0.6rem', color: '#999', marginBottom: '6px' }}>
                      📍 {member.city}
                    </p>
                  )}

                  {/* Trust Score */}
                  <span style={{
                    display: 'inline-block',
                    backgroundColor: CORAL_PALE,
                    color: CORAL,
                    fontSize: '0.6rem',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '20px',
                  }}>
                    ★ {member.trustScore}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Load More */}
          {hasMore && (
            <div style={{ textAlign: 'center', marginTop: '32px' }}>
              <button
                onClick={loadMore}
                style={{
                  background: '#fff',
                  color: CORAL,
                  border: 'none',
                  padding: '10px 24px',
                  borderRadius: '40px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
              >
                Load more ({members.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </>
      )}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}