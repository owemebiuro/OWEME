import Link from 'next/link'

import { Footer } from '@/components/Footer/Footer'
import { Nav } from '@/components/Nav/Nav'
import AirlinesSection from '@/components/Wiedza/AirlinesSection'
import GeneralSection from '@/components/Wiedza/GeneralSection'
import WiedzaHero from '@/components/Wiedza/WiedzaHero'
import s from './wiedza.module.css'

export default function WiedzaPage() {
  return (
    <>
      <Nav />
      <WiedzaHero />
      <main className={s.page}>
        <nav className={s.bc} aria-label="Breadcrumb">
          <Link href="/">oweme.</Link>
          <span className={s.bcSep}>›</span>
          <span className={s.bcCur}>Twoje prawa</span>
        </nav>

        <div className={s.sectionStack}>
          <div className={s.reveal}>
            <GeneralSection />
          </div>
          <div className={s.reveal}>
            <AirlinesSection />
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
