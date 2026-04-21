import Stripe from 'stripe'
import { adminDb, adminFieldValue } from '@/lib/firebaseAdmin'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const PRICE_CENTS = 200 // $2.00 USD

// ─── POST /api/stripe/checkout ─────────────────────────────────────────────
// UNIQUEMENT création de sessions Stripe - PAS de webhook ici
export async function POST(request) {
  try {
    const body = await request.json()
    const { type, userId, eventData, eventId, userName } = body

    if (!type || !userId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL

    if (!appUrl) {
      return Response.json({ error: 'Missing NEXT_PUBLIC_APP_URL' }, { status: 500 })
    }

    // 🔥 FLUX 1: HOST - Créer un nouvel événement
    if (type === 'host') {
      if (!eventData) {
        return Response.json({ error: 'Missing eventData' }, { status: 400 })
      }

      const pendingRef = adminDb.collection('pending_events').doc()

      await pendingRef.set({
        hostId: userId,
        type: eventData.type || 'outing',
        city: eventData.city || '',
        meetingPoint: eventData.meetingPoint || '',
        time: eventData.time || eventData.startAt || '',
        capacity: Number(eventData.capacity) || 9,
        description: eventData.description || '',

        location_name: eventData.location_name || eventData.meetingPoint || '',
        venue: eventData.venue || '',
        coordinates: eventData.coordinates || null,

        capacity_min: Number(eventData.capacity_min) || 6,
        capacity_max: Number(eventData.capacity_max) || 9,

        seatsTaken: 0,
        participants_count: 0,
        price: 2,
        currency: 'usd',
        status: 'pending_payment',

        createdAt: adminFieldValue.serverTimestamp(),
        updatedAt: adminFieldValue.serverTimestamp(),
      })

      console.log('[Checkout] Pending event created with full data:', {
        id: pendingRef.id,
        city: eventData.city,
        meetingPoint: eventData.meetingPoint,
        venue: eventData.venue,
        hasCoordinates: !!eventData.coordinates,
      })

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
          checkoutType: 'publish_event',
          userId,
          pendingEventId: pendingRef.id,
          eventDataJson: JSON.stringify(eventData),
        },
        success_url: `${appUrl}/events?created=1`,
        cancel_url: `${appUrl}/create?cancelled=1`,
      })

      console.log('[Checkout] Stripe session created (host):', session.id)
      return Response.json({ url: session.url })
    }

    // 🔥 FLUX 2: JOIN - Réserver une place sur un événement existant
    if (type === 'join') {
      if (!eventId) {
        return Response.json({ error: 'Missing eventId' }, { status: 400 })
      }

      const meetupRef = adminDb.collection('meetups').doc(eventId)
      const meetupSnap = await meetupRef.get()

      if (!meetupSnap.exists) {
        return Response.json({ error: 'Event not found' }, { status: 404 })
      }

      const meetup = meetupSnap.data()
      const meetupLimit = meetup.capacity_max || meetup.capacity || 9
      const currentParticipants = meetup.participants_count || meetup.seatsTaken || 0

      if (currentParticipants >= meetupLimit) {
        return Response.json({ error: 'Event is full' }, { status: 400 })
      }

      const existingParticipantQuery = await adminDb
        .collection('participants')
        .where('event_id', '==', eventId)
        .where('user_id', '==', userId)
        .get()

      if (!existingParticipantQuery.empty) {
        return Response.json({ error: 'Already joined' }, { status: 400 })
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: 'usd',
              unit_amount: PRICE_CENTS,
              product_data: {
                name: `Join Ronda event — ${meetup.title || meetup.type || 'meetup'}`,
                description: `Reserve your spot in ${meetup.city || 'your city'}. Meeting point: ${meetup.meetingPoint || 'see description'}`,
              },
            },
            quantity: 1,
          },
        ],
        metadata: {
          checkoutType: 'join_event',
          userId,
          eventId,
          userName: userName || '',
        },
        success_url: `${appUrl}/events/${eventId}?joined=1&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}/events/${eventId}?cancelled=1`,
      })

      console.log('[Checkout] Stripe session created (join):', session.id)
      return Response.json({ url: session.url })
    }

    return Response.json({ error: 'Invalid type' }, { status: 400 })
  } catch (err) {
    console.error('[Stripe Checkout] Error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}