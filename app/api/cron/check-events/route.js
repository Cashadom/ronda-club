import { adminDb, adminFieldValue } from '@/lib/firebaseAdmin'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// Constantes
const MIN_PARTICIPANTS = 3
const AUTO_CANCEL_HOURS = 6
const PRICE = 2

export async function GET(req) {
  try {
    console.log('🔍 [Cron Check Events] Starting auto-cancel check...')

    const now = new Date()
    const autoCancelTime = new Date(now.getTime() + AUTO_CANCEL_HOURS * 60 * 60 * 1000)
    
    // Récupérer les événements actifs qui commencent dans moins de AUTO_CANCEL_HOURS
    const meetupsRef = adminDb.collection('meetups')
    const snapshot = await meetupsRef
      .where('status', 'in', ['paid', 'active', 'confirmed'])
      .where('startAt', '<=', autoCancelTime.toISOString())
      .where('startAt', '>', now.toISOString())
      .get()

    console.log(`📊 [Cron Check Events] Found ${snapshot.size} events to check`)

    const results = {
      checked: 0,
      cancelled: 0,
      errors: 0,
      participantsRefunded: 0
    }

    for (const doc of snapshot.docs) {
      const event = doc.data()
      const eventId = doc.id
      const participantsCount = event.participants_count || 0

      console.log(`🔍 [Cron Check Events] Checking event ${eventId}: ${participantsCount} participants`)

      // Si moins de 3 participants, annuler l'événement
      if (participantsCount < MIN_PARTICIPANTS) {
        console.log(`⚠️ [Cron Check Events] Event ${eventId} has only ${participantsCount} participants, cancelling...`)

        try {
          // 🔥 IDEMPOTENCY: Vérifier si déjà annulé
          if (event.status === 'cancelled') {
            console.log(`⚠️ [Cron Check Events] Event ${eventId} already cancelled, skipping`)
            continue
          }

          // Récupérer tous les participants
          const participantsQuery = await adminDb
            .collection('meetup_participants')
            .where('event_id', '==', eventId)
            .where('status', '==', 'joined')
            .get()

          console.log(`📊 [Cron Check Events] Found ${participantsQuery.size} participants to refund`)

          let refundedCount = 0
          let refundErrors = 0

          // Rembourser chaque participant à 100%
          for (const participantDoc of participantsQuery.docs) {
            const participant = participantDoc.data()
            
            // 🔥 IDEMPOTENCY: Vérifier si déjà remboursé
            if (participant.refund_status === 'full' || participant.refund_status === 'done') {
              console.log(`⚠️ [Cron Check Events] Participant ${participant.user_id} already refunded, skipping`)
              continue
            }

            const amountToRefund = participant.amount_paid || PRICE
            
            try {
              if (participant.stripe_payment_intent) {
                await stripe.refunds.create({
                  payment_intent: participant.stripe_payment_intent,
                  amount: amountToRefund * 100,
                })
                console.log(`💰 [Cron Check Events] Refunded participant ${participant.user_id}: $${amountToRefund}`)
              }

              // Mettre à jour la participation
              await participantDoc.ref.update({
                refund_status: 'full',
                refund_amount: amountToRefund,
                status: 'refunded',
                cancelReason: 'insufficient_participants',
                cancelled_at: adminFieldValue.serverTimestamp(),
              })

              // Décrémenter events_attended de l'utilisateur
              const userRef = adminDb.collection('ronda_users').doc(participant.user_id)
              const userSnap = await userRef.get()
              if (userSnap.exists()) {
                await userRef.update({
                  events_attended: adminFieldValue.increment(-1),
                  updatedAt: adminFieldValue.serverTimestamp(),
                })
              }

              refundedCount++
              results.participantsRefunded++
              
            } catch (stripeError) {
              console.error(`❌ [Cron Check Events] Stripe refund failed for ${participant.user_id}:`, stripeError.message)
              refundErrors++
            }
          }

          // Mettre à jour l'événement
          await meetupsRef.doc(eventId).update({
            status: 'cancelled',
            cancelReason: 'insufficient_participants',
            cancelledAt: adminFieldValue.serverTimestamp(),
            cancelledBy: 'system',
            cancelledDetails: {
              participantsCount: participantsCount,
              minRequired: MIN_PARTICIPANTS,
              autoCancelHours: AUTO_CANCEL_HOURS,
              refundedParticipants: refundedCount,
              refundErrors: refundErrors
            },
            updatedAt: adminFieldValue.serverTimestamp(),
          })

          results.cancelled++
          console.log(`✅ [Cron Check Events] Event ${eventId} cancelled due to insufficient participants`)
          console.log(`📊 Stats: ${refundedCount} participants refunded, ${refundErrors} errors`)

        } catch (error) {
          console.error(`❌ [Cron Check Events] Error cancelling event ${eventId}:`, error.message)
          results.errors++
        }
      }
      
      results.checked++
    }

    console.log(`🎉 [Cron Check Events] Complete: checked=${results.checked}, cancelled=${results.cancelled}, errors=${results.errors}, participantsRefunded=${results.participantsRefunded}`)

    return new Response(
      JSON.stringify({
        success: true,
        ...results,
        message: `Checked ${results.checked} events, cancelled ${results.cancelled} due to low participation. ${results.participantsRefunded} participants refunded.`
      }),
      { status: 200 }
    )

  } catch (error) {
    console.error('💥 [Cron Check Events] Fatal error:', error.message)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500 }
    )
  }
}