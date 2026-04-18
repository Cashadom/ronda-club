import { EVENTS } from '../_store'

export async function POST(req) {
  try {
    const body = await req.json()
    const { eventId } = body

    if (!eventId) {
      return Response.json(
        { success: false, error: 'Missing eventId' },
        { status: 400 }
      )
    }

    const event = EVENTS.find((item) => item.id === eventId)

    if (!event) {
      return Response.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      )
    }

    if (event.status !== 'pending_payment') {
      return Response.json(
        {
          success: false,
          error: `Event cannot be confirmed from status: ${event.status}`,
        },
        { status: 400 }
      )
    }

    event.status = 'live'
    event.paidAt = new Date().toISOString()

    console.log('Payment confirmed for:', eventId)

    return Response.json({
      success: true,
      status: event.status,
      event,
    })
  } catch (err) {
    console.error('confirm-payment error:', err)
    return Response.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    )
  }
}