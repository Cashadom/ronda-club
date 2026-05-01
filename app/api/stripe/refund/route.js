import Stripe from 'stripe'
import { adminDb } from '@/lib/firebaseAdmin'
import { headers } from 'next/headers'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
})

export async function POST(req) {
  try {
    const { sessionId, userId, eventId } = await req.json()
    
    if (!sessionId || !userId || !eventId) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // Vérifier que l'utilisateur est bien le participant
    const participantQuery = await adminDb.collection('meetup_participants')
      .where('stripe_session_id', '==', sessionId)
      .where('user_id', '==', userId)
      .where('event_id', '==', eventId)
      .limit(1)
      .get()
      
    if (participantQuery.empty) {
      return new Response(JSON.stringify({ error: 'Participant not found' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    const participant = participantQuery.docs[0].data()
    
    if (participant.refund_status === 'refunded') {
      return new Response(JSON.stringify({ error: 'Already refunded' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // Trouver le payment_intent à rembourser
    const paymentIntentId = participant.stripe_payment_intent
    
    if (!paymentIntentId) {
      return new Response(JSON.stringify({ error: 'No payment intent found' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // Créer le refund dans Stripe
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: participant.amount_paid * 100, // en centimes
      metadata: {
        session_id: sessionId,
        user_id: userId,
        event_id: eventId,
        reason: 'user_left_event'
      }
    })
    
    console.log('💰 Refund created:', refund.id)
    
    return new Response(JSON.stringify({ 
      success: true, 
      refund_id: refund.id,
      message: 'Refund processed successfully'
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('❌ Refund error:', error)
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}