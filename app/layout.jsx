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
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  )
}