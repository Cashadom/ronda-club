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
      // 🔥 FLUX 1: PUBLISH_EVENT - création dans meetups
      if (checkoutType === 'publish_event') {
        const { userId, pendingEventId, eventDataJson } = metadata

        const pendingRef = adminDb.collection('pending_events').doc(pendingEventId)
        const pendingSnap = await pendingRef.get()

        if (!pendingSnap.exists) {
          console.error('❌ Pending not found:', pendingEventId)
          return new Response('ok', { status: 200 })
        }

        const pendingData = pendingSnap.data()
        const eventData = JSON.parse(eventDataJson || '{}')

        // 🔥 CORRECTION: Convertir les coordonnées en nombres
        let normalizedCoordinates = null
        const rawCoords = pendingData.coordinates || eventData.coordinates
        if (rawCoords && rawCoords.lat && rawCoords.lng) {
          normalizedCoordinates = {
            lat: Number(rawCoords.lat),      // force en number
            lng: Number(rawCoords.lng),      // force en number
            name: rawCoords.name || pendingData.city || ''
          }
          console.log('🗺️ Coordinates normalized:', normalizedCoordinates)
        }

        // 🔥 meetups au lieu de events
        const meetupRef = adminDb.collection('meetups').doc()

        // 🔥 TOUS les champs sont maintenant transférés
        await meetupRef.set({
          // Champs de base
          ...pendingData,
          
          // Titre et description
          title: eventData.title || pendingData.title || `${pendingData.type} in ${pendingData.city}`,
          description: pendingData.description || eventData.description || '',
          
          // Hôte
          host_id: userId,
          hostId: userId,  // Pour compatibilité
          
          // Lieu (NOUVEAUX CHAMPS)
          city: pendingData.city || eventData.city || '',
          meetingPoint: pendingData.meetingPoint || eventData.meetingPoint || '',
          venue: pendingData.venue || eventData.venue || '',
          location_name: pendingData.location_name || eventData.location_name || pendingData.meetingPoint || '',
          
          // 🔥 Coordonnées géographiques CORRIGÉES (avec nombres)
          coordinates: normalizedCoordinates,
          
          // Capacités
          capacity: Number(pendingData.capacity) || 9,
          capacity_min: Number(pendingData.capacity_min) || Number(eventData.capacity_min) || 6,
          capacity_max: Number(pendingData.capacity_max) || Number(eventData.capacity_max) || 9,
          
          // Participants
          participants_count: 0,
          seatsTaken: 0,
          
          // Type et statut
          type: pendingData.type || eventData.type || 'outing',
          status: 'open',
          paymentStatus: 'paid',
          
          // Stripe
          stripeSessionId: session.id,
          stripePaymentIntent: session.payment_intent,
          
          // Timestamps
          timestamp: pendingData.createdAt || adminFieldValue.serverTimestamp(),
          publishedAt: adminFieldValue.serverTimestamp(),
          createdAt: pendingData.createdAt || adminFieldValue.serverTimestamp(),
          updatedAt: adminFieldValue.serverTimestamp(),
        })

        await pendingRef.update({
          status: 'completed',
          publishedMeetupId: meetupRef.id,
          updatedAt: adminFieldValue.serverTimestamp(),
        })

        console.log('🔥 MEETUP PUBLISHED:', meetupRef.id, {
          city: pendingData.city,
          meetingPoint: pendingData.meetingPoint,
          venue: pendingData.venue,
          hasCoordinates: !!normalizedCoordinates,
          coordinatesType: normalizedCoordinates ? typeof normalizedCoordinates.lat : 'none',
          capacity_min: pendingData.capacity_min,
          capacity_max: pendingData.capacity_max,
        })
      }

      // 🔥 FLUX 2: JOIN_EVENT - réservation dans meetups
      if (checkoutType === 'join_event') {
        const { userId, eventId, userName } = metadata

        const meetupRef = adminDb.collection('meetups').doc(eventId)

        await adminDb.runTransaction(async (tx) => {
          const meetupSnap = await tx.get(meetupRef)

          if (!meetupSnap.exists) {
            throw new Error('MEETUP_NOT_FOUND')
          }

          const meetup = meetupSnap.data()
          const meetupLimit = meetup.capacity_max || meetup.capacity || 9
          const currentParticipants = meetup.participants_count || 0

          if (currentParticipants >= meetupLimit) {
            throw new Error('MEETUP_FULL')
          }

          // Vérifier doublon de session Stripe
          const duplicateQuery = adminDb
            .collection('participants')
            .where('event_id', '==', eventId)
            .where('stripe_session_id', '==', session.id)

          const duplicateSnap = await tx.get(duplicateQuery)

          if (!duplicateSnap.empty) {
            console.log('⚠️ Duplicate webhook, skipping')
            return
          }

          // Vérifier que l'utilisateur n'a pas déjà rejoint
          const userExistingQuery = adminDb
            .collection('participants')
            .where('event_id', '==', eventId)
            .where('user_id', '==', userId)

          const userExistingSnap = await tx.get(userExistingQuery)

          if (!userExistingSnap.empty) {
            throw new Error('ALREADY_JOINED')
          }

          const newCount = currentParticipants + 1
          let newStatus = 'open'
          if (newCount >= meetupLimit) newStatus = 'full'
          else if (newCount >= 6) newStatus = 'confirmed'

          tx.update(meetupRef, {
            participants_count: newCount,
            status: newStatus,
            updatedAt: adminFieldValue.serverTimestamp(),
          })

          const participantRef = adminDb.collection('participants').doc()
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
      console.error('💥 Webhook error:', err.message)
      return new Response('ok', { status: 200 })
    }
  }

  return new Response('ok', { status: 200 })
}