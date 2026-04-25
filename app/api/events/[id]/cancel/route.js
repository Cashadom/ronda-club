import { adminDb, adminFieldValue } from '@/lib/firebaseAdmin'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// Constantes
const REFUND_DEADLINE_HOURS = 72
const PRICE = 2

export async function POST(req, { params }) {
  try {
    const { id: eventId } = await params
    const body = await req.json()
    const { userId, isHost } = body

    console.log('🔍 [Cancel Event] Request:', { eventId, userId, isHost })

    if (!eventId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400 }
      )
    }

    // Vérifier que l'utilisateur est l'host
    if (!isHost) {
      return new Response(
        JSON.stringify({ error: 'Only the host can cancel this event' }),
        { status: 403 }
      )
    }

    // Récupérer l'événement
    const meetupRef = adminDb.collection('meetups').doc(eventId)
    const meetupSnap = await meetupRef.get()

    if (!meetupSnap.exists) {
      return new Response(
        JSON.stringify({ error: 'Event not found' }),
        { status: 404 }
      )
    }

    const meetup = meetupSnap.data()

    // Vérifier que l'event n'est pas déjà annulé
    if (meetup.status === 'cancelled') {
      return new Response(
        JSON.stringify({ error: 'Event already cancelled' }),
        { status: 400 }
      )
    }

    // Vérifier que l'event n'est pas déjà passé
    const eventDate = new Date(meetup.startAt)
    const now = new Date()
    
    if (eventDate < now) {
      return new Response(
        JSON.stringify({ error: 'Cannot cancel a past event' }),
        { status: 400 }
      )
    }

    // Calculer le remboursement host
    const diffInHours = (eventDate - now) / (1000 * 60 * 60)
    const isEligibleForRefund = diffInHours >= REFUND_DEADLINE_HOURS
    const hostRefundAmount = isEligibleForRefund ? Math.floor(PRICE / 2) : 0

    console.log(`📊 [Cancel Event] Host diff: ${diffInHours}h, Refund: $${hostRefundAmount}`)

    // 🔥 1. Rembourser l'host si applicable
    let hostRefundResult = null
    if (hostRefundAmount > 0 && meetup.stripePaymentIntent) {
      try {
        hostRefundResult = await stripe.refunds.create({
          payment_intent: meetup.stripePaymentIntent,
          amount: hostRefundAmount * 100,
        })
        console.log(`💰 [Cancel Event] Host refund processed: ${hostRefundResult.id}`)
      } catch (stripeError) {
        console.error('❌ [Cancel Event] Stripe host refund failed:', stripeError.message)
      }
    }

    // 🔥 2. Rembourser tous les participants (100%)
    const participantsQuery = await adminDb
      .collection('meetup_participants')
      .where('event_id', '==', eventId)
      .where('status', '==', 'joined')
      .get()

    console.log(`📊 [Cancel Event] Found ${participantsQuery.size} participants to refund`)

    let participantRefundCount = 0
    let participantRefundErrors = 0

    for (const participantDoc of participantsQuery.docs) {
      const participant = participantDoc.data()
      
      // 🔥 IDEMPOTENCY: Vérifier si déjà remboursé
      if (participant.refund_status === 'full' || participant.refund_status === 'done') {
        console.log(`⚠️ [Cancel Event] Participant ${participant.user_id} already refunded, skipping`)
        continue
      }

      const amountToRefund = participant.amount_paid || PRICE
      
      try {
        if (participant.stripe_payment_intent) {
          await stripe.refunds.create({
            payment_intent: participant.stripe_payment_intent,
            amount: amountToRefund * 100,
          })
          console.log(`💰 [Cancel Event] Refunded participant ${participant.user_id}: $${amountToRefund}`)
        }
        
        // Mettre à jour la participation
        await participantDoc.ref.update({
          refund_status: 'full',
          refund_amount: amountToRefund,
          status: 'refunded',
          cancelled_at: adminFieldValue.serverTimestamp(),
          cancelReason: 'host_cancelled',
        })
        
        participantRefundCount++
        
        // 🔥 Décrémenter events_attended de l'utilisateur
        const userRef = adminDb.collection('ronda_users').doc(participant.user_id)
        const userSnap = await userRef.get()
        if (userSnap.exists()) {
          await userRef.update({
            events_attended: adminFieldValue.increment(-1),
            updatedAt: adminFieldValue.serverTimestamp(),
          })
        }
        
      } catch (stripeError) {
        console.error(`❌ [Cancel Event] Failed to refund participant ${participant.user_id}:`, stripeError.message)
        participantRefundErrors++
      }
    }

    // 🔥 3. Mettre à jour l'événement
    await meetupRef.update({
      status: 'cancelled',
      cancelledAt: adminFieldValue.serverTimestamp(),
      cancelledBy: userId,
      cancelReason: 'host_cancelled',
      hostRefundAmount: hostRefundAmount,
      participantRefundCount: participantRefundCount,
      ...(hostRefundResult && { stripeRefundId: hostRefundResult.id }),
      updatedAt: adminFieldValue.serverTimestamp(),
    })

    // 🔥 4. Décrémenter events_hosted de l'host
    const hostUserRef = adminDb.collection('ronda_users').doc(userId)
    const hostUserSnap = await hostUserRef.get()
    if (hostUserSnap.exists()) {
      await hostUserRef.update({
        events_hosted: adminFieldValue.increment(-1),
        updatedAt: adminFieldValue.serverTimestamp(),
      })
    }

    console.log(`✅ [Cancel Event] Event ${eventId} cancelled`)
    console.log(`📊 Stats: Host refund $${hostRefundAmount}, ${participantRefundCount} participants refunded, ${participantRefundErrors} errors`)

    return new Response(
      JSON.stringify({
        success: true,
        hostRefundAmount,
        participantRefundCount,
        participantRefundErrors,
        message: isEligibleForRefund 
          ? `Event cancelled. You received $${hostRefundAmount} refund. ${participantRefundCount} participants were refunded.`
          : `Event cancelled. No host refund (less than ${REFUND_DEADLINE_HOURS}h before event). ${participantRefundCount} participants were refunded.`
      }),
      { status: 200 }
    )

  } catch (error) {
    console.error('💥 [Cancel Event] Error:', error.message)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    )
  }
}