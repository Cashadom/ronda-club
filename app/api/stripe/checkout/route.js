import Stripe from 'stripe'
import { adminDb, adminFieldValue, adminAuth } from '@/lib/firebaseAdmin'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const PRICE_CENTS = 200 // $2.00 USD

// 🔐 UPGRADE 1: Rate limiting simple (stockage mémoire, pour commencer)
// En production, utilise Redis ou Upstash
const rateLimit = new Map()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX = 10 // 10 requêtes par minute

function checkRateLimit(userId, ip) {
  const key = `${userId}-${ip}`
  const now = Date.now()
  const windowStart = now - RATE_LIMIT_WINDOW
  
  const requests = rateLimit.get(key) || []
  const recentRequests = requests.filter(t => t > windowStart)
  
  if (recentRequests.length >= RATE_LIMIT_MAX) {
    return false
  }
  
  recentRequests.push(now)
  rateLimit.set(key, recentRequests)
  
  // Nettoyer la map toutes les heures
  if (Math.random() < 0.01) {
    for (const [k, timestamps] of rateLimit.entries()) {
      const validTimestamps = timestamps.filter(t => t > Date.now() - RATE_LIMIT_WINDOW)
      if (validTimestamps.length === 0) {
        rateLimit.delete(k)
      } else {
        rateLimit.set(k, validTimestamps)
      }
    }
  }
  
  return true
}

// 🔐 UPGRADE 2: Vérifier les events pending en attente
async function checkPendingEventsLimit(userId) {
  const pendingEventsQuery = await adminDb
    .collection('meetups')
    .where('hostId', '==', userId)
    .where('status', '==', 'pending')
    .get()
  
  // Max 5 events pending en attente de paiement
  const MAX_PENDING_EVENTS = 5
  return pendingEventsQuery.size < MAX_PENDING_EVENTS
}

export async function POST(request) {
  try {
    console.log('[Checkout] route hit')

    // 🔐 SÉCURITÉ 1: Récupérer userId depuis le token Firebase
    const authHeader = request.headers.get('authorization')
    console.log('[Checkout] Auth header present:', !!authHeader) // 🔥 DEBUG
    
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('[Checkout] Missing or invalid auth header')
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split('Bearer ')[1]
    console.log('[Checkout] Token length:', token?.length) // 🔥 DEBUG
    
    let decoded
    
    try {
      decoded = await adminAuth.verifyIdToken(token)
    } catch (authError) {
      console.error('[Checkout] Invalid token:', authError.message)
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = decoded.uid
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    
    // 🔐 UPGRADE 1: Rate limiting
    if (!checkRateLimit(userId, ip)) {
      console.error('[Checkout] Rate limit exceeded:', { userId, ip })
      return Response.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
    }
    
    console.log('[Checkout] Authenticated user:', userId)

    const body = await request.json()
    const { type, eventData, eventId, userName } = body

    console.log('[Checkout] type =', type)
    console.log('[Checkout] eventId =', eventId)
    console.log('[Checkout] has eventData =', !!eventData)

    if (!type) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL

    if (!appUrl) {
      console.error('[Checkout] Missing NEXT_PUBLIC_APP_URL')
      return Response.json({ error: 'Configuration error' }, { status: 500 })
    }

    // 🔥 FLUX 1: HOST - Créer un événement (status: pending)
    if (type === 'host') {
      if (!eventData) {
        return Response.json({ error: 'Missing eventData' }, { status: 400 })
      }

      // 🔐 UPGRADE 2: Limiter le nombre d'events pending
      const canCreateMore = await checkPendingEventsLimit(userId)
      if (!canCreateMore) {
        console.error('[Checkout] Too many pending events:', userId)
        return Response.json({ error: 'You have too many pending events. Complete payment for existing ones first.' }, { status: 400 })
      }

      // ✅ FIX CAPACITY: Pas de fallback ambigu, on prend directement eventData.capacity
      const capacity = Number(eventData.capacity)
      const capacity_min = Number(eventData.capacity_min || 6)
      const capacity_max = capacity
      
      if (isNaN(capacity) || capacity < 6 || capacity > 9) {
        console.error('[Checkout] Invalid capacity:', capacity)
        return Response.json({ error: 'Capacity must be between 6 and 9' }, { status: 400 })
      }
      
      if (capacity_min < 4 || capacity_min > capacity) {
        console.error('[Checkout] Invalid min capacity:', capacity_min)
        return Response.json({ error: 'Minimum capacity must be between 4 and max capacity' }, { status: 400 })
      }

      if (!eventData.city || typeof eventData.city !== 'string' || eventData.city.trim().length < 2) {
        return Response.json({ error: 'Valid city is required' }, { status: 400 })
      }

      if (!eventData.startAt) {
        return Response.json({ error: 'Start date is required' }, { status: 400 })
      }

      // ✅ TIMEZONE CORRECTION: Convertir la date UTC en objet Date pour validation
      const startDateUTC = new Date(eventData.startAt)
      const nowUTC = new Date()
      const minStartDateUTC = new Date(nowUTC.getTime() + 2 * 60 * 60 * 1000) // +2 heures
      
      if (isNaN(startDateUTC.getTime()) || startDateUTC <= minStartDateUTC) {
        return Response.json({ error: 'Start date must be at least 2 hours in the future' }, { status: 400 })
      }

      if (!eventData.type || !['outing', 'dinner', 'drinks', 'cultural'].includes(eventData.type)) {
        return Response.json({ error: 'Invalid event type' }, { status: 400 })
      }

      const meetupRef = adminDb.collection('meetups').doc()

      // ✅ TIMEZONE CORRECTION: startAt est déjà en UTC depuis le frontend
      await meetupRef.set({
        id: meetupRef.id,
        hostId: userId,
        type: eventData.type,
        title: eventData.title?.trim() || `${eventData.type} in ${eventData.city}`,
        description: eventData.description?.trim() || '',
        city: eventData.city.trim(),
        meetingPoint: eventData.meetingPoint?.trim() || '',
        venue: eventData.venue?.trim() || '',
        location_name: eventData.location_name?.trim() || eventData.meetingPoint?.trim() || '',
        startAt: eventData.startAt,
        timezone: eventData.timezone || 'UTC',
        coordinates: eventData.coordinates || null,
        capacity: capacity,
        capacity_min: capacity_min,
        capacity_max: capacity_max,
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
        hostId: userId,
        startAt: eventData.startAt,
        timezone: eventData.timezone,
        capacity: capacity,
        capacity_max: capacity_max,
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
                name: `Host a Ronda event — ${eventData.type}`,
                description: `Create your event in ${eventData.city}. It goes live immediately.`,
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
      
      // 🔐 SÉCURITÉ 4: Vérifier que l'event est disponible
      if (meetup.status !== 'paid') {
        return Response.json({ error: 'Event is not available' }, { status: 400 })
      }

      // 🔐 SÉCURITÉ 5: Empêcher un host de rejoindre son propre event
      if (meetup.hostId === userId) {
        console.error('[Checkout] Host cannot join own event:', { userId, hostId: meetup.hostId })
        return Response.json({ error: 'Host cannot join their own event' }, { status: 400 })
      }

      // ✅ TIMEZONE CORRECTION: Vérifier que l'event est dans le futur (UTC)
      const startDateUTC = new Date(meetup.startAt)
      const nowUTC = new Date()
      if (isNaN(startDateUTC.getTime()) || startDateUTC <= nowUTC) {
        return Response.json({ error: 'Event has already passed' }, { status: 400 })
      }

      // ✅ FIX CAPACITY: utiliser capacity en priorité
      const meetupLimit = Number(meetup.capacity ?? meetup.capacity_max ?? 9)
      const currentParticipants = meetup.participants_count || 0

      if (currentParticipants >= meetupLimit) {
        return Response.json({ error: 'Event is full' }, { status: 400 })
      }

      // Vérifier si déjà participant
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
                description: `Reserve your spot in ${meetup.city}.`,
              },
            },
            quantity: 1,
          },
        ],
        metadata: {
          checkoutType: 'join_event',
          userId,
          eventId,
          userName: userName?.trim() || '',
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
      { error: 'Checkout failed. Please try again.' },
      { status: 500 }
    )
  }
}