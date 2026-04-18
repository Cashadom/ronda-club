export async function POST(req) {
  try {
    const body = await req.text()

    console.log('Stripe webhook received:', body)

    // ⚠️ ici plus tard :
    // - vérifier signature Stripe
    // - récupérer eventId depuis metadata
    // - passer event en "live"

    return new Response('ok', { status: 200 })
  } catch (err) {
    console.error(err)
    return new Response('error', { status: 500 })
  }
}