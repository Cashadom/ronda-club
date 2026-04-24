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
      // 🔥 FLUX 1: PUBLISH_EVENT - Mettre à jour le meetup existant (pending → paid)
      if (checkoutType === 'publish_event') {
        const { userId, meetupId } = metadata

        if (!meetupId) {
          console.error('❌ No meetupId in metadata')
          return new Response('ok', { status: 200 })
        }

        const meetupRef = adminDb.collection('meetups').doc(meetupId)
        const meetupSnap = await meetupRef.get()

        // 🔥 CORRECTION: .exists (pas .exists())
        if (!meetupSnap.exists) {
          console.error('❌ Meetup not found:', meetupId)
          return new Response('ok', { status: 200 })
        }

        await meetupRef.update({
          status: 'paid',
          paymentStatus: 'paid',
          stripeSessionId: session.id,
          stripePaymentIntent: session.payment_intent,
          publishedAt: adminFieldValue.serverTimestamp(),
          updatedAt: adminFieldValue.serverTimestamp(),
        })

        console.log('🔥 MEETUP MARKED AS PAID:', meetupId)
      }

      // 🔥 FLUX 2: JOIN_EVENT - réservation dans meetups
      if (checkoutType === 'join_event') {
        const { userId, eventId, userName } = metadata

        const meetupRef = adminDb.collection('meetups').doc(eventId)

        await adminDb.runTransaction(async (tx) => {
          const meetupSnap = await tx.get(meetupRef)

          // 🔥 CORRECTION: .exists (pas .exists())
          if (!meetupSnap.exists) {
            throw new Error('MEETUP_NOT_FOUND')
          }

          const meetup = meetupSnap.data()
          
          if (meetup.status !== 'paid') {
            throw new Error('MEETUP_NOT_AVAILABLE')
          }

          const meetupLimit = meetup.capacity_max || meetup.capacity || 9
          const currentParticipants = meetup.participants_count || 0

          if (currentParticipants >= meetupLimit) {
            throw new Error('MEETUP_FULL')
          }

          const duplicateQuery = adminDb
            .collection('meetup_participants')
            .where('event_id', '==', eventId)
            .where('stripe_session_id', '==', session.id)

          const duplicateSnap = await tx.get(duplicateQuery)

          if (!duplicateSnap.empty) {
            console.log('⚠️ Duplicate webhook, skipping')
            return
          }

          const userExistingQuery = adminDb
            .collection('meetup_participants')
            .where('event_id', '==', eventId)
            .where('user_id', '==', userId)

          const userExistingSnap = await tx.get(userExistingQuery)

          if (!userExistingSnap.empty) {
            throw new Error('ALREADY_JOINED')
          }

          const newCount = currentParticipants + 1

          tx.update(meetupRef, {
            participants_count: newCount,
            updatedAt: adminFieldValue.serverTimestamp(),
          })

          const participantRef = adminDb.collection('meetup_participants').doc()
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
      // 🔥 CORRECTION: meilleur log d'erreur
      console.error('💥 Webhook error:', err.message)
      console.error('💥 Webhook stack:', err.stack)
      return new Response('ok', { status: 200 })
    }
  }

  return new Response('ok', { status: 200 })
}