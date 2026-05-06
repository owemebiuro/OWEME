import type { DisruptionType } from '@/types/claim'

export const CLAIM_AMOUNTS = {
  delay: { amount: '400 €', numeric: 400, badge: 'Opóźniony' },
  cancel: { amount: '600 €', numeric: 600, badge: 'Odwołany' },
  denied: { amount: '600 €', numeric: 600, badge: 'Odmowa wejścia' },
  missed: { amount: '250 €', numeric: 250, badge: 'Nieudana przesiadka' },
} as const satisfies Record<DisruptionType, { amount: string; numeric: number; badge: string }>

export const TICKER_ITEMS = [
  'Bez opłat z góry',
  'Adwokaci i radcowie prawni',
  'EC 261/2004',
  '87% wygranych spraw',
  'Postępowanie sądowe wliczone',
  'Loty z ostatnich 3 lat',
  '18 krajów UE',
  '4200 wygranych spraw',
] as const

export const STATS = [
  { value: '2,8', suffix: ' mln zł', label: 'wypłacone klientom oweme', note: 'łącznie do 31.12.2024' },
  { value: '4200', suffix: '+', label: 'wygranych spraw', note: 'łącznie do 31.12.2024' },
  { value: '87', suffix: '%', label: 'skuteczność roszczeń', note: 'sprawy zakończone sukcesem' },
  { value: '600', suffix: ' €', label: 'maksymalne odszkodowanie', note: 'na mocy EC 261/2004' },
] as const

export const SERVICES = [
  { icon: 'clock', title: 'Opóźnienie lotu 3h+' },
  { icon: 'x-circle', title: 'Odwołanie lotu' },
  { icon: 'person-minus', title: 'Odmowa wejścia na pokład' },
  { icon: 'rotate', title: 'Spóźniony przesiadkowy' },
  { icon: 'card', title: 'Weryfikacja karty pokładowej' },
  { icon: 'shield', title: 'Reprezentacja sądowa' },
] as const

export const HOW_STEPS = [
  {
    num: '01',
    title: 'Wypełniasz wniosek',
    desc: 'Podajesz numer lotu lub przesyłasz kartę pokładową. Natychmiast weryfikujemy, czy roszczenie jest zasadne i szacujemy kwotę odszkodowania. Zajmuje to kilka minut.',
  },
  {
    num: '02',
    title: 'Prawnicy przejmują sprawę',
    desc: 'Adwokaci i radcowie prawni oweme wysyłają wezwanie do zapłaty, negocjują z linią i — jeśli ta nadal odmawia — składają pozew lub wniosek do Urzędu Lotnictwa Cywilnego. Wszystkie koszty bierzemy na siebie.',
  },
  {
    num: '03',
    title: 'Pieniądze trafiają na Twoje konto',
    desc: 'Po wyegzekwowaniu odszkodowania przelewamy Ci należną kwotę. Nasza prowizja — 25% od wygranej — pobierana jest wyłącznie wtedy, gdy sprawa zakończy się sukcesem.',
  },
] as const

export const CREDENTIALS = [
  {
    title: 'Wpis do samorządów zawodowych',
    sub: 'Wszyscy prawnicy oweme działają na podstawie wpisu do ORA lub OIRP',
    icon: 'check-circle',
  },
  {
    title: 'Ponad 12 lat praktyki w prawie lotniczym',
    sub: 'Specjalizacja w EC 261/2004 i Konwencji Montrealskiej — nie obsługujemy innych dziedzin prawa',
    icon: 'briefcase',
  },
  {
    title: 'Reprezentacja przed sądami i ULC',
    sub: 'Jeśli linia odmawia, prowadzimy postępowanie sądowe lub administracyjne bez dodatkowych kosztów',
    icon: 'shield',
  },
  {
    title: 'Sieć partnerów w 18 krajach UE',
    sub: 'Sprawy dotyczące lotów w całej UE i Wielkiej Brytanii',
    icon: 'globe',
  },
] as const

export const NO_RISK_ITEMS = [
  'Analiza sprawy bezpłatna',
  'Korespondencja z linią po naszej stronie',
  'Koszty sądowe pokrywamy my',
  '25% prowizji — tylko od odzyskanej kwoty',
] as const

export const RATE_ROWS = [
  { label: 'Polubownie z linią', value: 64, tone: 'sage' },
  { label: 'Urząd Lotnictwa Cywilnego', value: 18, tone: 'ember' },
  { label: 'Sąd cywilny', value: 5, tone: 'emberLow' },
] as const

export const TEAM = [
  {
    initials: 'MK',
    name: 'Michał Kowalski',
    role: 'Adwokat · Partner zarządzający',
    bio: '12 lat w prawie lotniczym i konsumenckim. Absolwent WPiA UW. Reprezentował klientów przed sądami w Polsce, Niemczech i Wielkiej Brytanii. Przed oweme — radca prawny w kancelarii obsługującej przewoźników lotniczych.',
    tags: ['EC 261/2004', 'Postępowania sądowe', 'Prawo lotnicze UE'],
  },
  {
    initials: 'AN',
    name: 'Anna Nowak',
    role: 'Radca prawny · Partner',
    bio: '9 lat w ochronie praw pasażerów i prawie konsumenckim. Ukończyła WPiA UJ. Prowadzi sprawy przed ULC i sądami administracyjnymi. Specjalizuje się w przypadkach, w których linie powołują się na siłę wyższą.',
    tags: ['Prawo konsumenckie', 'ULC', 'Konw. Montrealska'],
  },
  {
    initials: 'PW',
    name: 'Piotr Wiśniewski',
    role: 'Radca prawny · Litigacja',
    bio: 'Ponad 340 spraw sądowych z przewoźnikami — 91% zakończonych wygraną. Absolwent WPiA UAM, wcześniej asystent sędziego w Sądzie Okręgowym w Warszawie. Jego specjalnością są sprawy, które inni uważają za beznadziejne.',
    tags: ['Litigacja', '340+ spraw sądowych', '91% wygranych'],
  },
] as const

export const AWARDS = [
  {
    icon: 'medal',
    title: 'Laur Klienta 2024',
    desc: 'oweme zostało nagrodzone w ogólnopolskim konkursie Laur Klienta 2024 w kategorii: Innowacyjne Usługi Prawne. Certyfikat nr OK 24/08.',
  },
  {
    icon: 'shield',
    title: 'Rzetelna Kancelaria',
    desc: 'oweme dołączyło do prestiżowego grona firm. Przeszliśmy pomyślną weryfikację w 50 źródłach danych i otrzymaliśmy Certyfikat Rzetelności Prawniczej.',
  },
  {
    icon: 'star',
    title: 'Laur Wiarygodności',
    desc: 'Certyfikat potwierdza wiarygodność biznesową oweme oraz wysokie standardy pracy z Klientami.',
  },
] as const

export const MEDIA_QUOTES = [
  {
    source: 'Rzeczpospolita',
    quote:
      'Linie lotnicze odmawiają wypłaty odszkodowań powołując się na siłę wyższą — często bezpodstawnie. Eksperci oweme wyjaśniają, kiedy pasażer ma prawo walczyć.',
  },
  {
    source: 'Gazeta Wyborcza',
    quote:
      'EC 261/2004 to jedno z najsilniejszych narzędzi ochrony konsumentów w Europie — a mimo to zdecydowana większość pasażerów w Polsce nigdy nie skorzystała ze swoich praw.',
  },
  {
    source: 'Business Insider Polska',
    quote:
      'Kancelarie takie jak oweme zmieniają reguły gry. Pasażerowie nie muszą już sami walczyć z przewoźnikami — prawnicy robią to za nich, bez kosztów z góry.',
  },
] as const

export const RATING_BADGES = [
  { source: 'Google', score: '4,9', count: '1 284 opinie' },
  { source: 'Facebook', score: '4,8', count: '892 opinie' },
] as const

export const REVIEWS = [
  {
    amount: '+600 €',
    text: 'Ryanair powołał się na siłę wyższą. oweme zakwestionowało tę kwalifikację prawnie — po 6 tygodniach dostałam <strong>600 euro</strong>. Nie zamieniłam ani słowa z linią lotniczą.',
    initials: 'AK',
    name: 'Anna K.',
    meta: 'WAW — LHR · Ryanair · 2024',
  },
  {
    amount: '+400 €',
    text: 'LOT twierdził, że odwołanie to okoliczność nadzwyczajna. Prawnicy oweme udowodnili, że się mylił. <strong>400 € na koncie</strong> po 8 tygodniach — bez żadnych kosztów z mojej strony.',
    initials: 'MP',
    name: 'Marek P.',
    meta: 'KRK — DXB · LOT · 2024',
  },
  {
    amount: '+600 €',
    text: 'Wizz Air odmówił. Sprawa trafiła do sądu. Myślałem, że to koniec. oweme wygrało w pierwszej instancji — dostałem <strong>pełne 600 €</strong> i zwrot kosztów postępowania.',
    initials: 'RJ',
    name: 'Robert J.',
    meta: 'WAW — CDG · Wizz Air · 2023',
  },
] as const

export const FAQ_ITEMS = [
  {
    q: 'Ile kosztuje złożenie wniosku?',
    a: 'Nic. Złożenie wniosku, weryfikacja i prowadzenie sprawy są bezpłatne do momentu wypłaty odszkodowania. Pobieramy prowizję 25% wyłącznie od kwoty, którą uda nam się wyegzekwować. Koszty ewentualnego postępowania sądowego pokrywamy my.',
  },
  {
    q: 'Za jak stary lot mogę złożyć wniosek?',
    a: 'Roszczenia z tytułu EC 261/2004 przedawniają się po 3 latach od daty lotu. Warto sprawdzić nie tylko ostatni lot — nieodebrane odszkodowania sprzed 2-3 lat to często kilkaset euro.',
  },
  {
    q: 'Jakie loty obejmuje ochrona?',
    a: 'Rozporządzenie EC 261/2004 chroni pasażerów na wszystkich lotach z lotnisk UE oraz na lotach do UE realizowanych przez europejskich przewoźników. Obejmuje opóźnienia powyżej 3 godzin, odwołania do 14 dni przed odlotem i odmowę wejścia na pokład.',
  },
  {
    q: 'Linia powołała się na siłę wyższą — czy to koniec?',
    a: 'Nie. Linie nagminnie powołują się na nadzwyczajne okoliczności — często bezpodstawnie. Awaria techniczna, strajk własnych pracowników czy problemy z rozkładem lotów nie zwalniają przewoźnika. Nasi prawnicy każdorazowo weryfikują, czy ta kwalifikacja jest prawnie uzasadniona.',
  },
  {
    q: 'Ile trwa postępowanie?',
    a: 'Sprawy rozstrzygane polubownie zamykają się zazwyczaj w 4-8 tygodniach. Jeśli sprawa trafia do sądu lub ULC, czas wydłuża się do kilku miesięcy — przez cały ten czas nie musisz nic robić.',
  },
  {
    q: 'Co jeśli linia odmówi wypłaty?',
    a: 'Odmowa linii to dla nas sygnał do działania, nie powód do rezygnacji. Kierujemy sprawę do Urzędu Lotnictwa Cywilnego lub sądu cywilnego. Koszty postępowania pokrywamy w całości. Ostatecznie wygrywamy 87% prowadzonych przez nas spraw.',
  },
  {
    q: 'Czy lot z biura podróży się kwalifikuje?',
    a: 'Tak. EC 261/2004 chroni pasażera — niezależnie od tego, gdzie i jak kupił bilet. Loty z pakietów turystycznych, przez agentów i biura podróży podlegają tym samym zasadom.',
  },
  {
    q: 'Nie mam karty pokładowej — co wtedy?',
    a: 'Dokumenty są pomocne, ale nie zawsze niezbędne. Dane o locie i zakłóceniach weryfikujemy w naszych bazach danych. Jeśli Twój lot był na liście — przeprowadzimy weryfikację bez dokumentów.',
  },
] as const

export const SLIDER_DATA = [
  {
    value: '250 €',
    title: 'Np. Warszawa — Berlin, Kraków — Amsterdam',
    sub: 'Trasy do 1500 km — krajowe i krótkie europejskie',
  },
  {
    value: '400 €',
    title: 'Np. Warszawa — Londyn, Kraków — Dubaj',
    sub: 'Trasy 1500-3500 km — europejskie i kontynentalne',
  },
  {
    value: '600 €',
    title: 'Np. Warszawa — Nowy Jork, Kraków — Bangkok',
    sub: 'Trasy powyżej 3500 km — loty długodystansowe',
  },
] as const

export const DISRUPTION_LIST = [
  {
    icon: 'clock',
    title: 'Opóźnienie lotu',
    desc: 'Przylot co najmniej 3 godziny po planowanym czasie',
  },
  {
    icon: 'x-circle',
    title: 'Odwołanie lotu',
    desc: 'Linia odwołała Twój lot bez odpowiedniego wyprzedzenia',
  },
  {
    icon: 'user-x',
    title: 'Odmowa wejścia na pokład',
    desc: 'Nie wpuszczono Cię na pokład z powodu overbookingu',
  },
  {
    icon: 'shuffle',
    title: 'Nieudana przesiadka',
    desc: 'Spóźniłeś się na połączenie z winy linii lotniczej',
  },
] as const

export const AMOUNTS: Record<DisruptionType, string> = {
  delay: CLAIM_AMOUNTS.delay.amount,
  cancel: CLAIM_AMOUNTS.cancel.amount,
  denied: CLAIM_AMOUNTS.denied.amount,
  missed: CLAIM_AMOUNTS.missed.amount,
}

export const BADGES: Record<DisruptionType, string> = {
  delay: CLAIM_AMOUNTS.delay.badge,
  cancel: CLAIM_AMOUNTS.cancel.badge,
  denied: CLAIM_AMOUNTS.denied.badge,
  missed: CLAIM_AMOUNTS.missed.badge,
}
