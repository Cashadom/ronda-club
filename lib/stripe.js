import { loadStripe } from '@stripe/stripe-js'
import { auth } from '@/lib/firebase'

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
  // 🔥 CRITICAL: Vérifier que l'utilisateur est connecté
  const user = auth.currentUser
  
  if (!user) {
    throw new Error('You must be logged in to join or host an event')
  }

  // 🔥 CRITICAL: Récupérer le token Firebase
  const token = await user.getIdToken()

  const res = await fetch('/api/stripe/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
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