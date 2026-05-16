import './globals.css'
import Navbar from '@/components/landing/Navbar'
import Script from 'next/script'

export const metadata = {
  title:       'Ronda — Real Social Nights',
  description: 'Meet new people through curated social nights. Drinks, language exchanges and nights out in small groups. $2 to join.',
  openGraph: {
    title:       'Ronda — Real Social Nights',
    description: 'Curated social nights. Small groups. Real connections.',
    type:        'website',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Google Analytics - Script principal */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-NEYTELJ0JZ"
          strategy="afterInteractive"
        />

        {/* Google Analytics - Configuration */}
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-NEYTELJ0JZ');
          `}
        </Script>
      </head>
      <body>
        {/* ── Top urgency banner ── */}
        <div className="top-banner">
          <span className="top-banner__dot" aria-hidden="true" />
          <p>
            <strong>Limited spots this week</strong> — Only <strong>12 seats left</strong> across upcoming nights&nbsp;
            <a href="#upcoming" className="top-banner__link">Reserve yours →</a>
          </p>
        </div>

        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  )
}

/* ── Scoped styles via a global style tag ──────────────────────────
   (Next.js App Router: you can also move these to globals.css)     */
// eslint-disable-next-line react/no-unknown-property
const _bannerStyles = `
  .top-banner {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: linear-gradient(90deg, #1C1917 0%, #2C2420 50%, #1C1917 100%);
    color: #F5F3F1;
    font-family: var(--font-body);
    font-size: 13px;
    font-weight: 400;
    padding: 9px 20px;
    text-align: center;
    letter-spacing: 0.01em;
  }

  .top-banner strong {
    font-weight: 600;
    color: #fff;
  }

  .top-banner__dot {
    display: inline-block;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--coral);
    flex-shrink: 0;
    animation: pulseDot 1.5s ease infinite;
  }

  .top-banner__link {
    color: var(--coral);
    font-weight: 600;
    text-decoration: none;
    border-bottom: 1px dashed rgba(255,107,81,0.4);
    transition: border-color 0.2s;
  }

  .top-banner__link:hover {
    border-color: var(--coral);
  }

  /* Shift main content down to account for banner + navbar */
  main {
    padding-top: calc(clamp(60px, 8vw, 74px) + 38px);
  }

  @media (max-width: 600px) {
    .top-banner {
      font-size: 11.5px;
      padding: 8px 12px;
    }

    main {
      padding-top: calc(clamp(60px, 8vw, 74px) + 34px);
    }
  }
`
