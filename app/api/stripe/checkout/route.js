import Stripe from 'stripe'
import { headers } from 'next/headers'
import { adminDb, adminFieldValue } from '@/lib/firebaseAdmin'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const PRICE_CENTS = 200 // $2.00 USD

// ─── POST /api/stripe/checkout ─────────────────────────────────────────────
// Crée une session Stripe et un pending_event dans Firestore
export async function POST(request) {
  try {
    const body = await request.json()
    const { type, userId, eventData } = body

    if (!type || !userId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Pour le type 'host' uniquement pour l'instant
    if (type !== 'host') {
      return Response.json({ error: 'Only host type is supported yet' }, { status: 400 })
    }

    if (!eventData) {
      return Response.json({ error: 'Missing eventData' }, { status: 400 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // 1. Créer un pending_event dans Firestore
    const pendingRef = adminDb.collection('pending_events').doc()
    
    await pendingRef.set({
      hostId: userId,
      type: eventData.type || 'outing',
      location_name: eventData.location_name || eventData.venueName || '',
      city: eventData.city || '',
      time: eventData.time || eventData.startAt || '',
      capacity: Number(eventData.capacity) || 6,
      description: eventData.description || '',
      seatsTaken: 0,
      price: 2,
      currency: 'usd',
      status: 'pending_payment',
      createdAt: adminFieldValue.serverTimestamp(),
      updatedAt: adminFieldValue.serverTimestamp(),
    })

    console.log('[Checkout] Pending event created:', pendingRef.id)

    // 2. Créer la session Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: PRICE_CENTS,
            product_data: {
              name: `Host a Ronda event — ${eventData.type || 'meetup'}`,
              description: `Create your event in ${eventData.city || 'your city'}. It goes live immediately.`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: 'host',
        userId,
        pendingEventId: pendingRef.id,
        eventDataJson: JSON.stringify(eventData),
      },
      success_url: `${appUrl}/events?created=1`,
      cancel_url: `${appUrl}/create?cancelled=1`,
    })

    console.log('[Checkout] Stripe session created:', session.id)

    return Response.json({ url: session.url })
  } catch (err) {
    console.error('[Stripe Checkout] Error creating session:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}

// ─── PATCH: Stripe Webhook handler ─────────────────────────────────────────
// Gère checkout.session.completed
export async function PATCH(request) {
  const body = await request.text()
  const sig = headers().get('stripe-signature')
  const secret = process.env.STRIPE_WEBHOOK_SECRET

  if (!secret) {
    console.error('[Stripe Webhook] Missing STRIPE_WEBHOOK_SECRET')
    return Response.json({ error: 'Webhook secret missing' }, { status: 500 })
  }

  let event

  // 1. Valider la signature Stripe
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret)
  } catch (err) {
    console.error('[Stripe Webhook] Signature validation failed:', err.message)
    return Response.json({ error: 'Invalid signature' }, { status: 400 })
  }

  console.log('[Stripe Webhook] Received:', {
    type: event.type,
    id: event.id,
  })

  // 2. Gérer checkout.session.completed
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object

    if (session.payment_status !== 'paid') {
      console.warn('[Stripe Webhook] Session not paid:', session.id)
      return Response.json({ received: true })
    }

    const { type, userId, pendingEventId, eventDataJson } = session.metadata

    console.log('[Stripe Webhook] Processing:', { type, userId, pendingEventId })

    try {
      if (type === 'host') {
        // Récupérer le pending_event
        const pendingRef = adminDb.collection('pending_events').doc(pendingEventId)
        const pendingSnap = await pendingRef.get()

        if (!pendingSnap.exists) {
          console.error('[Stripe Webhook] Pending event not found:', pendingEventId)
          return Response.json({ received: true, error: 'Pending event not found' })
        }

        const pendingData = pendingSnap.data()
        const eventData = JSON.parse(eventDataJson || '{}')

        // Créer l'event final dans events_v2
        const eventRef = adminDb.collection('events_v2').doc()

        await eventRef.set({
          ...pendingData,
          title: eventData.title || `${pendingData.type} in ${pendingData.city}`,
          hostId: userId,
          status: 'published',
          paymentStatus: 'paid',
          stripeSessionId: session.id,
          stripePaymentIntent: session.payment_intent,
          publishedAt: adminFieldValue.serverTimestamp(),
          createdAt: pendingData.createdAt || adminFieldValue.serverTimestamp(),
          updatedAt: adminFieldValue.serverTimestamp(),
        })

        // Mettre à jour le pending_event
        await pendingRef.update({
          status: 'completed',
          publishedEventId: eventRef.id,
          stripeSessionId: session.id,
          updatedAt: adminFieldValue.serverTimestamp(),
        })

        console.log('[Stripe Webhook] Event created in events_v2:', eventRef.id)
      }
    } catch (err) {
      console.error('[Stripe Webhook] CRITICAL error:', {
        error: err.message,
        type,
        userId,
        pendingEventId,
        stripeSession: session.id,
      })
      // Retourner 200 à Stripe pour éviter les retries (on gère manuellement)
      return Response.json({ received: true, error: err.message })
    }
  }

  return Response.json({ received: true })
}