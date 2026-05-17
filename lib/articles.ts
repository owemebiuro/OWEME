export type Article = {
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  author: {
    initials: string;
    name: string;
    color?: string;
    role?: string;
    bio?: string;
  };
  date: string;
  dateUpdated?: string;
  readTime: number;
  views?: string;
  featured?: boolean;
};

export const ARTICLES: Article[] = [
  {
    slug: "we-261-2004-przewodnik",
    category: "Prawa pasażera",
    title: "WE 261/2004: Kompletny przewodnik po odszkodowaniach za opóźnione loty w 2025 roku",
    excerpt:
      "Rozporządzenie unijne daje Ci prawo do nawet 600 euro za opóźniony lub odwołany lot. Wyjaśniamy kiedy, jak i od kogo możesz to odzyskać — krok po kroku.",
    author: {
      initials: "MK",
      name: "Marta Kowalska",
      role: "Radca prawny, specjalizacja lotnicza",
      bio: "12 lat doświadczenia w prawie lotniczym. Prowadziła ponad 3000 spraw odszkodowawczych dla pasażerów z całej Europy.",
    },
    date: "12 maja 2025",
    dateUpdated: "15 maja 2025",
    readTime: 8,
    views: "24k",
    featured: true,
  },
  {
    slug: "zagubiony-bagaz-7-krokow",
    category: "Bagaż",
    title: "Zagubiony bagaż: 7 kroków które musisz zrobić natychmiast na lotnisku",
    excerpt:
      "Pierwsze 24 godziny są kluczowe. Pokażemy Ci dokładnie jak reagować, żeby nie stracić prawa do odszkodowania.",
    author: { initials: "PW", name: "Piotr Wiśniewski" },
    date: "3 maja 2025",
    readTime: 5,
    views: "15k",
  },
  {
    slug: "overbooking-jak-linie-obchodza-prawo",
    category: "Overbooking",
    title: "Overbooking — jak linie lotnicze obchodzą prawo i jak się bronić",
    excerpt:
      "Linie celowo sprzedają więcej biletów niż miejsc. Masz nie tylko prawo do odszkodowania, ale też do opieki na miejscu.",
    author: { initials: "AJ", name: "Anna Jabłońska", color: "#2a82e8" },
    date: "28 kwietnia 2025",
    readTime: 6,
  },
  {
    slug: "nadzwyczajne-okolicznosci",
    category: "Prawo UE",
    title: "Nadzwyczajne okoliczności: kiedy linia może odmówić wypłaty?",
    excerpt:
      "Zły stan techniczny a burza — to nie to samo. Wyjaśniamy kiedy \"siła wyższa\" jest wymówką, a kiedy rzeczywistym powodem.",
    author: { initials: "MK", name: "Marta Kowalska" },
    date: "20 kwietnia 2025",
    readTime: 7,
  },
  {
    slug: "case-study-4800-euro-rodzina",
    category: "Case study",
    title: "Jak odzyskaliśmy 4 800 € dla rodziny czteroosobowej z Warszawy",
    excerpt:
      "Lot do Cancún, opóźnienie 11 godzin. Linia odmawiała przez 8 miesięcy. Skończyło się wyrokiem sądu i pełną wypłatą.",
    author: { initials: "OW", name: "Redakcja oweme.", color: "#a8521c" },
    date: "14 kwietnia 2025",
    readTime: 4,
  },
  {
    slug: "przedawnienie-roszczenia",
    category: "Porady",
    title: "Przedawnienie roszczenia — ile czasu masz na złożenie wniosku?",
    excerpt:
      "W Polsce masz 3 lata, w Niemczech — tylko rok. Przepisy różnią się zależnie od kraju. Sprawdź zanim będzie za późno.",
    author: { initials: "PW", name: "Piotr Wiśniewski" },
    date: "7 kwietnia 2025",
    readTime: 3,
    views: "11k",
  },
  {
    slug: "ranking-linii-lotniczych",
    category: "Opóźnienia",
    title: "Ranking linii lotniczych: które najczęściej płacą bez walki?",
    excerpt:
      "Przeanalizowaliśmy 14 000 spraw. Ryanair, Wizz Air, LOT — kto płaci od ręki, a kto ciągnie sprawę latami?",
    author: { initials: "AJ", name: "Anna Jabłońska", color: "#2a82e8" },
    date: "1 kwietnia 2025",
    readTime: 9,
    views: "18k",
  },
  {
    slug: "odszkodowanie-za-opozniony-lot",
    category: "Opóźnienie",
    title: "Odszkodowanie za opóźniony lot",
    excerpt:
      "Kiedy opóźnienie daje prawo do 250, 400 albo 600 euro i jak liczyć czas dotarcia do miejsca docelowego.",
    author: { initials: "OW", name: "Redakcja oweme.", color: "#a8521c" },
    date: "14 maja 2026",
    readTime: 7,
  },
  {
    slug: "odszkodowanie-za-odwolany-lot",
    category: "Odwołanie",
    title: "Odszkodowanie za odwołany lot",
    excerpt:
      "Sprawdź, kiedy linia lotnicza musi wypłacić odszkodowanie za anulowany lot i kiedy może odmówić.",
    author: { initials: "OW", name: "Redakcja oweme.", color: "#a8521c" },
    date: "14 maja 2026",
    readTime: 6,
  },
  {
    slug: "overbooking",
    category: "Overbooking",
    title: "Overbooking",
    excerpt:
      "Co zrobić, gdy linia sprzedała więcej biletów niż miejsc i nie wpuszcza pasażera na pokład.",
    author: { initials: "OW", name: "Redakcja oweme.", color: "#a8521c" },
    date: "14 maja 2026",
    readTime: 6,
  },
  {
    slug: "strajk-linii-lotniczych",
    category: "Strajk",
    title: "Strajk linii lotniczych",
    excerpt:
      "Kiedy strajk nadal pozwala dochodzić odszkodowania, a kiedy linia może powołać się na nadzwyczajne okoliczności.",
    author: { initials: "OW", name: "Redakcja oweme.", color: "#a8521c" },
    date: "14 maja 2026",
    readTime: 7,
  },
  {
    slug: "odszkodowanie-za-lot-przesiadkowy",
    category: "Przesiadki",
    title: "Odszkodowanie za lot przesiadkowy",
    excerpt:
      "Jak liczyć opóźnienie przy przesiadkach i kiedy jedna rezerwacja obejmuje całą trasę.",
    author: { initials: "OW", name: "Redakcja oweme.", color: "#a8521c" },
    date: "14 maja 2026",
    readTime: 7,
  },
  {
    slug: "odszkodowanie-za-lot-czarterowy",
    category: "Czarter",
    title: "Odszkodowanie za lot czarterowy — czy mi przysługuje i jak je dostać?",
    excerpt:
      "Kupiłeś wycieczkę all-inclusive i lot czarterowy był opóźniony lub odwołany? Sprawdź, kiedy przysługuje Ci odszkodowanie, kto je wypłaca i jak je odzyskać.",
    author: {
      initials: "ZP",
      name: "Zespół prawny oweme.",
      color: "#a8521c",
      role: "Adwokaci i radcowie prawni",
      bio: "Specjalizacja: prawa pasażerów lotniczych, EC 261/2004.",
    },
    date: "17 maja 2026",
    dateUpdated: "17 maja 2026",
    readTime: 9,
  },
  {
    slug: "zwrot-za-lot",
    category: "Zwrot",
    title: "Zwrot za lot",
    excerpt:
      "Kiedy przysługuje zwrot ceny biletu, zmiana trasy albo dodatkowe odszkodowanie.",
    author: { initials: "OW", name: "Redakcja oweme.", color: "#a8521c" },
    date: "14 maja 2026",
    readTime: 5,
  },
  {
    slug: "odszkodowanie-za-niewpuszczenie-na-poklad",
    category: "Odmowa wejścia",
    title: "Odszkodowanie za niewpuszczenie na pokład samolotu",
    excerpt:
      "Twoje prawa przy odmowie wejścia na pokład, overbookingu i nieuzasadnionej odmowie odprawy.",
    author: { initials: "OW", name: "Redakcja oweme.", color: "#a8521c" },
    date: "14 maja 2026",
    readTime: 6,
  },
];

export function getArticleBySlug(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}

export const POPULAR = ARTICLES.filter((a) => a.views).sort(
  (a, b) => parseInt(b.views ?? "0") - parseInt(a.views ?? "0")
).slice(0, 4);
