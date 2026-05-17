import Link from 'next/link'

import type { Airline } from './wiedza.data'
import s from './AirlinesSection.module.css'

interface AirlineCardProps {
  airline: Airline
}

export default function AirlineCard({ airline }: AirlineCardProps) {
  return (
    <Link href={`/twoje-prawa/linie/${airline.iata.toLowerCase()}`} className={s.airlineCard}>
      <div className={s.acLogo} style={{ color: airline.color }}>
        {airline.iata}
      </div>
      <div className={s.acInfo}>
        <div className={s.acName}>{airline.name}</div>
        <div className={s.acCode}>
          {airline.iata} · {airline.country}
        </div>
      </div>
      <span className={s.acCount}>{airline.articles} art.</span>
    </Link>
  )
}
