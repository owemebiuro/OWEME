import Link from 'next/link'

import AlphaBar from './AlphaBar'
import AirlineCard from './AirlineCard'
import { AIRLINES, POPULAR_AIRLINES, groupByLetter } from './wiedza.data'
import s from './AirlinesSection.module.css'

export default function AirlinesSection() {
  const grouped = groupByLetter(AIRLINES)
  const sortedLetters = Object.keys(grouped).sort((a, b) => a.localeCompare(b, 'pl'))

  return (
    <section className={s.section} id="linie-lotnicze" aria-labelledby="linie-lotnicze-title">
      <div className={s.sectionHeader}>
        <p className={s.eyebrow}>58 linii lotniczych</p>
        <h2 id="linie-lotnicze-title">Poradniki według linii lotniczej</h2>
        <p>Sprawdź politykę odszkodowań swojej linii, typowe odmowy i praktyczne kroki po zakłóceniu lotu.</p>
      </div>

      <div className={s.popularAirlines} aria-label="Popularne linie lotnicze">
        {POPULAR_AIRLINES.map((airline) => (
          <Link key={airline.iata} href={`/wiedza/linie/${airline.iata.toLowerCase()}`} className={s.paCard}>
            <span className={s.paLogo} style={{ color: airline.color }}>
              {airline.iata}
            </span>
            <span className={s.paName}>{airline.name}</span>
            <span className={s.paCount}>{airline.articles} artykułów</span>
            <span className={s.paBadge}>Popularne</span>
          </Link>
        ))}
      </div>

      <AlphaBar availableLetters={sortedLetters} />

      <div className={s.airlineGroups}>
        {sortedLetters.map((letter) => (
          <div key={letter} id={`letter-${letter}`} className={s.airlineGroup}>
            <div className={s.agLetter}>{letter}</div>
            <div className={s.airlineGrid}>
              {grouped[letter].map((airline) => (
                <AirlineCard key={airline.iata} airline={airline} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
