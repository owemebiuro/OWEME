import type { Metadata } from 'next'
import { Nav } from '@/components/Nav/Nav'
import { Hero } from '@/components/Hero/Hero'
import { HowItWorks } from '@/components/HowItWorks/HowItWorks'
import { AmountChecker } from '@/components/AmountChecker/AmountChecker'
import { PricingComparison } from '@/components/PricingComparison/PricingComparison'
import { Reviews } from '@/components/Reviews/Reviews'
import { FAQ } from '@/components/FAQ/FAQ'
import { CtaSection } from '@/components/CtaSection/CtaSection'
import { Footer } from '@/components/Footer/Footer'
import { FAQ_ITEMS } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'oweme. — Odszkodowanie za opóźniony lot | do 600 €',
  description:
    'Adwokaci i radcowie prawni oweme dochodzą odszkodowań lotniczych z tytułu EC 261/2004. Bez opłat z góry, bez ryzyka. Sprawdź w 60 sekund.',
  keywords: ['odszkodowanie za opóźniony lot', 'EC 261/2004', 'odszkodowanie lotnicze Polska'],
  openGraph: {
    title: 'oweme. — do 600 € za opóźniony lot',
    locale: 'pl_PL',
    type: 'website',
  },
  alternates: { canonical: 'https://oweme.pl' },
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_ITEMS.map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.a,
    },
  })),
}

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Nav />
      <main>
        <Hero />
        <HowItWorks />
        <AmountChecker />
        <PricingComparison />
        <Reviews />
        <FAQ />
        <CtaSection />
      </main>
      <Footer />
    </>
  )
}
