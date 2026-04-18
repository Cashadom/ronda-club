'use client'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'

export default function EmptyState() {
  const router = useRouter()

  return (
    <div style={{
      textAlign: 'center',
      padding: '72px 20px',
      background: 'var(--bg-soft)',
      borderRadius: 'var(--radius-lg)',
      border: '1px dashed var(--border)',
    }}>
      <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🏙️</div>
      <h3 style={{
        fontFamily: 'var(--font-display)',
        fontSize: '1.4rem',
        fontWeight: 700,
        color: 'var(--text)',
        marginBottom: '8px',
      }}>
        No events tonight yet
      </h3>
      <p style={{
        fontSize: '0.95rem',
        color: 'var(--text-muted)',
        lineHeight: 1.7,
        marginBottom: '28px',
        maxWidth: '320px',
        margin: '0 auto 28px',
      }}>
        Be the first to host something. It only takes 30 seconds and $2.
      </p>
      <Button onClick={() => router.push('/create')}>
        Host tonight's event →
      </Button>
    </div>
  )
}
