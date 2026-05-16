import { RevealWrapper } from '@/components/ui/RevealWrapper'
import styles from './PricingComparison.module.css'

type OfferTone = 'muted' | 'featured'

type Offer = {
  tone: OfferTone
  badge: string
  label: string
  name: string
  description: string
  rates: { label: string; value: string; note?: string }[]
  payout: string
  payoutNote: string
  share: number
  rows: { label: string; value: string; state: 'good' | 'bad' | 'neutral' }[]
  bullets: { text: string; state: 'good' | 'bad' }[]
  cta: string
}

const OFFERS: Offer[] = [
  {
    tone: 'muted',
    badge: 'Konkurencja A',
    label: 'Typowa oferta rynkowa',
    name: 'Pośrednik',
    description: 'Model agencyjny z mniejszym zakresem obsługi prawnej po odmowie linii.',
    rates: [
      { label: 'Pozasądowo', value: '35%' },
      { label: 'Sądowo', value: '45%+', note: 'wynagrodzenie rośnie po wejściu w etap sądowy' },
    ],
    payout: '390 €',
    payoutNote: 'z 600 € odszkodowania',
    share: 65,
    rows: [
      { label: 'Prowizja firmy', value: '-210 €', state: 'bad' },
      { label: 'Koszty sądowe', value: 'po Twojej stronie', state: 'bad' },
      { label: 'Etap sądowy', value: 'wyższa prowizja', state: 'bad' },
      { label: 'Prawnik w sprawie', value: 'brak gwarancji', state: 'neutral' },
    ],
    bullets: [
      { text: 'Kontakt z linią często zostaje po stronie klienta', state: 'bad' },
      { text: 'Sprawa sądowa zwykle oznacza wyższe wynagrodzenie', state: 'bad' },
      { text: 'Weryfikacja roszczenia online', state: 'good' },
    ],
    cta: 'Oferta konkurencji',
  },
  {
    tone: 'featured',
    badge: 'Najkorzystniej',
    label: 'Kancelaria adwokatów i radców prawnych',
    name: 'oweme.',
    description: 'Success fee: płacisz wyłącznie po wygranej, a obsługę prawną bierzemy na siebie.',
    rates: [
      { label: 'Pozasądowo', value: '25%' },
      { label: 'Sądowo', value: '45%', note: 'koszty sądowe po stronie oweme' },
    ],
    payout: '450 €',
    payoutNote: 'z 600 € odszkodowania',
    share: 75,
    rows: [
      { label: 'Prowizja oweme', value: '-150 €', state: 'neutral' },
      { label: 'Koszty sądowe', value: 'pokrywa oweme', state: 'good' },
      { label: 'Etap sądowy', value: 'jasna stawka', state: 'good' },
      { label: 'Prawnik w sprawie', value: 'wliczony', state: 'good' },
    ],
    bullets: [
      { text: 'Weryfikacja w 60 sekund, bez rejestracji', state: 'good' },
      { text: 'Prawnicy przejmują korespondencję z linią', state: 'good' },
      { text: 'Przegrana = 0 zł dla Ciebie', state: 'good' },
    ],
    cta: 'Sprawdź odszkodowanie',
  },
  {
    tone: 'muted',
    badge: 'Konkurencja B',
    label: 'Duży agregator europejski',
    name: 'Agregator',
    description: 'Masowa obsługa roszczeń, często bez indywidualnego prawnika dla sprawy.',
    rates: [
      { label: 'Pozasądowo', value: '40%' },
      { label: 'Sądowo', value: '50%+', note: 'stawka może wzrosnąć po odmowie linii' },
    ],
    payout: '360 €',
    payoutNote: 'z 600 € odszkodowania',
    share: 60,
    rows: [
      { label: 'Prowizja firmy', value: '-240 €', state: 'bad' },
      { label: 'Koszty sądowe', value: 'zależnie od kraju', state: 'neutral' },
      { label: 'Etap sądowy', value: 'wyższa stawka', state: 'bad' },
      { label: 'Prawnik w sprawie', value: 'brak gwarancji', state: 'neutral' },
    ],
    bullets: [
      { text: 'Masowy model obsługi wielu spraw naraz', state: 'bad' },
      { text: 'Po wejściu do sądu prowizja może zostać podniesiona', state: 'bad' },
      { text: 'Szeroki zasięg międzynarodowy', state: 'good' },
    ],
    cta: 'Oferta konkurencji',
  },
]

function OfferCard({ offer }: { offer: Offer }) {
  const featured = offer.tone === 'featured'

  return (
    <article className={`${styles.card} ${featured ? styles.featured : ''}`}>
      <div className={styles.badge}>{offer.badge}</div>
      <div className={styles.label}>{offer.label}</div>
      <h3>{offer.name}</h3>
      <p className={styles.description}>{offer.description}</p>

      <div className={styles.rateGrid}>
        {offer.rates.map((rate) => (
          <div className={styles.rate} key={`${offer.name}-${rate.label}`}>
            <span>{rate.label}</span>
            <strong>{rate.value}</strong>
            {rate.note ? <small>{rate.note}</small> : null}
          </div>
        ))}
      </div>

      <div className={styles.payout}>
        <span>Otrzymujesz</span>
        <strong>{offer.payout}</strong>
        <p>{offer.payoutNote}</p>
        <div className={styles.shareLabel}>Twój udział</div>
        <div className={styles.track}>
          <div className={styles.fill} style={{ width: `${offer.share}%` }} />
        </div>
      </div>

      <dl className={styles.rows}>
        {offer.rows.map((row) => (
          <div className={styles.row} key={`${offer.name}-${row.label}`}>
            <dt>{row.label}</dt>
            <dd className={styles[row.state]}>{row.value}</dd>
          </div>
        ))}
      </dl>

      <ul className={styles.features}>
        {offer.bullets.map((bullet) => (
          <li className={styles[bullet.state]} key={`${offer.name}-${bullet.text}`}>
            <span aria-hidden="true" />
            {bullet.text}
          </li>
        ))}
      </ul>

      {featured ? (
        <a className={styles.cta} href="#checker">
          {offer.cta}
        </a>
      ) : (
        <div className={styles.disabledCta}>{offer.cta}</div>
      )}
    </article>
  )
}

export function PricingComparison() {
  return (
    <section className={styles.section} id="cennik" aria-labelledby="pricing-title">
      <div className={styles.inner}>
        <RevealWrapper>
          <div className={styles.header}>
            <span>Cennik</span>
            <h2 id="pricing-title">Ile naprawdę zostaje w Twojej kieszeni?</h2>
            <p>
              Przykład dla odszkodowania <strong>600 €</strong>. Porównaj prowizję,
              zakres obsługi i realną kwotę przelewu.
            </p>
          </div>
        </RevealWrapper>

        <div className={styles.grid}>
          {OFFERS.map((offer, index) => (
            <RevealWrapper key={offer.name} delay={index * 0.06}>
              <OfferCard offer={offer} />
            </RevealWrapper>
          ))}
        </div>

        <RevealWrapper delay={0.16}>
          <p className={styles.note}>
            Stawka oweme: 25% przy rozwiązaniu pozasądowym, 45% przy skierowaniu
            sprawy do sądu. U konkurencji etap sądowy często oznacza wyższe
            wynagrodzenie lub dodatkowe koszty. W oweme nie płacisz nic z góry.
          </p>
        </RevealWrapper>
      </div>
    </section>
  )
}
