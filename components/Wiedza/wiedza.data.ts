export interface Article {
  slug: string
  tag: string
  title: string
  date: string
  readMin: number
  featured: boolean
  author?: { initials: string; name: string; role: string }
  excerpt?: string
}

export const GENERAL_ARTICLES: Article[] = [
  {
    slug: 'odszkodowanie-za-opozniony-lot',
    tag: 'Opóźnienie',
    title: 'Odszkodowanie za opóźniony lot',
    excerpt:
      'Kiedy opóźnienie daje prawo do 250, 400 albo 600 euro i jak liczyć czas dotarcia do miejsca docelowego.',
    date: '14 maja 2026',
    readMin: 7,
    featured: true,
    author: { initials: 'AN', name: 'Anna Nowak', role: 'Radca prawny' },
  },
  {
    slug: 'odszkodowanie-za-odwolany-lot',
    tag: 'Odwołanie',
    title: 'Odszkodowanie za odwołany lot',
    date: '14 maja 2026',
    readMin: 6,
    featured: false,
  },
  {
    slug: 'overbooking',
    tag: 'Overbooking',
    title: 'Overbooking',
    date: '14 maja 2026',
    readMin: 6,
    featured: false,
  },
  {
    slug: 'strajk-linii-lotniczych',
    tag: 'Strajk',
    title: 'Strajk linii lotniczych',
    date: '14 maja 2026',
    readMin: 7,
    featured: false,
  },
  {
    slug: 'odszkodowanie-za-lot-przesiadkowy',
    tag: 'Przesiadki',
    title: 'Odszkodowanie za lot przesiadkowy',
    date: '14 maja 2026',
    readMin: 7,
    featured: false,
  },
  {
    slug: 'odszkodowanie-za-lot-czarterowy',
    tag: 'Czarter',
    title: 'Odszkodowanie za lot czarterowy',
    excerpt:
      'Kupiłeś wycieczkę all-inclusive i lot czarterowy był opóźniony lub odwołany? Sprawdź, kto wypłaca odszkodowanie i jak je odzyskać.',
    date: '17 maja 2026',
    readMin: 9,
    featured: false,
    author: { initials: 'ZP', name: 'Zespół prawny oweme.', role: 'Adwokaci i radcowie prawni' },
  },
  {
    slug: 'zwrot-za-lot',
    tag: 'Zwrot',
    title: 'Zwrot za lot',
    date: '14 maja 2026',
    readMin: 5,
    featured: false,
  },
  {
    slug: 'odszkodowanie-za-niewpuszczenie-na-poklad',
    tag: 'Odmowa wejścia',
    title: 'Odszkodowanie za niewpuszczenie na pokład samolotu',
    date: '14 maja 2026',
    readMin: 6,
    featured: false,
  },
]

export interface Airline {
  name: string
  iata: string
  country: string
  color: string
  articles: number
  popular?: boolean
}

export const AIRLINES: Airline[] = [
  { name: 'LOT Polish Airlines', iata: 'LO', country: 'Poland', color: '#004b87', articles: 16, popular: true },
  { name: 'Enter Air', iata: 'ENT', country: 'Poland', color: '#e30613', articles: 4 },
  { name: 'Buzz', iata: 'BZ', country: 'Poland', color: '#e8000d', articles: 3 },
  { name: 'SprintAir', iata: 'SPN', country: 'Poland', color: '#1a4f9e', articles: 2 },
  { name: 'SkyUp Malta', iata: 'SQD', country: 'Malta', color: '#0066cc', articles: 2 },
  { name: 'Ryanair', iata: 'FR', country: 'Ireland', color: '#ff6600', articles: 24, popular: true },
  { name: 'Wizz Air', iata: 'W6', country: 'Hungary', color: '#c5007e', articles: 19, popular: true },
  { name: 'easyJet', iata: 'U2', country: 'UK', color: '#ff6600', articles: 14, popular: true },
  { name: 'Norwegian Air Shuttle', iata: 'DY', country: 'Norway', color: '#d4001c', articles: 7 },
  { name: 'Transavia', iata: 'HV', country: 'Netherlands', color: '#00a0dc', articles: 5 },
  { name: 'Vueling', iata: 'VY', country: 'Spain', color: '#e1001a', articles: 6 },
  { name: 'Pegasus Airlines', iata: 'PC', country: 'Turkey', color: '#f6901e', articles: 8 },
  { name: 'Air Arabia', iata: 'G9', country: 'UAE', color: '#ff0000', articles: 3 },
  { name: 'Lufthansa', iata: 'LH', country: 'Germany', color: '#003580', articles: 11, popular: true },
  { name: 'SWISS', iata: 'LX', country: 'Switzerland', color: '#e30613', articles: 5 },
  { name: 'Austrian Airlines', iata: 'OS', country: 'Austria', color: '#e30613', articles: 4 },
  { name: 'Brussels Airlines', iata: 'SN', country: 'Belgium', color: '#004b87', articles: 4 },
  { name: 'KLM Royal Dutch Airlines', iata: 'KL', country: 'Netherlands', color: '#00a1de', articles: 9 },
  { name: 'Air France', iata: 'AF', country: 'France', color: '#002157', articles: 8 },
  { name: 'SAS Scandinavian Airlines', iata: 'SK', country: 'Sweden', color: '#005699', articles: 6 },
  { name: 'Finnair', iata: 'AY', country: 'Finland', color: '#002f6c', articles: 5 },
  { name: 'ITA Airways', iata: 'AZ', country: 'Italy', color: '#009246', articles: 4 },
  { name: 'Iberia', iata: 'IB', country: 'Spain', color: '#c8102e', articles: 7 },
  { name: 'TAP Air Portugal', iata: 'TP', country: 'Portugal', color: '#006a4e', articles: 5 },
  { name: 'Aegean Airlines', iata: 'A3', country: 'Greece', color: '#006db6', articles: 3 },
  { name: 'airBaltic', iata: 'BT', country: 'Latvia', color: '#006aad', articles: 3 },
  { name: 'Luxair', iata: 'LG', country: 'Luxembourg', color: '#ff0000', articles: 2 },
  { name: 'Tarom', iata: 'RO', country: 'Romania', color: '#002395', articles: 3 },
  { name: 'Croatia Airlines', iata: 'OU', country: 'Croatia', color: '#003087', articles: 3 },
  { name: 'Air Serbia', iata: 'JU', country: 'Serbia', color: '#c8102e', articles: 3 },
  { name: 'KM Malta Airlines', iata: 'KM', country: 'Malta', color: '#cf0921', articles: 2 },
  { name: 'Turkish Airlines', iata: 'TK', country: 'Turkey', color: '#e30613', articles: 7 },
  { name: 'Emirates', iata: 'EK', country: 'UAE', color: '#e21836', articles: 9, popular: true },
  { name: 'Qatar Airways', iata: 'QR', country: 'Qatar', color: '#5c0632', articles: 6 },
  { name: 'Etihad Airways', iata: 'EY', country: 'UAE', color: '#bd8b13', articles: 5 },
  { name: 'flydubai', iata: 'FZ', country: 'UAE', color: '#e40000', articles: 3 },
  { name: 'El Al', iata: 'LY', country: 'Israel', color: '#003399', articles: 4 },
  { name: 'Arkia', iata: 'IZ', country: 'Israel', color: '#003399', articles: 2 },
  { name: 'SunExpress', iata: 'XQ', country: 'Turkey', color: '#ff6600', articles: 4 },
  { name: 'United Airlines', iata: 'UA', country: 'USA', color: '#002d72', articles: 6 },
  { name: 'Delta Air Lines', iata: 'DL', country: 'USA', color: '#c01933', articles: 7 },
  { name: 'American Airlines', iata: 'AA', country: 'USA', color: '#003088', articles: 8, popular: true },
  { name: 'Air Canada', iata: 'AC', country: 'Canada', color: '#ff0000', articles: 5 },
  { name: 'Smartwings', iata: 'QS', country: 'Czech Republic', color: '#ff6600', articles: 3 },
  { name: 'Corendon Airlines', iata: 'XC', country: 'Turkey', color: '#ff7700', articles: 3 },
  { name: 'Freebird Airlines', iata: 'FH', country: 'Turkey', color: '#cc0000', articles: 2 },
  { name: 'Electra Airways', iata: 'ELB', country: 'Greece', color: '#003399', articles: 2 },
  { name: 'Nouvelair', iata: 'BJ', country: 'Tunisia', color: '#ff6600', articles: 2 },
  { name: 'Air Cairo', iata: 'SM', country: 'Egypt', color: '#c8102e', articles: 2 },
  { name: 'Nile Air', iata: 'NP', country: 'Egypt', color: '#e30613', articles: 2 },
  { name: 'Chair Airlines', iata: 'GM', country: 'Switzerland', color: '#001489', articles: 2 },
  { name: 'Mavi Gök Airlines', iata: 'MBH', country: 'Turkey', color: '#0055a4', articles: 1 },
  { name: 'Jet2', iata: 'LS', country: 'UK', color: '#f5a623', articles: 5 },
  { name: 'Neos', iata: 'NO', country: 'Italy', color: '#003087', articles: 2 },
  { name: 'Volotea', iata: 'V7', country: 'Spain', color: '#ff0000', articles: 3 },
  { name: 'Sky Express', iata: 'GQ', country: 'Greece', color: '#005baa', articles: 3 },
  { name: 'PLAY', iata: 'OG', country: 'Iceland', color: '#ff5722', articles: 2 },
  { name: 'Icelandair', iata: 'FI', country: 'Iceland', color: '#cc0000', articles: 3 },
]

export const POPULAR_AIRLINES = AIRLINES.filter((airline) => airline.popular)

export function groupByLetter(airlines: Airline[]): Record<string, Airline[]> {
  return airlines
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, 'pl'))
    .reduce<Record<string, Airline[]>>((acc, airline) => {
      const letter = airline.name[0].toUpperCase()
      if (!acc[letter]) acc[letter] = []
      acc[letter].push(airline)
      return acc
    }, {})
}
