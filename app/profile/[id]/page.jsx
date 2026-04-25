'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User } from 'lucide-react'
import { doc, getDoc } from 'firebase/firestore'
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
  const clean = name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
  return clean.slice(0, 3)
}

export default function MemberProfilePage() {
  const { id } = useParams()
  const router = useRouter()
  const [member, setMember] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadMember() {
      if (!id) return
      
      try {
        console.log('🔍 [MemberProfile] Loading user:', id)
        
        const userDoc = await getDoc(doc(db, 'users', id))
        
        if (!userDoc.exists()) {
          setError('Member not found')
          return
        }
        
        const data = userDoc.data()
        
        setMember({
          id: userDoc.id,
          name: data.name || data.displayName || data.username || 'Anonymous',
          city: data.city || '',
          trustScore: data.trust_score || 0,
          email: data.email || '',
          photoUrl: data.photo_url || data.photoURL || '',
          seed: userDoc.id,
        })
        
        console.log('✅ [MemberProfile] Loaded:', member?.name)
      } catch (err) {
        console.error('Error loading member:', err)
        setError('Failed to load member')
      } finally {
        setLoading(false)
      }
    }
    
    loadMember()
  }, [id])

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: CORAL, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div style={{
          width: 40,
          height: 40,
          border: `3px solid ${CORAL_PALE}`,
          borderTopColor: '#fff',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
        }} />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  if (error || !member) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: CORAL, padding: '40px 20px' }}>
        <div style={{
          maxWidth: '400px',
          margin: '0 auto',
          background: '#fff',
          borderRadius: '28px',
          padding: '40px',
          textAlign: 'center',
        }}>
          <User size={48} style={{ margin: '0 auto 16px', color: CORAL }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 8 }}>
            {error || 'Member not found'}
          </h2>
          <button
            onClick={() => router.push('/members')}
            style={{
              marginTop: 20,
              background: CORAL,
              color: '#fff',
              border: 'none',
              padding: '10px 24px',
              borderRadius: '40px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Back to members
          </button>
        </div>
      </div>
    )
  }

  const bgColor = pickColor(member.seed)
  const initials = getInitials(member.name)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: CORAL, padding: '20px' }}>
      
      {/* Header */}
      <div style={{ maxWidth: '500px', margin: '0 auto', marginBottom: '20px' }}>
        <button
          onClick={() => router.back()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#fff',
            color: CORAL,
            border: 'none',
            padding: '8px 16px',
            borderRadius: '40px',
            fontWeight: 500,
            cursor: 'pointer',
            fontSize: '0.85rem',
          }}
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>
      </div>

      {/* Profile Card */}
      <div style={{
        maxWidth: '500px',
        margin: '0 auto',
        background: '#fff',
        borderRadius: '32px',
        padding: '40px 28px',
        textAlign: 'center',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
      }}>
        
        {/* Avatar */}
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: '50%',
            backgroundColor: bgColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            border: `3px solid ${CORAL}`,
          }}
        >
          <span style={{ fontSize: '2.2rem', fontWeight: 700, color: '#fff' }}>
            {initials}
          </span>
        </div>

        {/* Name */}
        <h1 style={{
          fontSize: '1.8rem',
          fontWeight: 800,
          color: '#1a1a1a',
          marginBottom: '8px',
        }}>
          {member.name}
        </h1>

        {/* Email prefix */}
        {member.email && (
          <p style={{ fontSize: '0.85rem', color: '#999', marginBottom: '16px' }}>
            @{member.email.slice(0, 3).toLowerCase()}
          </p>
        )}

        {/* City */}
        {member.city && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: CORAL_PALE,
            padding: '6px 14px',
            borderRadius: '40px',
            marginBottom: '20px',
          }}>
            <span>📍</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 500, color: CORAL }}>
              {member.city}
            </span>
          </div>
        )}

        {/* Trust Score */}
        <div style={{
          background: CORAL_PALE,
          borderRadius: '20px',
          padding: '16px',
          maxWidth: '200px',
          margin: '0 auto',
        }}>
          <p style={{ fontSize: '0.7rem', color: '#999', marginBottom: '4px' }}>
            Trust Score
          </p>
          <p style={{ fontSize: '2rem', fontWeight: 800, color: CORAL }}>
            ★ {member.trustScore}
          </p>
        </div>

        {/* Back to members link */}
        <Link
          href="/members"
          style={{
            display: 'inline-block',
            marginTop: '32px',
            color: CORAL,
            fontSize: '0.85rem',
            textDecoration: 'none',
            borderBottom: `1px solid ${CORAL_PALE}`,
            paddingBottom: '2px',
          }}
        >
          ← Back to all members
        </Link>
      </div>
    </div>
  )
}