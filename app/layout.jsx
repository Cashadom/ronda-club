import './globals.css'
import Navbar from '@/components/landing/Navbar'
import Script from 'next/script'

export const metadata = {
  title:       'Ronda — Real Meetups. Real People.',
  description: 'Join small real-life meetups in your city. Drinks, coffee, walks, dinners. $2 to join. Small groups. Real presence.',
  openGraph: {
    title:       'Ronda — Real Meetups. Real People.',
    description: 'Small groups. Real presence. One tap.',
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