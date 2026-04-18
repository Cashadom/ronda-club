import { EVENTS } from '../_store'

export async function POST(req) {
  try {
    const body = await req.json()
    const { userId, eventData } = body

    if (!userId || !eventData) {
      return Response.json(
        { success: false, error: 'Missing userId or eventData' },
        { status: 400 }
      )
    }

    const event = {
      id: crypto.randomUUID(),
      userId,
      ...eventData,
      status: 'pending_payment',
      createdAt: new Date().toISOString(),
    }

    EVENTS.push(event)

    console.log('Draft created:', event)

    return Response.json({
      success: true,
      eventId: event.id,
      status: event.status,
    })
  } catch (err) {
    console.error('create-draft error:', err)
    return Response.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    )
  }
}