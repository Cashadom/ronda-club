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

/**
 * Conversion-optimised section order:
 *
 *  1. HeroSection       — Hook + primary CTA above the fold
 *  2. StatsBar          — Instant social proof ("X people joined", "Y cities")
 *  3. UpcomingMeetups   — Tangible upcoming events → makes value concrete
 *  4. HowItWorks        — Removes friction / answers "how does this work?"
 *  5. CitiesMarquee     — Expands perceived scale / FOMO
 *  6. TrustSection      — Testimonials / reviews → handles objections
 *  7. FinalCTA          — Last call to action before exit
 *  8. Footer
 *
 * Key conversion principle: show proof BEFORE explanation.
 * StatsBar right after Hero gives credibility before anyone reads HowItWorks.
 * UpcomingMeetups shows real events so the product feels alive and scarce.
 */
export default function HomePage() {
  return (
    <>
      {/* ── 1. HERO ── above the fold hook */}
      <HeroSection />

      {/* ── 2. STATS BAR ── credibility immediately after hero */}
      <StatsBar />

      {/* ── 3. UPCOMING MEETUPS ── real events = scarcity + desire */}
      <UpcomingMeetups />

      {/* ── 4. HOW IT WORKS ── remove friction / explain value */}
      <HowItWorks />

      {/* ── 5. CITIES MARQUEE ── scale + FOMO */}
      <CitiesMarquee />

      {/* ── 6. TRUST SECTION ── testimonials handle final objections */}
      <TrustSection />

      {/* ── 7. FINAL CTA ── last push before exit */}
      <FinalCTA />

      {/* ── 8. FOOTER ── */}
      <Footer />
    </>
  )
}