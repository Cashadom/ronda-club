'use client'
import { getInitials } from '@/lib/utils'

const COLORS = ['#FF6B51','#3B82F6','#10B981','#F59E0B','#8B5CF6','#EC4899']

export default function AvatarStack({ users = [], count, max = 5 }) {
  const visible = users.slice(0, max)
  const overflow = (count || users.length) - visible.length

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{ display: 'flex' }}>
        {visible.map((user, i) => (
          <div
            key={user.id || i}
            title={user.name}
            style={{
              width:        32,
              height:       32,
              borderRadius: '50%',
              border:       '2px solid #fff',
              marginLeft:   i === 0 ? 0 : -9,
              background:   COLORS[i % COLORS.length],
              backgroundImage: user.photo_url ? `url(${user.photo_url})` : 'none',
              backgroundSize: 'cover',
              display:      'flex',
              alignItems:   'center',
              justifyContent:'center',
              fontSize:     '0.7rem',
              fontWeight:   700,
              color:        '#fff',
              zIndex:       max - i,
            }}
          >
            {!user.photo_url && getInitials(user.name)}
          </div>
        ))}
        {overflow > 0 && (
          <div style={{
            width:        32,
            height:       32,
            borderRadius: '50%',
            border:       '2px solid #fff',
            marginLeft:   -9,
            background:   'var(--border)',
            display:      'flex',
            alignItems:   'center',
            justifyContent:'center',
            fontSize:     '0.68rem',
            fontWeight:   700,
            color:        'var(--text-muted)',
          }}>
            +{overflow}
          </div>
        )}
      </div>
      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
        {count || users.length} joined
      </span>
    </div>
  )
}
