import { adminDb, adminFieldValue } from '@/lib/firebaseAdmin'

export async function PUT(req, { params }) {
  try {
    const { id: eventId } = await params
    const body = await req.json()
    const { userId, isHost, ...updates } = body

    console.log('🔍 [Edit Event] Request:', { eventId, userId, isHost })

    if (!eventId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400 }
      )
    }

    // Vérifier que l'utilisateur est l'host
    if (!isHost) {
      return new Response(
        JSON.stringify({ error: 'Only the host can edit this event' }),
        { status: 403 }
      )
    }

    const meetupRef = adminDb.collection('meetups').doc(eventId)
    const meetupSnap = await meetupRef.get()

    if (!meetupSnap.exists) {
      return new Response(
        JSON.stringify({ error: 'Event not found' }),
        { status: 404 }
      )
    }

    const meetup = meetupSnap.data()

    // Vérifier que l'event n'est pas annulé ou passé
    if (meetup.status === 'cancelled') {
      return new Response(
        JSON.stringify({ error: 'Cannot edit a cancelled event' }),
        { status: 400 }
      )
    }

    const eventDate = new Date(meetup.startAt)
    const now = new Date()
    
    if (eventDate < now) {
      return new Response(
        JSON.stringify({ error: 'Cannot edit a past event' }),
        { status: 400 }
      )
    }

    // Champs autorisés à la modification
    const allowedFields = [
      'title', 'description', 'meetingPoint', 'venue', 
      'location_name', 'city', 'startAt', 'capacity_max'
    ]
    
    const filteredUpdates = {}
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field]
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return new Response(
        JSON.stringify({ error: 'No valid fields to update' }),
        { status: 400 }
      )
    }

    // Ajouter updatedAt
    filteredUpdates.updatedAt = adminFieldValue.serverTimestamp()

    await meetupRef.update(filteredUpdates)

    console.log(`✅ [Edit Event] Event ${eventId} updated:`, Object.keys(filteredUpdates))

    return new Response(
      JSON.stringify({ 
        success: true, 
        updatedFields: Object.keys(filteredUpdates),
        message: 'Event updated successfully'
      }),
      { status: 200 }
    )

  } catch (error) {
    console.error('💥 [Edit Event] Error:', error.message)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    )
  }
}