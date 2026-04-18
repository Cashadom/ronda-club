import { loadStripe } from '@stripe/stripe-js'

let stripePromise = null

export function getStripe() {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  }
  return stripePromise
}

/**
 * Create a Stripe Checkout session and redirect.
 * type: 'join' | 'host'
 */
export async function startCheckout({ type, eventId, userId, eventData }) {
  const res = await fetch('/api/stripe/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, eventId, userId, eventData }),
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Checkout failed')
  }

  const { url } = await res.json()

  // Redirect to Stripe hosted checkout
  window.location.href = url
}
