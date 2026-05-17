import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Twoje prawa pasażera — oweme.',
  description:
    'Przewodniki po EC 261/2004, analizy 58 linii lotniczych i praktyczne porady. Sprawdź co Ci przysługuje za opóźniony lub odwołany lot.',
  keywords: [
    'odszkodowanie za opóźniony lot',
    'EC 261/2004',
    'prawa pasażera',
    'Ryanair odszkodowanie',
  ],
  openGraph: {
    title: 'Twoje prawa — oweme.',
    locale: 'pl_PL',
    type: 'website',
  },
  alternates: { canonical: 'https://oweme.pl/twoje-prawa' },
}

export default function TwojePrawaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
