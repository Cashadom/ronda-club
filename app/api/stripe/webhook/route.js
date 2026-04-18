export const dynamic = 'force-dynamic'

import Stripe from 'stripe'
import { headers } from 'next/headers'
import { adminDb, adminFieldValue } from '@/lib/firebaseAdmin'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
})

export async function POST(req) {
  const body = await req.text()
  const sig = headers().get('stripe-signature')
  const secret = process.env.STRIPE_WEBHOOK_SECRET

  let event

  // ─── 1. Vérification signature Stripe ─────────────────
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret)
  } catch (err) {
    console.error('❌ Invalid signature:', err.message)
    return new Response('Invalid signature', { status: 400 })
  }

  console.log('✅ Stripe event:', event.type)

  // ─── 2. Paiement validé ──────────────────────────────
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object

    if (session.payment_status !== 'paid') {
      console.log('⚠️ Not paid')
      return new Response('Not paid', { status: 200 })
    }

    const { userId, pendingEventId, eventDataJson } = session.metadata || {}

    try {
      // 🔹 récupérer pending event
      const pendingRef = adminDb.collection('pending_events').doc(pendingEventId)
      const pendingSnap = await pendingRef.get()

      if (!pendingSnap.exists) {
        console.error('❌ Pending not found:', pendingEventId)
        return new Response('ok', { status: 200 })
      }

      const pendingData = pendingSnap.data()
      const eventData = JSON.parse(eventDataJson || '{}')

      // 🔹 créer event live
      const eventRef = adminDb.collection('events').doc()

      await eventRef.set({
        ...pendingData,
        title: eventData.title || `${pendingData.type} in ${pendingData.city}`,
        hostId: userId,
        status: 'published',
        paymentStatus: 'paid',
        stripeSessionId: session.id,
        createdAt: adminFieldValue.serverTimestamp(),
        updatedAt: adminFieldValue.serverTimestamp(),
      })

      // 🔹 update pending
      await pendingRef.update({
        status: 'completed',
        publishedEventId: eventRef.id,
        updatedAt: adminFieldValue.serverTimestamp(),
      })

      console.log('🔥 EVENT CREATED:', eventRef.id)

    } catch (err) {
      console.error('💥 Webhook error:', err)
    }
  }

  return new Response('ok', { status: 200 })
}