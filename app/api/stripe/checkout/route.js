import Stripe from 'stripe'
import { adminDb, adminFieldValue } from '@/lib/firebaseAdmin'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const PRICE_CENTS = 200 // $2.00 USD

export async function POST(request) {
  try {
    console.log('[Checkout] route hit')

    const body = await request.json()
    const { type, userId, eventData, eventId, userName } = body

    console.log('[Checkout] type =', type)
    console.log('[Checkout] userId =', userId)
    console.log('[Checkout] eventId =', eventId)
    console.log('[Checkout] has eventData =', !!eventData)

    if (!type || !userId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL

    if (!appUrl) {
      return Response.json({ error: 'Missing NEXT_PUBLIC_APP_URL' }, { status: 500 })
    }

    // 🔥 FLUX 1: HOST - Créer un événement (status: pending)
    if (type === 'host') {
      if (!eventData) {
        return Response.json({ error: 'Missing eventData' }, { status: 400 })
      }

      const meetupRef = adminDb.collection('meetups').doc()

      await meetupRef.set({
        id: meetupRef.id,
        hostId: userId,
        type: eventData.type || 'outing',
        title: eventData.title || `${eventData.type || 'Event'} in ${eventData.city || ''}`,
        description: eventData.description || '',
        city: eventData.city || '',
        meetingPoint: eventData.meetingPoint || '',
        venue: eventData.venue || '',
        location_name: eventData.location_name || eventData.meetingPoint || '',
        startAt: eventData.startAt || eventData.time || '',
        coordinates: eventData.coordinates || null,
        capacity: Number(eventData.capacity) || 9,
        capacity_min: Number(eventData.capacity_min) || 6,
        capacity_max: Number(eventData.capacity_max) || 9,
        participants_count: 0,
        price: 2,
        currency: 'usd',
        status: 'pending',
        paymentStatus: 'pending',
        stripeSessionId: '',
        stripePaymentIntent: '',
        createdAt: adminFieldValue.serverTimestamp(),
        updatedAt: adminFieldValue.serverTimestamp(),
      })

      console.log('[Checkout] Meetup created with pending status:', {
        id: meetupRef.id,
        city: eventData.city,
        meetingPoint: eventData.meetingPoint,
        title: eventData.title,
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
          meetupId: meetupRef.id,
        },
        success_url: `${appUrl}/events?created=1`,
        cancel_url: `${appUrl}/create?cancelled=1`,
      })

      console.log('[Checkout] Stripe session created (host):', session.id)
      return Response.json({ url: session.url })
    }

    // 🔥 FLUX 2: JOIN - Réserver une place
    if (type === 'join') {
      if (!eventId) {
        return Response.json({ error: 'Missing eventId' }, { status: 400 })
      }

      console.log('[Checkout] Looking up meetup:', eventId)

      const meetupRef = adminDb.collection('meetups').doc(eventId)
      const meetupSnap = await meetupRef.get()

      if (!meetupSnap.exists) {
        return Response.json({ error: 'Event not found' }, { status: 404 })
      }

      const meetup = meetupSnap.data()
      
      // 🔥 CORRECTION 2: seulement 'paid' (plus 'open')
      if (meetup.status !== 'paid') {
        return Response.json({ error: 'Event is not available' }, { status: 400 })
      }

      const meetupLimit = meetup.capacity_max || meetup.capacity || 9
      const currentParticipants = meetup.participants_count || 0

      if (currentParticipants >= meetupLimit) {
        return Response.json({ error: 'Event is full' }, { status: 400 })
      }

      // 🔥 CORRECTION 1: participants → meetup_participants
      const existingParticipantQuery = await adminDb
        .collection('meetup_participants')
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
    console.error('[Stripe Checkout] Error:', err?.message)
    console.error('[Stripe Checkout] Stack:', err?.stack)

    return Response.json(
      { error: err?.message || 'Unknown checkout error' },
      { status: 500 }
    )
  }
}