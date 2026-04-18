import './globals.css'
import Navbar from '@/components/landing/Navbar'

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
      <body>
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  )
}
