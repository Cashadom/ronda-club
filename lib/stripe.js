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
export async function startCheckout({ type, eventId, eventData }) {
  // 🔥 Vérifier que l'utilisateur est connecté
  const user = auth.currentUser
  if (!user) {
    throw new Error('You must be logged in to join or host an event')
  }

  // 🔥 Récupérer le token Firebase (forcer le rafraîchissement)
  const token = await user.getIdToken(true)

  // 🔥 Appel à l'API Stripe avec le token dans l'en-tête
  const res = await fetch('/api/stripe/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ type, eventId, eventData }),
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error || 'Checkout failed')
  }

  // Redirection vers Stripe Checkout
  window.location.href = data.url
}