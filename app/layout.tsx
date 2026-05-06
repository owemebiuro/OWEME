import type { Metadata } from 'next'
import { Outfit, Manrope } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { TRPCReactProvider } from '@/components/providers/trpc-provider'
import './globals.css'

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
  display: 'swap',
})

const manrope = Manrope({
  variable: '--font-manrope',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'oweme. — Odszkodowanie za opóźniony lot | do 600 €',
  description:
    'Adwokaci i radcowie prawni oweme dochodzą odszkodowań lotniczych z tytułu EC 261/2004. Bez opłat z góry, bez ryzyka. Sprawdź w 60 sekund.',
  keywords: [
    'odszkodowanie za opóźniony lot',
    'EC 261/2004',
    'odszkodowanie lotnicze Polska',
  ],
  openGraph: {
    title: 'oweme. — do 600 € za opóźniony lot',
    description: 'Adwokaci i radcowie prawni dochodzą odszkodowań lotniczych. Bez opłat z góry.',
    locale: 'pl_PL',
    type: 'website',
  },
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://oweme.pl' },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pl" className={`${outfit.variable} ${manrope.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <TRPCReactProvider>{children}</TRPCReactProvider>
        <Analytics />
      </body>
    </html>
  )
}
