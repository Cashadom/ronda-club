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

  // 🔥 FLUX 3: CHARGE_REFUNDED - Gérer les remboursements (AVANT checkout.session.completed)
  if (event.type === 'charge.refunded') {
    const charge = event.data.object
    const sessionId = charge.metadata?.session_id
    
    console.log('💰 Refund detected for session:', sessionId)
    
    if (!sessionId) {
      console.error('❌ No session_id in charge metadata')
      return new Response('ok', { status: 200 })
    }
    
    // Trouver le participant concerné
    const participantQuery = await adminDb.collection('meetup_participants')
      .where('stripe_session_id', '==', sessionId)
      .limit(1)
      .get()
      
    if (participantQuery.empty) {
      console.error('❌ No participant found for session:', sessionId)
      return new Response('ok', { status: 200 })
    }
    
    const participantDoc = participantQuery.docs[0]
    const participant = participantDoc.data()
    const eventId = participant.event_id
    const userId = participant.user_id
    
    console.log(`💰 Processing refund for user ${userId} from event ${eventId}`)
    
    await adminDb.runTransaction(async (transaction) => {
      // READ: Récupérer le meetup
      const meetupRef = adminDb.collection('meetups').doc(eventId)
      const meetupSnap = await transaction.get(meetupRef)
      
      if (!meetupSnap.exists) {
        console.error('❌ Meetup not found:', eventId)
        return
      }
      
      const meetup = meetupSnap.data()
      const currentCount = meetup.participants_count || 0
      const newCount = Math.max(0, currentCount - 1)
      
      // READ: Récupérer l'utilisateur
      const userRef = adminDb.collection('ronda_users').doc(userId)
      const userSnap = await transaction.get(userRef)
      
      // WRITES: Mettre à jour tout
      transaction.update(meetupRef, {
        participants_count: newCount,
        updatedAt: adminFieldValue.serverTimestamp(),
      })
      
      if (userSnap.exists) {
        const currentAttended = userSnap.data().events_attended || 0
        transaction.update(userRef, {
          events_attended: Math.max(0, currentAttended - 1),
          updatedAt: adminFieldValue.serverTimestamp(),
        })
      }
      
      transaction.update(participantDoc.ref, {
        refund_status: 'refunded',
        refund_amount: charge.amount_refunded / 100,
        refunded_at: adminFieldValue.serverTimestamp(),
        status: 'left',
      })
      
      console.log(`✅ Refund processed: event ${eventId} → ${newCount} participants left`)
    })
    
    console.log('✅ Refund transaction completed')
    return new Response('ok', { status: 200 })
  }

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

        if (!meetupId || !userId) {
          console.error('❌ Missing meetupId or userId in metadata')
          return new Response('ok', { status: 200 })
        }

        const meetupRef = adminDb.collection('meetups').doc(meetupId)
        const meetupSnap = await meetupRef.get()

        if (!meetupSnap.exists) {
          console.error('❌ Meetup not found:', meetupId)
          return new Response('ok', { status: 200 })
        }

        const meetup = meetupSnap.data()

        if (meetup.hostId !== userId) {
          console.error('❌ SECURITY: userId does not match meetup host', { userId, meetupHostId: meetup.hostId })
          return new Response('ok', { status: 200 })
        }

        const expectedAmount = (meetup.price || 2) * 100
        if (session.amount_total !== expectedAmount) {
          console.error('❌ SECURITY: Amount mismatch', { 
            expected: expectedAmount, 
            received: session.amount_total 
          })
          return new Response('ok', { status: 200 })
        }

        const userRef = adminDb.collection('ronda_users').doc(userId)
        const userSnap = await userRef.get()
        
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

      // 🔥 FLUX 2: JOIN_EVENT - réservation dans meetups (CORRIGÉ)
      if (checkoutType === 'join_event') {
        const { userId, eventId, userName } = metadata

        if (!userId || !eventId) {
          console.error('❌ Missing userId or eventId in metadata')
          return new Response('ok', { status: 200 })
        }

        console.log('📝 Processing join_event for eventId:', eventId)

        const meetupRef = adminDb.collection('meetups').doc(eventId)
        const userRef = adminDb.collection('ronda_users').doc(userId)
        
        await adminDb.runTransaction(async (transaction) => {
          // ✅ 1. TOUS LES READS D'ABORD
          const meetupSnap = await transaction.get(meetupRef)

          if (!meetupSnap.exists) {
            console.error('❌ Meetup not found:', eventId)
            return
          }

          const meetup = meetupSnap.data()
          
          if (meetup.status !== 'paid') {
            console.log('⚠️ Meetup status is:', meetup.status, '- allowing join anyway')
          }

          const expectedAmount = (meetup.price || 2) * 100
          if (session.amount_total !== expectedAmount) {
            console.error('❌ SECURITY: Amount mismatch for join_event', {
              expected: expectedAmount,
              received: session.amount_total
            })
            return
          }

          const meetupLimit = Number(meetup.capacity ?? meetup.capacity_max ?? 9)
          const currentParticipants = meetup.participants_count || 0

          if (currentParticipants >= meetupLimit) {
            console.error('❌ Meetup full:', currentParticipants, '/', meetupLimit)
            return
          }

          const existingParticipantQuery = await transaction.get(
            adminDb.collection('meetup_participants')
              .where('event_id', '==', eventId)
              .where('user_id', '==', userId)
          )

          if (!existingParticipantQuery.empty) {
            console.log('⚠️ Participant already exists, skipping')
            return
          }

          const duplicateQuery = await transaction.get(
            adminDb.collection('meetup_participants')
              .where('event_id', '==', eventId)
              .where('stripe_session_id', '==', session.id)
          )

          if (!duplicateQuery.empty) {
            console.log('⚠️ Duplicate webhook, skipping')
            return
          }

          // ✅ READ: userSnap AVANT tous les writes
          const userSnap = await transaction.get(userRef)
          
          const newCount = currentParticipants + 1
          const priceAmount = meetup.price || 2

          // ✅ 2. TOUS LES WRITES APRÈS TOUS LES READS
          transaction.update(meetupRef, {
            participants_count: newCount,
            updatedAt: adminFieldValue.serverTimestamp(),
          })

          if (userSnap.exists) {
            transaction.update(userRef, {
              events_attended: adminFieldValue.increment(1),
              updatedAt: adminFieldValue.serverTimestamp(),
            })
          } else {
            transaction.set(userRef, {
              events_attended: 1,
              events_hosted: 0,
              createdAt: adminFieldValue.serverTimestamp(),
              updatedAt: adminFieldValue.serverTimestamp(),
            })
          }

          const participantRef = adminDb.collection('meetup_participants').doc()
          transaction.set(participantRef, {
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
          })

          console.log(`✅ JOIN CONFIRMED: meetup ${eventId} → ${newCount}/${meetupLimit} participants`)
        })

        console.log('✅ Transaction completed successfully')
      }

    } catch (err) {
      console.error('💥 Webhook error:', err.message)
      console.error('💥 Webhook stack:', err.stack)
      return new Response('ok', { status: 200 })
    }
  }

  return new Response('ok', { status: 200 })
}