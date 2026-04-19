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

  try {
    event = stripe.webhooks.constructEvent(body, sig, secret)
  } catch (err) {
    console.error('❌ Invalid signature:', err.message)
    return new Response('Invalid signature', { status: 400 })
  }

  console.log('✅ Stripe event:', event.type)

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object

    if (session.payment_status !== 'paid') {
      console.log('⚠️ Not paid')
      return new Response('Not paid', { status: 200 })
    }

    const metadata = session.metadata || {}
    const checkoutType = metadata.checkoutType

    console.log('📦 Webhook processing:', { checkoutType, sessionId: session.id })

    try {
      // 🔥 FLUX 1: PUBLISH_EVENT - création dans meetups
      if (checkoutType === 'publish_event') {
        const { userId, pendingEventId, eventDataJson } = metadata

        const pendingRef = adminDb.collection('pending_events').doc(pendingEventId)
        const pendingSnap = await pendingRef.get()

        if (!pendingSnap.exists) {
          console.error('❌ Pending not found:', pendingEventId)
          return new Response('ok', { status: 200 })
        }

        const pendingData = pendingSnap.data()
        const eventData = JSON.parse(eventDataJson || '{}')

        // 🔥 CHANGEMENT: meetups au lieu de events
        const meetupRef = adminDb.collection('meetups').doc()

        await meetupRef.set({
          ...pendingData,
          title: eventData.title || `${pendingData.type} in ${pendingData.city}`,
          host_id: userId,  // garder host_id pour compatibilité

          participants_count: 0,
          capacity_max: Number(pendingData.capacity) || 6,
          capacity_min: 6,

          status: 'open',
          paymentStatus: 'paid',
          
          stripeSessionId: session.id,
          stripePaymentIntent: session.payment_intent,
          
          publishedAt: adminFieldValue.serverTimestamp(),
          timestamp: pendingData.createdAt || adminFieldValue.serverTimestamp(),
          updatedAt: adminFieldValue.serverTimestamp(),
        })

        await pendingRef.update({
          status: 'completed',
          publishedMeetupId: meetupRef.id,
          updatedAt: adminFieldValue.serverTimestamp(),
        })

        console.log('🔥 MEETUP PUBLISHED:', meetupRef.id, '| Limit:', pendingData.capacity)
      }

      // 🔥 FLUX 2: JOIN_EVENT - réservation dans meetups
      if (checkoutType === 'join_event') {
        const { userId, eventId, userName } = metadata

        // 🔥 CHANGEMENT: meetups au lieu de events
        const meetupRef = adminDb.collection('meetups').doc(eventId)

        await adminDb.runTransaction(async (tx) => {
          const meetupSnap = await tx.get(meetupRef)

          if (!meetupSnap.exists) {
            throw new Error('MEETUP_NOT_FOUND')
          }

          const meetup = meetupSnap.data()
          const meetupLimit = meetup.capacity_max || 9
          const currentParticipants = meetup.participants_count || 0

          if (currentParticipants >= meetupLimit) {
            throw new Error('MEETUP_FULL')
          }

          // Vérifier doublon de session Stripe
          const duplicateQuery = adminDb
            .collection('participants')
            .where('event_id', '==', eventId)
            .where('stripe_session_id', '==', session.id)

          const duplicateSnap = await tx.get(duplicateQuery)

          if (!duplicateSnap.empty) {
            console.log('⚠️ Duplicate webhook, skipping')
            return
          }

          // Vérifier que l'utilisateur n'a pas déjà rejoint
          const userExistingQuery = adminDb
            .collection('participants')
            .where('event_id', '==', eventId)
            .where('user_id', '==', userId)

          const userExistingSnap = await tx.get(userExistingQuery)

          if (!userExistingSnap.empty) {
            throw new Error('ALREADY_JOINED')
          }

          const newCount = currentParticipants + 1
          let newStatus = 'open'
          if (newCount >= meetupLimit) newStatus = 'full'
          else if (newCount >= 6) newStatus = 'confirmed'

          tx.update(meetupRef, {
            participants_count: newCount,
            status: newStatus,
            updatedAt: adminFieldValue.serverTimestamp(),
          })

          const participantRef = adminDb.collection('participants').doc()
          tx.set(participantRef, {
            user_id: userId,
            user_name: userName || '',
            event_id: eventId,
            status: 'joined',
            stripe_session_id: session.id,
            paid_at: adminFieldValue.serverTimestamp(),
            created_at: adminFieldValue.serverTimestamp(),
          })

          console.log(`✅ JOIN CONFIRMED: meetup ${eventId} → ${newCount}/${meetupLimit} participants`)
        })
      }

    } catch (err) {
      console.error('💥 Webhook error:', err.message)
      return new Response('ok', { status: 200 })
    }
  }

  return new Response('ok', { status: 200 })
}