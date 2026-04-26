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
            "Mit der Nutzung von Ronda (\"die Plattform\") akzeptieren Sie diese Allgemeinen Geschäftsbedingungen. Die Nutzung ist nicht gestattet, wenn Sie nicht einverstanden sind.",
            "Mindestalter: 18 Jahre",
            "Zugang kann je nach Standort oder rechtlichen Anforderungen eingeschränkt sein."
          ]
        },
        {
          heading: "2. Leistungsbeschreibung",
          content: [
            "Erstellung, Entdeckung und Teilnahme an Veranstaltungen.",
            "Echtzeit-Interaktionen und Networking.",
            "Personalisierte Inhalte basierend auf Nutzerpräferenzen."
          ]
        },
        {
          heading: "3. Nutzerkonto",
          content: [
            "Registrierung erforderlich für volle Funktionalität.",
            "Sie sind für die Sicherheit Ihres Kontos verantwortlich.",
            "Verbot: Fake-Accounts, Bots oder missbräuchliche Nutzung."
          ]
        },
        {
          heading: "4. Nutzerverhalten",
          content: [
            "Keine Hassrede, Rassismus, Diskriminierung oder Belästigung.",
            "Verbotene Inhalte: Pornografische, gewalttätige oder verleumderische Inhalte; Illegale Aktivitäten (z.B. Betrug, Drohungen, Urheberrechtsverletzungen).",
            "Datenschutz anderer Nutzer respektieren (keine Weitergabe ohne Einwilligung)."
          ]
        },
        {
          heading: "5. Geistiges Eigentum",
          content: [
            "Von Nutzern generierte Inhalte bleiben deren Eigentum, aber Sie gewähren der Plattform eine weltweite Lizenz zur Nutzung und Moderation.",
            "Markenzeichen, Logos und Software sind Eigentum von Ronda oder deren Lizenzgebern."
          ]
        },
        {
          heading: "6. Datenschutz",
          content: [
            "Datenerhebung und -nutzung sind in unserer Datenschutzerklärung beschrieben.",
            "Wir halten die EU-DSGVO sowie das deutsche BDSG ein.",
            "Ihre Rechte (Auskunft, Berichtigung, Löschung, Datenübertragbarkeit) können per E-Mail an cyril.ragonet@gmail.com geltend gemacht werden."
          ]
        },
        {
          heading: "7. Haftungsausschluss",
          content: [
            "Die Plattform übernimmt keine Haftung für nutzergenerierte Veranstaltungen; Teilnahme erfolgt auf eigenes Risiko.",
            "Wir überwachen keine Offline-Interaktionen und übernehmen keine Verantwortung dafür.",
            "Der Dienst wird 'wie er ist' bereitgestellt, ohne Garantie auf unterbrechungsfreien Zugang."
          ]
        },
        {
          heading: "8. Änderungen & Kündigung",
          content: [
            "Wir können Konten bei Verstößen sperren.",
            "Diese Bedingungen können mit vorheriger Ankündigung aktualisiert werden."
          ]
        },
        {
          heading: "9. Anwendbares Recht & Streitigkeiten",
          content: [
            "Anwendbares Recht: deutsches Recht (§ 312g BGB, TMG) und EU-Vorschriften.",
            "Streitbeilegung: zunächst einvernehmliche Lösung anstreben."
          ]
        },
        {
          heading: "10. Impressum",
          content: [
            "Anbieter: Ronda GmbH",
            "E-Mail: cyril.ragonet@gmail.com"
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
            "By using Ronda (the 'Platform'), you accept these Terms and Conditions. Do not use if you disagree.",
            "Minimum age: 18 years",
            "Access may be restricted depending on location or legal requirements."
          ]
        },
        {
          heading: "2. Service Description",
          content: [
            "Event creation, discovery, and participation.",
            "Real-time interactions and networking.",
            "Personalized content based on user preferences."
          ]
        },
        {
          heading: "3. User Account",
          content: [
            "Registration required for full functionality.",
            "You are responsible for the security of your account.",
            "Prohibited: fake accounts, bots, or misuse."
          ]
        },
        {
          heading: "4. User Conduct",
          content: [
            "No hate speech, racism, discrimination, or harassment.",
            "Prohibited content: pornographic, violent, or defamatory material; illegal activities (e.g., fraud, threats, copyright infringement).",
            "Respect others' privacy (do not share without consent)."
          ]
        },
        {
          heading: "5. Intellectual Property",
          content: [
            "User-generated content remains yours, but you grant the platform a global license to use and moderate it.",
            "Trademarks, logos, and software are owned by Ronda or its licensors."
          ]
        },
        {
          heading: "6. Privacy",
          content: [
            "Data collection and use are described in our Privacy Policy.",
            "We comply with EU GDPR and German BDSG.",
            "Your rights (access, rectification, deletion, data portability) can be exercised via cyril.ragonet@gmail.com."
          ]
        },
        {
          heading: "7. Disclaimers",
          content: [
            "The platform is not liable for user-generated events; participation is at your own risk.",
            "We do not monitor offline interactions and are not responsible for them.",
            "The service is provided 'as is' with no guarantee of uninterrupted access."
          ]
        },
        {
          heading: "8. Modifications & Termination",
          content: [
            "We may suspend accounts for violations.",
            "These terms may be updated with prior notice."
          ]
        },
        {
          heading: "9. Governing Law & Disputes",
          content: [
            "Applicable law: German law (§ 312g BGB, TMG) and EU regulations.",
            "Dispute resolution: seek amicable settlement first."
          ]
        },
        {
          heading: "10. Legal Notice (Impressum)",
          content: [
            "Provider: Ronda GmbH",
            "Email: cyril.ragonet@gmail.com"
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