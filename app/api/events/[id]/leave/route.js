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
    const { userId } = body

    console.log('🔍 [Leave Event] Request:', { eventId, userId })

    if (!eventId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400 }
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
        JSON.stringify({ error: 'Event is cancelled' }),
        { status: 400 }
      )
    }

    // Vérifier que l'event n'est pas déjà passé
    const eventDate = new Date(meetup.startAt)
    const now = new Date()
    
    if (eventDate < now) {
      return new Response(
        JSON.stringify({ error: 'Cannot leave a past event' }),
        { status: 400 }
      )
    }

    // 🔥 IDEMPOTENCY: Vérifier si déjà parti
    const existingCancelQuery = await adminDb
      .collection('meetup_participants')
      .where('event_id', '==', eventId)
      .where('user_id', '==', userId)
      .where('status', 'in', ['cancelled', 'refunded'])
      .get()

    if (!existingCancelQuery.empty) {
      console.log('⚠️ [Leave Event] User already left this event, skipping')
      return new Response(
        JSON.stringify({ error: 'You already left this event' }),
        { status: 400 }
      )
    }

    // Récupérer la participation de l'utilisateur
    const participantQuery = await adminDb
      .collection('meetup_participants')
      .where('event_id', '==', eventId)
      .where('user_id', '==', userId)
      .where('status', '==', 'joined')
      .get()

    if (participantQuery.empty) {
      return new Response(
        JSON.stringify({ error: 'You are not participating in this event' }),
        { status: 404 }
      )
    }

    const participantDoc = participantQuery.docs[0]
    const participant = participantDoc.data()

    // 🔥 IDEMPOTENCY: Vérifier si déjà remboursé
    if (participant.refund_status === 'partial' || participant.refund_status === 'full') {
      console.log('⚠️ [Leave Event] User already refunded, skipping')
      return new Response(
        JSON.stringify({ error: 'You already received a refund for this event' }),
        { status: 400 }
      )
    }

    // Calculer le remboursement
    const diffInHours = (eventDate - now) / (1000 * 60 * 60)
    const isEligibleForRefund = diffInHours >= REFUND_DEADLINE_HOURS
    const refundAmount = isEligibleForRefund ? Math.floor(PRICE / 2) : 0

    console.log(`📊 [Leave Event] Diff: ${diffInHours}h, Refund: $${refundAmount}`)

    // Effectuer le remboursement Stripe si applicable
    let refundResult = null
    if (refundAmount > 0 && participant.stripe_payment_intent) {
      try {
        refundResult = await stripe.refunds.create({
          payment_intent: participant.stripe_payment_intent,
          amount: refundAmount * 100,
        })
        console.log(`💰 [Leave Event] Refund processed: ${refundResult.id}`)
      } catch (stripeError) {
        console.error('❌ [Leave Event] Stripe refund failed:', stripeError.message)
      }
    }

    // Mettre à jour la participation
    await participantDoc.ref.update({
      status: 'cancelled',
      refund_status: refundAmount > 0 ? 'partial' : 'none',
      refund_amount: refundAmount,
      cancelReason: 'user_left',
      ...(refundResult && { stripe_refund_id: refundResult.id }),
      cancelled_at: adminFieldValue.serverTimestamp(),
    })

    // Décrémenter le compteur de participants
    const newCount = (meetup.participants_count || 0) - 1
    await meetupRef.update({
      participants_count: newCount,
      updatedAt: adminFieldValue.serverTimestamp(),
    })

    // 🔥 Décrémenter events_attended de l'utilisateur
    const userRef = adminDb.collection('ronda_users').doc(userId)
    const userSnap = await userRef.get()
    if (userSnap.exists()) {
      await userRef.update({
        events_attended: adminFieldValue.increment(-1),
        updatedAt: adminFieldValue.serverTimestamp(),
      })
    }

    console.log(`✅ [Leave Event] User ${userId} left event ${eventId}, refund $${refundAmount}`)

    return new Response(
      JSON.stringify({
        success: true,
        refundAmount,
        message: isEligibleForRefund 
          ? `You left the event. You received $${refundAmount} refund.`
          : `You left the event. No refund (less than ${REFUND_DEADLINE_HOURS}h before event).`
      }),
      { status: 200 }
    )

  } catch (error) {
    console.error('💥 [Leave Event] Error:', error.message)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    )
  }
}