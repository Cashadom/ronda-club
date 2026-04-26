'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Globe } from 'lucide-react'

const CORAL = '#FF7F50'
const CORAL_PALE = '#FFF0EB'

export default function TermsPage() {
  const router = useRouter()
  const [language, setLanguage] = useState('en')

  const terms = {
    de: {
      title: "Allgemeine Geschäftsbedingungen (AGB)",
      sections: [
        {
          heading: "1. Anerkennung der Bedingungen",
          content: [
            "Mit der Nutzung von Ronda Club (der 'Plattform') akzeptieren Sie diese Allgemeinen Geschäftsbedingungen.",
            "Wenn Sie nicht zustimmen, dürfen Sie die Plattform nicht nutzen.",
            "Sie müssen mindestens 18 Jahre alt sein, um ein Konto zu erstellen, eine Veranstaltung zu hosten oder daran teilzunehmen."
          ]
        },
        {
          heading: "2. Teilnahmegebühr",
          content: [
            "Teilnehmer müssen möglicherweise eine Teilnahmegebühr entrichten. Sofern nicht anders angegeben, beträgt die Standardteilnahmegebühr 2 USD pro Teilnehmer.",
            "Diese Gebühr hilft, Plattformbetrieb, Zahlungsabwicklung, Moderation, Betrugsprävention und die Schaffung eines zuverlässigeren Erlebnisses zu finanzieren.",
            "Zahlungen werden über Drittanbieter wie Stripe abgewickelt. Ronda Club speichert keine vollständigen Kreditkartendaten auf eigenen Servern."
          ]
        },
        {
          heading: "3. Stornierung durch den Host",
          content: [
            "Wenn ein Host eine Veranstaltung storniert, gelten folgende Regeln:",
            "Storniert der Host mindestens 72 Stunden vor der geplanten Veranstaltungszeit, kann ihm eine Teilrückerstattung von 50 % der anwendbaren host-bezogenen Gebühr gewährt werden.",
            "Wenn der Host weniger als 72 Stunden vor der Veranstaltung storniert, wird keine Rückerstattung gewährt.",
            "Beispiel: Bei einer host-bezogenen Gebühr von 2 USD beträgt die mögliche Rückerstattung 1 USD."
          ]
        },
        {
          heading: "4. Stornierung durch einen Teilnehmer",
          content: [
            "Storniert ein Teilnehmer seine Teilnahme, hängt die Rückerstattungsfähigkeit vom Zeitpunkt der Stornierung und den zum Zeitpunkt der Buchung angezeigten Regeln ab.",
            "Teilnahmegebühren können grundsätzlich nicht erstattet werden, sobald ein Platz reserviert wurde.",
            "Ronda Club kann in bestimmten Fällen wie technischen Fehlern, doppelten Zahlungen oder Veranstaltungsabsagen nach eigenem Ermessen Rückerstattungen gewähren."
          ]
        },
        {
          heading: "5. Haftungsausschluss",
          content: [
            "Ronda Club übernimmt keine Haftung für nutzergenerierte Veranstaltungen. Die Teilnahme erfolgt auf eigene Gefahr.",
            "Wir überwachen keine Offline-Interaktionen und übernehmen keine Verantwortung dafür.",
            "Der Dienst wird 'wie er ist' bereitgestellt, ohne Garantie auf unterbrechungsfreien Zugang."
          ]
        },
        {
          heading: "6. Datenschutz",
          content: [
            "Die Erhebung und Nutzung personenbezogener Daten ist in unserer Datenschutzerklärung beschrieben.",
            "Wir halten die EU-DSGVO ein.",
            "Ihre Rechte (Auskunft, Berichtigung, Löschung, Datenübertragbarkeit) können Sie per E-Mail an cyril.ragonet@gmail.com geltend machen."
          ]
        },
        {
          heading: "7. Anwendbares Recht",
          content: [
            "Es gilt französisches und europäisches Recht, sofern nicht zwingende Verbraucherschutzbestimmungen etwas anderes vorsehen.",
            "Im Streitfall verpflichten sich die Nutzer, Ronda Club zunächst in gutem Glauben zu kontaktieren, um eine einvernehmliche Lösung zu suchen."
          ]
        },
        {
          heading: "8. Kontakt",
          content: [
            "Bei Fragen, Beschwerden, Rückerstattungsanfragen oder Kontolöschung kontaktieren Sie uns unter: cyril.ragonet@gmail.com",
            "Anbieter: Ronda Club",
            "Stand: April 2026"
          ]
        }
      ]
    },
    en: {
      title: "Terms and Conditions",
      sections: [
        {
          heading: "1. Acceptance of Terms",
          content: [
            "By accessing or using Ronda Club (the \"Platform\"), you agree to be bound by these Terms and Conditions.",
            "If you do not agree with these Terms, you must not use the Platform.",
            "You must be at least 18 years old to create an account, host an event, or participate in an event."
          ]
        },
        {
          heading: "2. Service Description",
          content: [
            "Ronda Club is a social platform that allows users to discover, create, host, and join small in-person events such as drinks, coffee, walks, social meetups, and other real-life gatherings.",
            "Events may be created by users acting as hosts. Ronda Club provides the digital tools to publish, manage, and process participation, but does not directly organize or supervise offline events.",
            "The Platform may automatically manage certain event features, including participant limits, booking status, payment collection, cancellations, refunds, and attendance tracking."
          ]
        },
        {
          heading: "3. User Account",
          content: [
            "You are responsible for keeping your account credentials confidential and for all activity occurring under your account.",
            "You agree to provide accurate information and not to impersonate another person.",
            "Fake accounts, bots, spam, abusive use, or attempts to manipulate the Platform are strictly prohibited."
          ]
        },
        {
          heading: "4. Event Participation Fee",
          content: [
            "Participants may be required to pay a participation fee to join an event. Unless otherwise stated, the standard participation fee is USD 2 per participant.",
            "This fee helps cover platform operations, payment processing, moderation, fraud prevention, and the creation of a safer and more reliable experience.",
            "Payment of the participation fee confirms a participant's intention to attend and helps reduce no-shows and fake registrations.",
            "Payments are processed through third-party providers such as Stripe. Ronda Club does not store full credit card details on its own servers."
          ]
        },
        {
          heading: "5. Host Role and Responsibilities",
          content: [
            "A host is a user who creates and manages an event on the Platform.",
            "Hosts are responsible for providing accurate event details, including date, time, location, capacity, description, and any relevant conditions.",
            "Hosts must not create misleading, unsafe, illegal, discriminatory, or fake events."
          ]
        },
        {
          heading: "6. Participant Responsibilities",
          content: [
            "Participants are responsible for attending events they have joined and for behaving respectfully toward hosts, other participants, venues, and third parties.",
            "Participants must not harass, threaten, discriminate, stalk, assault, defame, or otherwise harm other users.",
            "Ronda Club does not guarantee compatibility, friendship, dating outcomes, or any specific result from attending an event."
          ]
        },
        {
          heading: "7. Event Cancellation by the Host",
          content: [
            "If a host cancels an event, refund rules may apply depending on the timing of the cancellation.",
            "If the host cancels the event at least 72 hours before the scheduled event time, the host may be eligible for a partial refund of 50% of the applicable host-related fee.",
            "For example, if the applicable host-related fee is USD 2, the eligible refund may be USD 1.",
            "If the host cancels less than 72 hours before the scheduled event time, no refund may be granted to the host.",
            "This policy is designed to discourage unreliable event creation, fake events, last-minute cancellations, and poor experiences for participants."
          ]
        },
        {
          heading: "8. Event Cancellation by a Participant",
          content: [
            "If a participant cancels their attendance, refund eligibility depends on the timing of the cancellation and the rules displayed at the time of booking.",
            "Unless otherwise stated, participant fees may be non-refundable once a spot has been reserved, because the reservation blocks a limited place that could have been used by another participant.",
            "Ronda Club may, at its discretion, allow refunds, credits, or partial refunds in specific cases, such as technical errors, duplicate payments, event cancellation, or exceptional circumstances.",
            "No refund is guaranteed for no-shows, late arrivals, change of mind, personal scheduling conflicts, or failure to attend the event.",
            "If an event is cancelled by the host or by Ronda Club, participants may be eligible for a refund or credit depending on the circumstances."
          ]
        },
        {
          heading: "9. Event Changes",
          content: [
            "Event details such as time, location, capacity, description, or format may change before the event.",
            "Users are responsible for checking event updates before attending.",
            "A change of venue, time, or format does not automatically guarantee a refund unless required by law or decided by Ronda Club at its discretion."
          ]
        },
        {
          heading: "10. Payments and Payment Processing",
          content: [
            "Payments are processed through third-party payment providers such as Stripe.",
            "Ronda Club does not store full credit card details on its own servers.",
            "By making a payment, you agree to the applicable payment provider's terms and processing rules.",
            "Ronda Club may refuse, cancel, or reverse a transaction in case of fraud, technical error, chargeback abuse, violation of these Terms, or suspicious activity."
          ]
        },
        {
          heading: "11. Refunds and Chargebacks",
          content: [
            "Refunds are handled according to the cancellation and refund rules stated in these Terms and displayed during the booking process.",
            "Refunds may take several business days to appear depending on the payment provider, bank, or card issuer.",
            "Users must not file abusive or fraudulent chargebacks after receiving access to an event or after violating the cancellation policy."
          ]
        },
        {
          heading: "12. User Conduct and Prohibited Behavior",
          content: [
            "Users must behave respectfully and lawfully at all times, both online and offline.",
            "The following are strictly prohibited: harassment, threats, hate speech, racism, sexism, discrimination, violence, stalking, fraud, impersonation, illegal activity, and sharing private information without consent."
          ]
        },
        {
          heading: "13. Offline Events and Assumption of Risk",
          content: [
            "Ronda Club connects users for real-life events, but does not control the behavior, actions, or intentions of users during offline interactions.",
            "You understand that attending an in-person event involves risks, including personal injury, illness, theft, property damage, or other unexpected situations.",
            "You voluntarily assume all risks related to attending, hosting, traveling to, or participating in events.",
            "Ronda Club is not responsible for the actions, omissions, or negligence of hosts, participants, venues, or third parties."
          ]
        },
        {
          heading: "14. No Responsibility for User Behavior",
          content: [
            "Ronda Club does not guarantee the identity, background, reliability, honesty, or behavior of any user.",
            "Any interaction between users is solely between those users.",
            "Ronda Club is not liable for disputes, damages, losses, injuries, or other harm resulting from user interactions."
          ]
        },
        {
          heading: "15. Content and Intellectual Property",
          content: [
            "You remain the owner of your content, but you grant Ronda Club a worldwide, non-exclusive, royalty-free license to host, display, and use your content for the operation of the Platform.",
            "Ronda Club's name, logo, design, software, and branding remain the property of Ronda Club or its licensors."
          ]
        },
        {
          heading: "16. Privacy and Data Protection",
          content: [
            "The collection and use of personal data are described in our Privacy Policy.",
            "We comply with applicable data protection laws, including the EU General Data Protection Regulation (GDPR).",
            "Users may request access, correction, deletion, or portability of their personal data by contacting us at cyril.ragonet@gmail.com.",
            "We do not sell users' personal data."
          ]
        },
        {
          heading: "17. Limitation of Liability",
          content: [
            "To the maximum extent permitted by law, Ronda Club shall not be liable for indirect, incidental, special, consequential, or punitive damages.",
            "Ronda Club shall not be liable for user behavior, offline incidents, event outcomes, missed events, or damages caused by third parties.",
            "Where liability cannot be excluded under applicable law, our liability shall be limited to the amount paid by the user for the event or service giving rise to the claim."
          ]
        },
        {
          heading: "18. Account Suspension and Termination",
          content: [
            "We may suspend or terminate your account if you violate these Terms, abuse the Platform, create unsafe events, harass users, commit fraud, or damage the community.",
            "You may stop using the Platform at any time."
          ]
        },
        {
          heading: "19. Changes to These Terms",
          content: [
            "We may update these Terms from time to time. When changes are material, we may notify users through the Platform or by email.",
            "Continued use of the Platform after changes means you accept the updated Terms."
          ]
        },
        {
          heading: "20. Governing Law and Disputes",
          content: [
            "These Terms are governed by applicable French and European law, unless mandatory consumer protection rules provide otherwise.",
            "In case of dispute, users agree to first contact Ronda Club in good faith to seek an amicable resolution."
          ]
        },
        {
          heading: "21. Contact",
          content: [
            "For questions, complaints, refund requests, account deletion, or legal notices, contact us at: cyril.ragonet@gmail.com.",
            "Provider: Ronda Club.",
            "Last updated: April 2026."
          ]
        }
      ]
    }
  }

  const current = terms[language]

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: CORAL,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '800px',
        backgroundColor: '#fff',
        borderRadius: '28px',
        padding: '40px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        maxHeight: '90vh',
        overflowY: 'auto',
      }}>
        {/* Back button */}
        <button
          onClick={() => router.back()}
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'transparent',
            border: 'none',
            color: CORAL,
            fontSize: '0.85rem',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>

        {/* Language toggle */}
        <button
          onClick={() => setLanguage(language === 'en' ? 'de' : 'en')}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: CORAL_PALE,
            border: 'none',
            padding: '6px 12px',
            borderRadius: '40px',
            fontSize: '0.7rem',
            fontWeight: 500,
            color: CORAL,
            cursor: 'pointer',
          }}
        >
          <Globe size={14} />
          {language === 'en' ? 'Auf Deutsch' : 'English'}
        </button>

        {/* Title */}
        <h1 style={{
          fontSize: '1.8rem',
          fontWeight: 800,
          color: CORAL,
          textAlign: 'center',
          marginBottom: '32px',
          marginTop: '8px',
        }}>
          {current.title}
        </h1>

        {/* Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {current.sections.map((section, idx) => (
            <div key={idx}>
              <h2 style={{
                fontSize: '1.2rem',
                fontWeight: 700,
                color: '#1a1a1a',
                marginBottom: '8px',
              }}>
                {section.heading}
              </h2>
              {section.content.map((text, i) => (
                <p key={i} style={{
                  fontSize: '0.85rem',
                  color: '#666',
                  lineHeight: 1.5,
                  marginBottom: '8px',
                }}>
                  {text}
                </p>
              ))}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '32px',
          paddingTop: '20px',
          borderTop: '1px solid #eee',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '0.7rem', color: '#999' }}>
            © 2026 Ronda. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}