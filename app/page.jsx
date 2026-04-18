import {
  HeroSection,
  HowItWorks,
  StatsBar,
  CitiesMarquee,
  TrustSection,
  FinalCTA,
  Footer,
} from '@/components/landing/index'
import UpcomingMeetups from '@/components/landing/UpcomingMeetups'

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <UpcomingMeetups />
      <HowItWorks />
      <StatsBar />
      <CitiesMarquee />
      <TrustSection />
      <FinalCTA />
      <Footer />
    </>
  )
}