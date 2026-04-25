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

        // ✅ CORRECTION: .exists (pas .exists())
        if (!meetupSnap.exists) {
          console.error('❌ Meetup not found:', meetupId)
          return new Response('ok', { status: 200 })
        }

        // Incrémenter events_hosted dans ronda_users
        const userRef = adminDb.collection('ronda_users').doc(userId)
        const userSnap = await userRef.get()
        
        // ✅ CORRECTION: .exists (pas .exists())
        if (userSnap.exists) {
          await userRef.update({
            events_hosted: adminFieldValue.increment(1),
            updatedAt: adminFieldValue.serverTimestamp(),
          })
        } else {
          await userRef.set({
            events_hosted: 1,
            events_attended: 0,
            createdAt: adminFieldValue.serverTimestamp(),
            updatedAt: adminFieldValue.serverTimestamp(),
          })
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

        console.log('📝 Processing join_event for eventId:', eventId)

        const meetupRef = adminDb.collection('meetups').doc(eventId)
        const meetupSnap = await meetupRef.get()

        // ✅ CORRECTION: .exists (pas .exists())
        if (!meetupSnap.exists) {
          console.error('❌ Meetup not found:', eventId)
          return new Response('ok', { status: 200 })
        }

        const meetup = meetupSnap.data()
        
        if (meetup.status !== 'paid') {
          console.error('❌ Meetup not paid:', meetup.status)
          return new Response('ok', { status: 200 })
        }

        const meetupLimit = meetup.capacity_max || meetup.capacity || 9
        const currentParticipants = meetup.participants_count || 0

        if (currentParticipants >= meetupLimit) {
          console.error('❌ Meetup full:', currentParticipants, '/', meetupLimit)
          return new Response('ok', { status: 200 })
        }

        // IDEMPOTENCY: Vérifier si déjà traité
        const existingParticipantQuery = await adminDb
          .collection('meetup_participants')
          .where('event_id', '==', eventId)
          .where('user_id', '==', userId)
          .get()

        if (!existingParticipantQuery.empty) {
          console.log('⚠️ Participant already exists, skipping (idempotency)')
          return new Response('ok', { status: 200 })
        }

        // Vérifier doublon de session Stripe
        const duplicateQuery = await adminDb
          .collection('meetup_participants')
          .where('event_id', '==', eventId)
          .where('stripe_session_id', '==', session.id)
          .get()

        if (!duplicateQuery.empty) {
          console.log('⚠️ Duplicate webhook, skipping')
          return new Response('ok', { status: 200 })
        }

        const newCount = currentParticipants + 1

        // Incrémenter participants_count
        await meetupRef.update({
          participants_count: newCount,
          updatedAt: adminFieldValue.serverTimestamp(),
        })

        // Incrémenter events_attended dans ronda_users
        const userRef = adminDb.collection('ronda_users').doc(userId)
        const userSnap = await userRef.get()
        
        // ✅ CORRECTION: .exists (pas .exists())
        if (userSnap.exists) {
          await userRef.update({
            events_attended: adminFieldValue.increment(1),
            updatedAt: adminFieldValue.serverTimestamp(),
          })
        } else {
          await userRef.set({
            events_attended: 1,
            events_hosted: 0,
            createdAt: adminFieldValue.serverTimestamp(),
            updatedAt: adminFieldValue.serverTimestamp(),
          })
        }

        const priceAmount = meetup.price || 2

        // Ajouter le participant avec toutes les infos Stripe
        const participantData = {
          user_id: userId,
          user_name: userName || '',
          event_id: eventId,
          status: 'joined',
          stripe_session_id: session.id,
          stripe_payment_intent: session.payment_intent,
          amount_paid: priceAmount,
          currency: 'usd',
          refund_status: 'none',
          refund_amount: 0,
          paid_at: adminFieldValue.serverTimestamp(),
          created_at: adminFieldValue.serverTimestamp(),
        }

        await adminDb.collection('meetup_participants').add(participantData)

        console.log(`✅ JOIN CONFIRMED: meetup ${eventId} → ${newCount}/${meetupLimit} participants`)
        console.log(`💳 Payment intent: ${session.payment_intent}, amount: ${priceAmount}`)
        console.log(`📊 User ${userId} events_attended incremented`)
      }

    } catch (err) {
      console.error('💥 Webhook error:', err.message)
      console.error('💥 Webhook stack:', err.stack)
      return new Response('ok', { status: 200 })
    }
  }

  return new Response('ok', { status: 200 })
}