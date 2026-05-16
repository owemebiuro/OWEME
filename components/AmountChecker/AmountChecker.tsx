"use client";

import { Inter } from "next/font/google";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

import { AirportField } from "./AirportField";
import { DisruptionCard } from "./DisruptionCard";
import { DistanceSlider } from "./DistanceSlider";
import {
  computeHint,
  getDistance,
  kmToSlider,
  tierFromSlider,
} from "./airportData";
import styles from "./AmountChecker.module.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--amount-inter",
  display: "swap",
});

type DisruptionId = "delay" | "cancel" | "denied" | "missed";

type Disruption = {
  id: DisruptionId;
  name: string;
  desc: string;
  badge: string;
  icon: React.ReactNode;
};

function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function XCircleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="m9 9 6 6M15 9l-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function UserMinusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="2" />
      <path d="M3.5 19c.7-3 2.7-5 5.5-5 1.6 0 2.9.5 3.9 1.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 11h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ArrowsRotateIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M16 3h5v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 3 14 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 21H3v-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m3 21 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="m13 6 6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ConnectorIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="m13 6 6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M12 11v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 8h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

const DISRUPTIONS: readonly Disruption[] = [
  {
    id: "delay",
    name: "Opóźnienie lotu",
    desc: "Przylot co najmniej 3 godziny po planowanym czasie",
    badge: "do 600 €",
    icon: <ClockIcon />,
  },
  {
    id: "cancel",
    name: "Odwołanie lotu",
    desc: "Linia odwołała Twój lot bez odpowiedniego wyprzedzenia",
    badge: "do 600 €",
    icon: <XCircleIcon />,
  },
  {
    id: "denied",
    name: "Odmowa wejścia na pokład",
    desc: "Nie wpuszczono Cię na pokład z powodu overbookingu",
    badge: "do 600 €",
    icon: <UserMinusIcon />,
  },
  {
    id: "missed",
    name: "Nieudana przesiadka",
    desc: "Spóźniłeś się na połączenie z winy linii lotniczej",
    badge: "do 250 €",
    icon: <ArrowsRotateIcon />,
  },
];

type CalloutTone = "blue" | "green" | "red" | "amber";

type CompactDetail = {
  title: string;
  lead: string;
  sections: {
    title: string;
    text: string;
    tag: string;
  }[];
  callout: {
    tone: CalloutTone;
    label: string;
    text: string;
  };
};

const COMPACT_DETAILS: Record<Exclude<DisruptionId, "delay">, CompactDetail> = {
  cancel: {
    title: "Odwołanie lotu: kiedy linia odpowiada finansowo?",
    lead:
      "Odwołanie lotu może dawać prawo do takiej samej kwoty jak opóźnienie: 250, 400 albo 600 € na osobę. Kluczowe jest to, kiedy linia poinformowała Cię o zmianie i czy zaproponowała realną alternatywę.",
    sections: [
      {
        title: "Mniej niż 14 dni przed wylotem",
        text:
          "Jeśli informacja o odwołaniu przyszła późno, sprawdź prawo do odszkodowania. Linia nie może po prostu oddać ceny biletu i zamknąć tematu.",
        tag: "termin ma znaczenie",
      },
      {
        title: "Lot zastępczy też się liczy",
        text:
          "Gdy zaproponowany lot zastępczy znacząco zmienia godzinę wylotu albo przylotu, nadal możesz mieć roszczenie. Zapisz wszystkie wiadomości od przewoźnika.",
        tag: "zachowaj maile",
      },
      {
        title: "Zwrot biletu to osobne prawo",
        text:
          "Zwrot pieniędzy za niewykorzystany bilet nie zawsze wyklucza odszkodowanie. To dwa różne świadczenia, które trzeba ocenić osobno.",
        tag: "nie rezygnuj pochopnie",
      },
    ],
    callout: {
      tone: "blue",
      label: "ważne przy odwołaniu",
      text:
        "Najczęstszy błąd pasażerów to uznanie, że przyjęcie zwrotu biletu kończy sprawę. W wielu przypadkach nadal można dochodzić dodatkowego odszkodowania.",
    },
  },
  denied: {
    title: "Odmowa wejścia na pokład i overbooking",
    lead:
      "Jeśli masz ważną rezerwację, stawiłeś się na czas, a mimo to nie wpuszczono Cię na pokład, linia może odpowiadać za odmowę przyjęcia do lotu. Overbooking jest ryzykiem przewoźnika, nie pasażera.",
    sections: [
      {
        title: "Nie zgadzaj się bez wyjaśnień",
        text:
          "Poproś o pisemną informację, dlaczego odmówiono Ci wejścia na pokład. Samo hasło „brak miejsc” jest dla nas ważnym dowodem.",
        tag: "pisemny powód",
      },
      {
        title: "Voucher nie zawsze się opłaca",
        text:
          "Linie często proponują bony lub lot później. Zanim coś podpiszesz, sprawdź, czy dokument nie odbiera Ci prawa do gotówki.",
        tag: "uważaj na podpis",
      },
      {
        title: "Masz prawo do opieki",
        text:
          "Czekając na alternatywny lot, możesz żądać posiłków, napojów, kontaktu z bliskimi, a przy nocnym oczekiwaniu także hotelu i transferu.",
        tag: "opieka od razu",
      },
    ],
    callout: {
      tone: "green",
      label: "overbooking to nie Twoja wina",
      text:
        "Jeśli linia sprzedała więcej biletów niż ma miejsc, zwykle nie może przerzucić konsekwencji na pasażera. Warto zebrać dokumenty od razu przy bramce.",
    },
  },
  missed: {
    title: "Nieudana przesiadka z winy linii",
    lead:
      "Przesiadka może kwalifikować się do odszkodowania, jeśli cała podróż była na jednej rezerwacji, a opóźnienie pierwszego odcinka spowodowało spóźnienie na kolejny lot.",
    sections: [
      {
        title: "Liczy się opóźnienie na końcu podróży",
        text:
          "Najważniejsza jest godzina dotarcia do ostatniego lotniska z rezerwacji. Jeśli do celu dotarłeś co najmniej 3 godziny później, sprawa jest warta analizy.",
        tag: "cel końcowy",
      },
      {
        title: "Jedna rezerwacja wzmacnia sprawę",
        text:
          "Zachowaj numer rezerwacji, bilety i karty pokładowe dla wszystkich odcinków. To pozwala połączyć opóźnienie z utraconą przesiadką.",
        tag: "pełna trasa",
      },
      {
        title: "Nie bierz winy na siebie",
        text:
          "Jeśli linia twierdzi, że „mogłeś zdążyć”, zapisz rzeczywiste godziny lądowania, otwarcia drzwi i boardingu następnego lotu.",
        tag: "dowody czasu",
      },
    ],
    callout: {
      tone: "blue",
      label: "przesiadki są do wygrania",
      text:
        "W sprawach przesiadkowych linie często odmawiają automatycznie. Dopiero analiza całej rezerwacji pokazuje, czy odpowiedzialność rzeczywiście leży po stronie przewoźnika.",
    },
  },
};

function DetailCallout({
  tone = "blue",
  label,
  children,
}: {
  tone?: CalloutTone;
  label: string;
  children: ReactNode;
}) {
  return (
    <aside className={`${styles.detailCallout} ${styles[`callout${tone}`]}`}>
      <div className={styles.calloutLabel}>
        <span aria-hidden="true" />
        {label}
      </div>
      <div className={styles.calloutText}>{children}</div>
    </aside>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className={styles.detailSection}>
      <h4 className={styles.detailH4}>{title}</h4>
      <div className={styles.detailProse}>{children}</div>
    </section>
  );
}

const supportRows = [
  {
    marker: "2h+",
    title: "Posiłek i napoje",
    text:
      "Już po 2 godzinach opóźnienia linia musi zapewnić Ci voucher na jedzenie i picie proporcjonalnie do czasu oczekiwania. Jeśli odmówią - zapisz to lub zrób zdjęcie odmowy.",
  },
  {
    marker: "5h+",
    title: "Zwrot biletu lub lot alternatywny",
    text:
      "Gdy opóźnienie przekracza 5 godzin, masz wybór: albo rezygnujesz z lotu i dostajesz pełny zwrot ceny biletu, albo żądasz zmiany trasy na inny dostępny lot do celu. Decyzja należy wyłącznie do Ciebie.",
  },
  {
    marker: "noc",
    title: "Nocleg i transfer",
    text:
      "Jeśli przez opóźnienie zostajesz na noc, linia musi opłacić hotel oraz zapewnić transport z lotniska i z powrotem. Nie czekaj, aż sami zaproponują. Zapytaj wprost.",
  },
  {
    marker: "tel",
    title: "Dwa darmowe połączenia",
    text:
      "Przez cały czas oczekiwania masz prawo do bezpłatnego kontaktu - dwa telefony lub maile. Wiele linii o tym nie informuje. Warto wiedzieć i przypomnieć im o tym obowiązku.",
  },
] as const;

const airportSteps = [
  {
    marker: "1",
    title: "Zachowaj wszystkie dokumenty",
    text:
      "Bilet, karta pokładowa, potwierdzenie rezerwacji - nie wyrzucaj niczego. Jeśli masz e-bilet, zrób zrzut ekranu lub wydrukuj. To Twój fundament, bez tych dokumentów roszczenie jest dużo trudniejsze.",
    tag: "kluczowe",
    tone: "green",
  },
  {
    marker: "2",
    title: "Zrób zdjęcie tablicy odlotów",
    text:
      "Prosta fotografia tablicy z widocznym statusem Twojego lotu i bieżącą godziną to jeden z najskuteczniejszych dowodów. Metadane zdjęcia potwierdzą czas i miejsce wykonania, tego nie da się podrobić.",
    tag: "kluczowe",
    tone: "green",
  },
  {
    marker: "3",
    title: "Poproś o pisemne potwierdzenie od linii",
    text:
      "Zażądaj od personelu przy bramce lub stanowiska obsługi pisemnego potwierdzenia opóźnienia oraz jego przyczyny. Wiele osób o tym nie wie, a to często klucz do całej sprawy.",
    tag: "zalecane",
    tone: "blue",
  },
  {
    marker: "4",
    title: "Zapisz rzeczywistą godzinę lądowania",
    text:
      "Odszkodowanie należy się, gdy dolecisz z opóźnieniem co najmniej 3 godzin. Zapisz godzinę otwarcia drzwi samolotu lub pierwsze połączenie z Wi-Fi po lądowaniu, to Twój faktyczny czas przylotu.",
    tag: "zalecane",
    tone: "blue",
  },
  {
    marker: "5",
    title: "Nie podpisuj niczego bez czytania",
    text:
      "Linie czasem proponują vouchery na przyszłe loty w zamian za podpisanie zrzeczenia się roszczeń. Nie podpisuj nic na gorąco. Voucher o wartości 50 € może kosztować Cię prawo do 400 € gotówki.",
    tag: "uwaga - pułapka",
    tone: "amber",
  },
] as const;

const extraordinaryItems = [
  {
    title: "Ekstremalne warunki pogodowe",
    text:
      "Gwałtowna burza, zamieć, mgła całkowicie uziemiająca samoloty. Zwykły deszcz i wiatr nie wystarczą. Linia musi udowodnić, że pogoda rzeczywiście uniemożliwiła bezpieczny lot.",
  },
  {
    title: "Zamknięcie przestrzeni powietrznej",
    text:
      "Decyzje służb lotniczych, erupcje wulkanów (jak Eyjafjallajökull w 2010 r.), ograniczenia wojskowe lub polityczne niemożliwe do przewidzenia w momencie planowania lotu.",
  },
  {
    title: "Strajk na lotnisku",
    text:
      "Strajk służb lotniskowych czy kontroli ruchu lotniczego może być okolicznością zwalniającą. Jednak strajk własnych pilotów lub stewardów linii już nie. To wewnętrzna sprawa przewoźnika.",
  },
] as const;

const cancellationTimeline = [
  {
    marker: "14+",
    sub: "dni przed",
    tone: "green",
    title: "Powiadomienie z ponad 2-tygodniowym wyprzedzeniem",
    text:
      "Linia poinformowała Cię na czas. Odszkodowanie pieniężne Ci nie przysługuje - ale nadal możesz żądać zwrotu ceny biletu lub lotu alternatywnego.",
    status: "Brak odszkodowania",
  },
  {
    marker: "7-13",
    sub: "dni przed",
    tone: "amber",
    title: "Powiadomienie 7-13 dni wcześniej",
    text:
      "Odszkodowanie przysługuje częściowo - tylko jeśli linia nie zaproponowała alternatywnego lotu w rozsądnych godzinach. Każdy przypadek wymaga indywidualnej oceny.",
    status: "Zależy od okoliczności",
  },
  {
    marker: "<7",
    sub: "dni przed",
    tone: "red",
    title: "Powiadomienie poniżej tygodnia przed lotem",
    text:
      "Pełne odszkodowanie pieniężne. Linia miała za mało czasu na organizację alternatywy spełniającej wymogi rozporządzenia.",
    status: "Pełne odszkodowanie",
  },
  {
    marker: "w dniu",
    sub: "lub na lotnisku",
    tone: "red",
    title: "Odwołanie w dniu lotu lub na lotnisku",
    text:
      "Najsilniejsza podstawa roszczenia. Przysługuje Ci pełne odszkodowanie, natychmiastowa opieka na lotnisku oraz wybór między zwrotem biletu a lotem zastępczym.",
    status: "Pełne odszkodowanie + opieka",
  },
] as const;

const cancellationCareRows = [
  {
    marker: "!",
    title: "Posiłek i napoje",
    text:
      "Od chwili poinformowania o odwołaniu na lotnisku linia musi zapewnić Ci voucher na jedzenie i napoje proporcjonalnie do czasu oczekiwania. Idź do stanowiska obsługi i zażądaj tego wprost.",
    tag: "prawo natychmiastowe",
    tone: "blue",
  },
  {
    marker: "2",
    title: "Nocleg i transfer - jeśli konieczny",
    text:
      "Gdy lot zastępczy jest dostępny dopiero następnego dnia, linia musi opłacić Ci hotel oraz zapewnić transport z lotniska i z powrotem. Dotyczy to również sytuacji, gdy wróciłeś już do domu i musiałeś wyjechać ponownie.",
    tag: "obowiązek linii",
    tone: "blue",
  },
  {
    marker: "3",
    title: "Dwa bezpłatne połączenia",
    text:
      "Przez cały czas oczekiwania masz prawo do bezpłatnego kontaktu - dwa telefony lub wiadomości. Linia powinna Ci to umożliwić na miejscu. Wiele osób o tym nie wie i traci tę możliwość.",
    tag: "często pomijane",
    tone: "amber",
  },
] as const;

const cancellationAirportSteps = [
  {
    marker: "1",
    title: "Zachowaj wszystkie dokumenty",
    text:
      "Bilet, karta pokładowa, potwierdzenie rezerwacji, maile od linii - nie wyrzucaj niczego. Zrób zrzuty ekranu potwierdzeń w aplikacji. Bez dokumentów roszczenie jest dużo trudniejsze do udowodnienia.",
    tag: "kluczowe",
    tone: "green",
  },
  {
    marker: "2",
    title: "Sprawdź godzinę i sposób powiadomienia",
    text:
      "Zanotuj dokładnie, kiedy dowiedziałeś się o odwołaniu - i w jaki sposób: SMS, e-mail, ogłoszenie na lotnisku, komunikat w aplikacji. To kluczowa informacja przy ustalaniu prawa do odszkodowania.",
    tag: "kluczowe",
    tone: "green",
  },
  {
    marker: "3",
    title: "Zrób zdjęcie tablicy odlotów",
    text:
      "Fotografia tablicy z widocznym statusem \"Odwołany\" i bieżącą godziną to mocny dowód. Metadane zdjęcia potwierdzą czas i miejsce jego wykonania - tego nie da się podważyć.",
    tag: "zalecane",
    tone: "blue",
  },
  {
    marker: "4",
    title: "Poproś o pisemne potwierdzenie od linii",
    text:
      "Zażądaj od personelu pisemnego potwierdzenia odwołania oraz jego podanej przyczyny. To niezwykle ważne - linie często podają inne przyczyny na piśmie niż te, które ogłaszają przez megafon.",
    tag: "zalecane",
    tone: "blue",
  },
  {
    marker: "5",
    title: "Nie podpisuj zrzeczeń pod presją",
    text:
      "Jeśli linia proponuje voucher lub inną rekompensatę w zamian za podpisanie dokumentu - nie rób tego bez dokładnego przeczytania. Możesz nieświadomie zrzec się prawa do odszkodowania wartego kilkaset euro.",
    tag: "uwaga - pułapka",
    tone: "amber",
  },
] as const;

const cancellationExceptionItems = [
  {
    title: "Ekstremalne warunki atmosferyczne",
    text:
      "Gwałtowne burze, zamieć, gęsta mgła uniemożliwiająca bezpieczne lądowanie lub start. Linia musi jednak wykazać bezpośredni związek między pogodą a odwołaniem konkretnego lotu.",
  },
  {
    title: "Zamknięcie przestrzeni powietrznej",
    text:
      "Decyzje służb kontroli ruchu lotniczego, ograniczenia wojskowe, erupcje wulkanów. Klasyczny przykład: chaos po erupcji Eyjafjallajökull w 2010 roku, który uziemił tysiące samolotów.",
  },
  {
    title: "Strajk - tylko nie własny",
    text:
      "Strajk służb lotniskowych lub kontrolerów lotów może zwolnić linię z odpowiedzialności. Natomiast strajk własnych pilotów, stewardów lub pracowników naziemnych przewoźnika - już nie. To wewnętrzna sprawa firmy.",
  },
  {
    title: "Awaria techniczna - tu uważaj",
    text:
      "Linie często powołują się na \"awarię techniczną\" jako nadzwyczajną okoliczność. W większości przypadków to błąd - regularna awaria samolotu to problem eksploatacyjny przewoźnika, a nie siła wyższa. Ten argument wielokrotnie odpada w sądzie.",
  },
] as const;

const cancellationChoiceOptions = [
  {
    tag: "Opcja A",
    title: "Pełny zwrot ceny biletu",
    text:
      "Jeśli nie chcesz lecieć innym terminem lub inną trasą - masz prawo do zwrotu pełnej ceny biletu w ciągu 7 dni. Dotyczy całego biletu, łącznie z odcinkami, z których już skorzystałeś.",
    points: [
      "Pełna kwota zakupu biletu",
      "Wypłata w ciągu 7 dni roboczych",
      "Możliwość powrotu do lotniska odlotu na koszt linii",
    ],
  },
  {
    tag: "Opcja B",
    title: "Lot alternatywny do celu",
    text:
      "Jeśli chcesz dotrzeć do miejsca docelowego - masz prawo do bezpłatnego lotu zastępczego w możliwie najbliższym terminie lub w terminie, który Ci odpowiada.",
    points: [
      "Lot w najbliższym możliwym terminie",
      "Lub w późniejszym terminie - według Twojego wyboru",
      "W porównywalnych warunkach podróży",
    ],
  },
] as const;

const deniedInsightCards = [
  {
    tone: "danger",
    label: "Problem",
    title: "Linia sprzedała 186 biletów na 180 miejsc",
    text:
      "Wszyscy pasażerowie przyszli. Linia musi kogoś zostawić - i szuka ochotników. Jeśli nikt się nie zgłosi dobrowolnie, wybiera przymusowo. Ty możesz trafić na tę listę mimo że zrobiłeś wszystko prawidłowo.",
  },
  {
    tone: "success",
    label: "Twoja pozycja",
    title: "Masz ważny bilet i jesteś na czas - masz rację po swojej stronie",
    text:
      "Rozporządzenie WE 261/2004 wyraźnie stoi po Twojej stronie. Odmowa wejścia na pokład bez Twojej zgody rodzi natychmiastowe i konkretne zobowiązania finansowe linii wobec Ciebie.",
  },
] as const;

const deniedEligibilityItems = [
  {
    marker: "bilet",
    title: "Masz potwierdzoną rezerwację",
    text:
      "Bilet zakupiony komercyjnie z numerem potwierdzenia. Bilety zdobyte nieodpłatnie lub w konkursach mogą nie być objęte ochroną.",
  },
  {
    marker: "czas",
    title: "Stawiłeś się na czas",
    text:
      "Byłeś przy bramce co najmniej 45 minut przed planowanym odlotem, chyba że linia podała inny czas odprawy.",
  },
  {
    marker: "ID",
    title: "Masz wszystkie wymagane dokumenty",
    text:
      "Ważny dokument tożsamości, karta pokładowa lub prawidłowa odprawa - wszystko w porządku po Twojej stronie.",
  },
  {
    marker: "nie",
    title: "Odmowa nastąpiła bez Twojej zgody",
    text:
      "Nie wyraziłeś dobrowolnie zgody na odstąpienie miejsca. Linia podjęła decyzję jednostronnie, wbrew Twojej woli.",
  },
] as const;

const deniedComparisonRows = [
  {
    criterion: "Inicjatywa",
    voluntary: { text: "Twoja - sam się zgłaszasz" },
    involuntary: { text: "Linii - decyduje bez pytania" },
  },
  {
    criterion: "Odszkodowanie pieniężne",
    voluntary: { tag: "Negocjowane z linią", tone: "amber" },
    involuntary: { tag: "Ustawowe 250-600 €", tone: "green" },
  },
  {
    criterion: "Możliwość obniżki kwoty",
    voluntary: { text: "Tak - linia negocjuje warunki" },
    involuntary: { text: "Nie - pełna kwota bezwarunkowo" },
  },
  {
    criterion: "Prawo do opieki",
    voluntary: { text: "Tak - posiłki, nocleg, transfer" },
    involuntary: { text: "Tak - natychmiastowo i w pełnym zakresie" },
  },
  {
    criterion: "Lot zastępczy lub zwrot",
    voluntary: { text: "Tak - do wyboru" },
    involuntary: { text: "Tak - do wyboru, niezwłocznie" },
  },
  {
    criterion: "Twoja siła negocjacyjna",
    voluntary: { tag: "Zależy od sytuacji", tone: "amber" },
    involuntary: { tag: "Bardzo wysoka - prawo po Twojej stronie", tone: "green" },
  },
] as const;

const deniedCareRows = [
  {
    marker: "!",
    title: "Posiłek i napoje",
    text:
      "Od chwili odmowy linia musi zapewnić Ci voucher na jedzenie i picie. Nie czekaj - idź do stanowiska obsługi i zażądaj tego natychmiast, powołując się na art. 9 rozporządzenia WE 261/2004.",
    tag: "prawo natychmiastowe",
    tone: "blue",
  },
  {
    marker: "2",
    title: "Nocleg i transfer - jeśli konieczny",
    text:
      "Gdy lot zastępczy jest dostępny dopiero następnego dnia, linia pokrywa koszt hotelu i zapewnia transport z lotniska i z powrotem. Nie przyjmuj \"mamy już pełne hotele\" bez pisemnego potwierdzenia.",
    tag: "obowiązek linii",
    tone: "blue",
  },
  {
    marker: "3",
    title: "Dwa bezpłatne połączenia",
    text:
      "Masz prawo do bezpłatnego kontaktu - dwa telefony lub wiadomości e-mail. Możesz zadzwonić do rodziny, poinformować hotel, skontaktować się z pracodawcą. Linia powinna Ci to umożliwić.",
    tag: "często pomijane",
    tone: "amber",
  },
] as const;

const deniedChoiceOptions = [
  {
    tag: "Opcja A",
    title: "Lot zastępczy do celu",
    text:
      "Linia ma obowiązek zapewnić Ci miejsce na najbliższym dostępnym locie do miejsca docelowego - w porównywalnych warunkach, bez dodatkowych kosztów z Twojej strony.",
    points: [
      "Najwcześniejszy dostępny lot",
      "Lub późniejszy termin - Twój wybór",
      "Porównywalna klasa i warunki podróży",
      "Pełna opieka do czasu odlotu",
    ],
  },
  {
    tag: "Opcja B",
    title: "Pełny zwrot ceny biletu",
    text:
      "Jeśli decydujesz się zrezygnować z podróży - masz prawo do pełnego zwrotu ceny biletu w ciągu 7 dni. Dotyczy całej trasy, włącznie z odcinkami już wykorzystanymi.",
    points: [
      "Pełna kwota zakupu biletu",
      "Wypłata w ciągu 7 dni roboczych",
      "Zwrot na kartę lub konto - nie voucher",
      "Możliwość powrotu do lotniska wyjazdu",
    ],
  },
] as const;

const deniedAirportSteps = [
  {
    marker: "1",
    title: "Nie zgadzaj się bez wiedzy o konsekwencjach",
    text:
      "Jeśli linia prosi o ochotników, najpierw dowiedz się dokładnie, co oferuje - jaka rekompensata, jaki lot zastępczy, jakie warunki. Podpisanie czegokolwiek może oznaczać dobrowolną rezygnację z ustawowych praw.",
    tag: "uważaj",
    tone: "amber",
  },
  {
    marker: "2",
    title: "Poproś o pisemne potwierdzenie odmowy",
    text:
      "Zażądaj dokumentu potwierdzającego, że odmówiono Ci wejścia na pokład z powodu braku miejsc. Sam komunikat przy bramce jest słaby - pisemny dowód bardzo wzmacnia roszczenie.",
    tag: "kluczowe",
    tone: "green",
  },
  {
    marker: "3",
    title: "Zachowaj wszystkie dokumenty",
    text:
      "Bilet, karta pokładowa, potwierdzenie odprawy, wydruk rezerwacji - absolutnie wszystko. Zrób zdjęcia dokumentów telefonem jako kopię zapasową. To fundament każdego późniejszego roszczenia.",
    tag: "kluczowe",
    tone: "green",
  },
  {
    marker: "4",
    title: "Zrób zdjęcia przy bramce",
    text:
      "Sfotografuj tablicę informacyjną z numerem lotu, stanowisko obsługi linii, tablicę odlotów. Metadane zdjęcia potwierdzą czas i miejsce - to niepodważalny dowód Twojej obecności na miejscu.",
    tag: "zalecane",
    tone: "blue",
  },
  {
    marker: "5",
    title: "Zanotuj imię i nazwisko pracownika",
    text:
      "Pracownik, który odmówił Ci wejścia, powinien się przedstawić. Zanotuj jego dane lub zrób zdjęcie identyfikatora - to szczegół, który może mieć znaczenie, jeśli sprawa trafi do sądu.",
    tag: "zalecane",
    tone: "blue",
  },
  {
    marker: "6",
    title: "Nie podpisuj zrzeczeń pod presją",
    text:
      "Wszelkie dokumenty proponowane przez linię przy stanowisku obsługi czytaj uważnie. Frazy takie jak \"akceptacja rekompensaty\" lub \"porozumienie stron\" mogą oznaczać zrzeczenie się prawa do dalszego odszkodowania.",
    tag: "uwaga - pułapka",
    tone: "red",
  },
] as const;

const deniedExceptionItems = [
  {
    title: "Względy bezpieczeństwa lub operacyjne uzasadnione prawem",
    text:
      "Jeśli kapitan lub służby lotniskowe uznały, że Twoja obecność na pokładzie stanowi zagrożenie bezpieczeństwa. To wyjątek rzadki i wymagający udokumentowania - nie może być użyty jako pretekst do ukrycia overbookingu.",
  },
  {
    title: "Braki w dokumentacji podróżnej",
    text:
      "Brak ważnego dokumentu tożsamości, brak wymaganej wizy lub inne formalne braki leżące po Twojej stronie. Jeśli jednak wszystkie dokumenty miałeś w porządku - ten wyjątek nie ma zastosowania.",
  },
  {
    title: "Dobrowolna zgoda na późniejszy lot",
    text:
      "Jeśli dobrowolnie zgodziłeś się ustąpić miejsca w zamian za uzgodnioną rekompensatę, nie przysługuje Ci dodatkowe odszkodowanie ustawowe - chyba że linia nie dotrzymała warunków porozumienia.",
  },
] as const;

const missedReservationRows = [
  {
    criterion: "Jak kupione",
    single: { text: "Jeden zakup, jedna trasa, jedna linia lub partner" },
    separate: { text: "Dwie oddzielne transakcje, różne linie lub daty" },
  },
  {
    criterion: "Odpowiedzialność linii",
    single: { tag: "Pełna odpowiedzialność", tone: "green" },
    separate: { tag: "Brak automatycznej odpowiedzialności", tone: "red" },
  },
  {
    criterion: "Prawo do odszkodowania EC 261",
    single: { tag: "Tak - przy opóźnieniu 3h+ na miejscu docelowym", tone: "green" },
    separate: { tag: "Tylko za opóźnienie pierwszego lotu z osobna", tone: "amber" },
  },
  {
    criterion: "Obowiązek zapewnienia połączenia",
    single: { text: "Tak - linia musi przetransportować Cię do celu" },
    separate: { text: "Nie - musisz sam kupić nowy bilet" },
  },
  {
    criterion: "Opieka na lotnisku przesiadkowym",
    single: { text: "Tak - posiłki, nocleg, transfer" },
    separate: { text: "Nie ma automatycznego obowiązku" },
  },
  {
    criterion: "Twoja strategia",
    single: { tag: "Żądaj opieki i złóż roszczenie", tone: "green" },
    separate: { tag: "Sprawdź, czy lot 1 był opóźniony 3h+", tone: "amber" },
  },
] as const;

const missedEligibilityGood = [
  "Masz jedną rezerwację obejmującą obie nogi lotu",
  "Dotarłeś do celu końcowego z opóźnieniem co najmniej 3 godzin",
  "Opóźnienie wynikło z winy linii, nie siły wyższej",
  "Lot startuje z lotniska w UE lub linia jest europejska",
  "Stawiłeś się na czas na odprawę pierwszego lotu",
] as const;

const missedEligibilityBad = [
  "Kupiłeś dwa osobne bilety bez powiązania rezerwacyjnego",
  "Dotarłeś do celu z opóźnieniem poniżej 3 godzin",
  "Opóźnienie wynikło z nadzwyczajnych okoliczności",
  "Spóźniłeś się na odprawę pierwszego lotu z własnej winy",
  "Linia udowodniła, że przesiadka była niemożliwa do uratowania",
] as const;

const missedCareRows = [
  {
    marker: "!",
    title: "Nowe połączenie do celu - bez dodatkowej opłaty",
    text:
      "Jeśli masz jedną rezerwację, linia ma obowiązek wpisać Cię na najbliższy dostępny lot do miejsca docelowego. Dotyczy to również lotów innych przewoźników, jeśli własna linia nie ma miejsca lub połączenia.",
    tag: "prawo absolutne",
    tone: "blue",
    tagTone: "green",
  },
  {
    marker: "2",
    title: "Posiłki i napoje",
    text:
      "Podczas oczekiwania na kolejny lot linia musi zapewnić Ci voucher na jedzenie i picie proporcjonalnie do czasu oczekiwania. Nie czekaj, aż sami zaproponują - zażądaj aktywnie.",
    tag: "prawo natychmiastowe",
    tone: "blue",
  },
  {
    marker: "3",
    title: "Nocleg i transfer - jeśli nocujesz",
    text:
      "Gdy najbliższy dostępny lot jest następnego dnia, linia pokrywa hotel i transport. Nie przyjmuj \"nie mamy wolnych pokoi\" bez pisemnego potwierdzenia - możesz samodzielnie zarezerwować hotel i zażądać zwrotu kosztów.",
    tag: "obowiązek linii",
    tone: "blue",
  },
  {
    marker: "4",
    title: "Zwrot biletu - jeśli rezygnujesz z podróży",
    text:
      "Jeśli opóźnienie jest tak duże, że podróż traci sens - masz prawo zrezygnować i żądać pełnego zwrotu ceny biletu za całą trasę. Decyzja należy wyłącznie do Ciebie.",
    tag: "twój wybór",
    tone: "amber",
  },
] as const;

const missedAirportSteps = [
  {
    marker: "1",
    title: "Natychmiast idź do stanowiska linii - nie do bramki",
    text:
      "Gdy tylko wylądujesz i zobaczysz, że przesiadka jest zagrożona lub niemożliwa, idź bezpośrednio do stanowiska obsługi linii odpowiedzialnej za Twój pierwszy lot. Nie szukaj odpowiedzi przy bramce lotu, który właśnie odleciał.",
    tag: "zrób to najpierw",
    tone: "blue",
    tagTone: "green",
  },
  {
    marker: "2",
    title: "Zachowaj wszystkie dokumenty obu lotów",
    text:
      "Karty pokładowe, potwierdzenia rezerwacji, e-maile z biletami - absolutnie wszystko. Przy nieudanej przesiadce dokumentacja obu lotów jest kluczowa dla udowodnienia związku przyczynowo-skutkowego.",
    tag: "kluczowe",
    tone: "green",
  },
  {
    marker: "3",
    title: "Żądaj pisemnego potwierdzenia opóźnienia",
    text:
      "Poproś o oficjalne pismo lub wydruk potwierdzający opóźnienie pierwszego lotu i jego przyczynę. To dokument, który spina całą sprawę - bez niego linia może próbować kwestionować związek między lotami.",
    tag: "kluczowe",
    tone: "green",
  },
  {
    marker: "4",
    title: "Zachowaj wszystkie paragony i rachunki",
    text:
      "Jedzenie, napoje, taksówka, hotel - jeśli linia nie zapewniła Ci opieki i musiałeś płacić z własnej kieszeni, zbieraj każdy paragon. Możesz ubiegać się o zwrot tych kosztów osobno, niezależnie od odszkodowania.",
    tag: "zalecane",
    tone: "blue",
  },
  {
    marker: "5",
    title: "Zanotuj godzinę faktycznego przylotu do celu",
    text:
      "Zapisz dokładną godzinę otwarcia drzwi samolotu lub pierwszego połączenia z Wi-Fi po lądowaniu w miejscu docelowym. To Twój udokumentowany czas dotarcia - i podstawa obliczenia opóźnienia.",
    tag: "zalecane",
    tone: "blue",
  },
  {
    marker: "6",
    title: "Nie podpisuj zrzeczeń pod presją",
    text:
      "Na stanowiskach obsługi zdarzają się próby skłonienia pasażerów do podpisania dokumentów \"przyznających\" dobrowolną rezygnację lub \"akceptację rekompensaty\". Czytaj uważnie wszystko, co podpisujesz.",
    tag: "uwaga - pułapka",
    tone: "red",
  },
] as const;

const missedExceptionItems = [
  {
    title: "Ekstremalne warunki pogodowe",
    text:
      "Burza, zamieć, mgła uniemożliwiająca lądowanie - jeśli to spowodowało opóźnienie pierwszego lotu, linia może być zwolniona. Ale musi to wykazać konkretnymi danymi meteorologicznymi, nie ogólnym stwierdzeniem \"były złe warunki\".",
  },
  {
    title: "Zamknięcie przestrzeni powietrznej",
    text:
      "Decyzje służb kontroli lotów, ograniczenia wojskowe lub polityczne niemożliwe do przewidzenia. Klucz: musiały dotyczyć konkretnego lotu, nie ogólnej sytuacji na danym lotnisku.",
  },
  {
    title: "Za krótki czas przesiadki - ale to rzadki wyjątek",
    text:
      "Jeśli kupiłeś bilet z przesiadką tak krótką, że połączenie było praktycznie niemożliwe do wykonania nawet przy idealnej punktualności - linia może argumentować brak swojej odpowiedzialności. Ale uwaga: jeśli linia sama sprzedała Ci ten bilet z tak krótką przesiadką, argument ten najczęściej odpada w sądzie.",
  },
  {
    title: "Awaria techniczna - tu uważaj",
    text:
      "Linie próbują kwalifikować standardowe awarie jako siłę wyższą. W orzecznictwie TSUE jest to rzadko akceptowane - regularne problemy eksploatacyjne to odpowiedzialność przewoźnika, nie nadzwyczajne okoliczności.",
  },
] as const;

function DetailRows({
  rows,
}: {
  rows: readonly {
    marker: string;
    title: string;
    text: string;
    tone?: string;
    markerTone?: string;
  }[];
}) {
  return (
    <div className={styles.detailRows}>
      {rows.map((row) => {
        const markerTone = row.markerTone ?? row.tone ?? "blue";

        return (
          <article className={styles.detailRow} key={`${row.marker}-${row.title}`}>
            <div className={`${styles.rowMarker} ${styles[`rowTone${markerTone}`]}`}>
              {row.marker}
            </div>
            <div className={styles.rowCopy}>
              <h5>{row.title}</h5>
              <p>{row.text}</p>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function CancellationTimeline() {
  return (
    <div className={styles.cancelTimeline} aria-label="Oś czasu powiadomienia o odwołaniu lotu">
      {cancellationTimeline.map((item) => (
        <article className={styles.cancelTimelineRow} key={item.title}>
          <div
            className={`${styles.cancelTimelineMarker} ${
              styles[`cancelTimelineMarker${item.tone}`]
            }`}
          >
            <strong>{item.marker}</strong>
            <span>{item.sub}</span>
          </div>
          <div className={styles.cancelTimelineCopy}>
            <h5>{item.title}</h5>
            <p>{item.text}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

function CancellationCompensationTiers() {
  return (
    <div className={styles.tierBox} aria-label="Progi odszkodowania według długości trasy">
      <div className={styles.tierItem}>
        <span>Do 1 500 km</span>
        <strong>250 €</strong>
        <em>np. Warszawa → Londyn<br />Kraków → Rzym</em>
      </div>
      <div className={`${styles.tierItem} ${styles.tierItemFeatured}`}>
        <span>1 500 - 3 500 km</span>
        <strong>400 €</strong>
        <em>np. Warszawa → Teneryfe<br />Gdańsk → Dubaj</em>
      </div>
      <div className={styles.tierItem}>
        <span>Powyżej 3 500 km</span>
        <strong>600 €</strong>
        <em>np. Warszawa → Nowy Jork<br />Kraków → Tokio</em>
      </div>
    </div>
  );
}

function CancellationChoiceCards() {
  return (
    <div className={styles.choiceGrid}>
      {cancellationChoiceOptions.map((option) => (
        <article className={styles.choiceCard} key={option.title}>
          <h5>{option.title}</h5>
          <p>{option.text}</p>
          <ul className={styles.choiceList}>
            {option.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}

function DeniedInsightCards() {
  return (
    <div className={styles.splitInsight}>
      {deniedInsightCards.map((item) => (
        <article
          className={`${styles.splitPane} ${styles[`splitPane${item.tone}`]}`}
          key={item.title}
        >
          <span>{item.label}</span>
          <h5>{item.title}</h5>
          <p>{item.text}</p>
        </article>
      ))}
    </div>
  );
}

function DeniedEligibilityGrid() {
  return (
    <div className={styles.conditionGrid}>
      {deniedEligibilityItems.map((item) => (
        <article className={styles.conditionCard} key={item.title}>
          <span className={styles.conditionIcon}>{item.marker}</span>
          <div>
            <h5>{item.title}</h5>
            <p>{item.text}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

function ComparisonCell({
  cell,
}: {
  cell: { text?: string; tag?: string; tone?: "amber" | "green" | "red" | "blue" };
}) {
  if (cell.tag) {
    return (
      <span className={`${styles.tableTag} ${styles[`tableTag${cell.tone ?? "green"}`]}`}>
        {cell.tag}
      </span>
    );
  }

  return <span>{cell.text}</span>;
}

function DeniedComparisonTable() {
  return (
    <div className={styles.comparisonTableWrap}>
      <table className={styles.comparisonTable}>
        <thead>
          <tr>
            <th>Kryterium</th>
            <th>Dobrowolna zgoda</th>
            <th>Przymusowa odmowa</th>
          </tr>
        </thead>
        <tbody>
          {deniedComparisonRows.map((row) => (
            <tr key={row.criterion}>
              <th scope="row">{row.criterion}</th>
              <td>
                <ComparisonCell cell={row.voluntary} />
              </td>
              <td>
                <ComparisonCell cell={row.involuntary} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DeniedChoiceCards() {
  return (
    <div className={styles.choiceGrid}>
      {deniedChoiceOptions.map((option) => (
        <article className={styles.choiceCard} key={option.title}>
          <h5>{option.title}</h5>
          <p>{option.text}</p>
          <ul className={styles.choiceList}>
            {option.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}

function MissedRouteDiagram() {
  return (
    <div className={styles.routeDiagram} aria-label="Przykładowa trasa z nieudaną przesiadką">
      <div className={styles.routeDiagramHead}>
        Przykładowa trasa z nieudaną przesiadką - WAW → FRA → JFK
      </div>
      <div className={styles.routeDiagramBody}>
        <div className={styles.routeAirports}>
          <div>
            <strong>WAW</strong>
            <span>Warszawa</span>
          </div>
          <div>
            <strong>FRA</strong>
            <span>Frankfurt</span>
          </div>
        </div>
        <div className={styles.routePaths}>
          <div className={`${styles.routePath} ${styles.routePathDelayed}`}>
            <span>Lot 1 - opóźnienie 2h 40min</span>
            <small>Przyczyna: opóźnienie na trasie WAW → FRA</small>
          </div>
          <div className={`${styles.routePath} ${styles.routePathMissed}`}>
            <span>Lot 2 - nieudana przesiadka</span>
            <small>Samolot odleciał przed przylądowaniem Lotu 1</small>
          </div>
        </div>
        <div className={styles.routeAirports}>
          <div>
            <strong>FRA</strong>
            <span>Frankfurt</span>
          </div>
          <div>
            <strong>JFK</strong>
            <span>Nowy Jork</span>
          </div>
        </div>
      </div>
      <div className={styles.routeLegend}>
        <span className={styles.routeLegendRed}>Lot 1 opóźniony</span>
        <span className={styles.routeLegendAmber}>Przesiadka nieudana</span>
        <span className={styles.routeLegendBlue}>Odszkodowanie: do 600 €</span>
      </div>
    </div>
  );
}

function MissedReservationTable() {
  return (
    <div className={styles.comparisonTableWrap}>
      <table className={`${styles.comparisonTable} ${styles.connectionTable}`}>
        <thead>
          <tr>
            <th>Kryterium</th>
            <th>Jedna rezerwacja (połączenie)</th>
            <th>Dwa osobne bilety</th>
          </tr>
        </thead>
        <tbody>
          {missedReservationRows.map((row) => (
            <tr key={row.criterion}>
              <th scope="row">{row.criterion}</th>
              <td>
                <ComparisonCell cell={row.single} />
              </td>
              <td>
                <ComparisonCell cell={row.separate} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MissedEligibilityPanels() {
  return (
    <div className={styles.checkGrid}>
      <article className={`${styles.checkPanel} ${styles.checkPanelGood}`}>
        <span className={styles.checkBadge}>✓</span>
        <h5>Odszkodowanie przysługuje</h5>
        <ul>
          {missedEligibilityGood.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </article>
      <article className={`${styles.checkPanel} ${styles.checkPanelBad}`}>
        <span className={styles.checkBadge}>X</span>
        <h5>Odszkodowanie nie przysługuje</h5>
        <ul>
          {missedEligibilityBad.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </article>
    </div>
  );
}

function MissedCompensationTiers() {
  return (
    <div className={styles.tierBox} aria-label="Progi odszkodowania według trasy końcowej">
      <div className={styles.tierItem}>
        <span>Do 1 500 km</span>
        <strong>250 €</strong>
        <em>np. WAW → VIE → LHR<br />trasa łączna do 1500 km</em>
      </div>
      <div className={`${styles.tierItem} ${styles.tierItemFeatured}`}>
        <span className={styles.tierRibbon}>Najczęstszy</span>
        <span>1 500 - 3 500 km</span>
        <strong>400 €</strong>
        <em>np. WAW → AMS → DXB<br />trasa łączna 1500-3500 km</em>
      </div>
      <div className={styles.tierItem}>
        <span>Powyżej 3 500 km</span>
        <strong>600 €</strong>
        <em>np. WAW → FRA → JFK<br />trasa łączna ponad 3 500 km</em>
      </div>
    </div>
  );
}

function CompensationTiers() {
  return (
    <div className={styles.tierBox} aria-label="Progi odszkodowania według długości trasy">
      <div className={styles.tierItem}>
        <span>Do 1 500 km</span>
        <strong>250 €</strong>
        <em>np. Warszawa → Londyn<br />Kraków → Paryż</em>
      </div>
      <div className={`${styles.tierItem} ${styles.tierItemFeatured}`}>
        <span>1 500 - 3 500 km</span>
        <strong>400 €</strong>
        <em>np. Warszawa → Teneryfe<br />Gdańsk → Dubaj</em>
      </div>
      <div className={styles.tierItem}>
        <span>Powyżej 3 500 km</span>
        <strong>600 €</strong>
        <em>np. Warszawa → Nowy Jork<br />Kraków → Bangkok</em>
      </div>
    </div>
  );
}

function DelayDetails() {
  return (
    <>
      <DetailSection title="Skąd w ogóle biorą się te prawa?">
        <p>
          W 2004 roku Unia Europejska uchwaliła rozporządzenie, które raz na
          zawsze ustaliło, co linie lotnicze muszą zrobić dla pasażerów, gdy lot
          się opóźni, zostanie odwołany lub gdy nie dostaną się na pokład. To nie
          rekomendacja ani prośba, to <strong>obowiązek prawny</strong>, z którym
          każdy przewoźnik musi się liczyć.
        </p>
        <p>
          Co ważne, prawo to dotyczy każdego lotu startującego z lotniska w Unii
          Europejskiej, niezależnie od tego, czy lecisz polskim LOT-em,
          irlandzkim Ryanairem czy jakimkolwiek innym przewoźnikiem. Jeśli Twój
          lot startuje z Warszawy, Krakowa lub Gdańska jesteś w pełni
          chroniony.
        </p>
        <DetailCallout label="zasięg prawa">
          Rozporządzenie WE 261/2004 obowiązuje na wszystkich lotach startujących
          z lotnisk UE oraz na lotach do UE obsługiwanych przez europejskich
          przewoźników. Nie ma znaczenia, czy Twój bilet kosztował 39 zł czy
          3000 zł, prawa masz dokładnie te same.
        </DetailCallout>
      </DetailSection>

      <DetailSection title="Od kiedy opóźnienie daje Ci prawo do odszkodowania?">
        <p>
          Prawo do pieniężnego odszkodowania pojawia się dopiero przy{" "}
          <strong>przylocie opóźnionym o co najmniej 3 godziny</strong>. Liczy
          się czas dotarcia do celu - a dokładnie moment, gdy drzwi samolotu
          zostają otwarte na docelowym lotnisku, nie godzina wyjścia z bramki
          przy odlocie.
        </p>
        <p>
          Ale jeszcze zanim miną te trzy godziny, linia jest Ci coś winna. Już od
          2 godzin opóźnienia przysługuje Ci{" "}
          <strong>bezpłatna opieka na lotnisku</strong>. To prawo, które większość
          pasażerów całkowicie pomija i przez to traci realne pieniądze.
        </p>
        <p>Poniżej widzisz, ile wynosi odszkodowanie w zależności od długości Twojej trasy:</p>
        <CompensationTiers />
        <DetailCallout tone="green" label="Lecisz z rodziną? Mnożysz razy liczbę osób.">
          Odszkodowanie przysługuje każdemu pasażerowi z osobna. Rodzina 4 osób
          lecąca na daleką trasę może odzyskać łącznie nawet <strong>2 400 €</strong>.
          Wystarczy jedno zgłoszenie, a my zajmiemy się całą grupą.
        </DetailCallout>
      </DetailSection>

      <DetailSection title="Co Ci przysługuje jeszcze na lotnisku?">
        <p>
          Zanim w ogóle zaczniemy mówić o odszkodowaniu, jest coś, czego możesz i
          powinieneś żądać natychmiast. Linia ma obowiązek zapewnić Ci{" "}
          <strong>opiekę na miejscu</strong> i to niezależnie od tego, czy
          ostatecznie wypłaci odszkodowanie, czy nie. To dwa osobne prawa.
        </p>
        <p>
          Idź do stanowiska obsługi linii i powiedz wprost, że żądasz opieki
          przysługującej Ci na mocy rozporządzenia WE 261/2004. Te słowa robią
          różnicę.
        </p>
        <DetailRows rows={supportRows} />
      </DetailSection>

      <DetailSection title="5 rzeczy, które musisz zrobić na lotnisku">
        <p>
          Twoje zachowanie w trakcie opóźnienia ma bezpośredni wpływ na
          skuteczność późniejszego roszczenia. Kilka prostych kroków sprawia, że
          sprawa jest dużo łatwiejsza do udowodnienia, a linia nie ma jak
          powiedzieć, że „nie ma dowodów”.
        </p>
        <DetailRows rows={airportSteps} />
      </DetailSection>

      <DetailSection title="Kiedy linia nie musi płacić?">
        <p>
          Są sytuacje, w których linia jest zwolniona z
          obowiązku wypłaty odszkodowania. Dzieje się tak, gdy opóźnienie wynika
          z tzw. <strong>nadzwyczajnych okoliczności</strong>, czyli zdarzeń,
          których linia nie mogła przewidzieć ani im zapobiec.
        </p>
        <p>
          Sama deklaracja linii to za mało. Muszą te okoliczności{" "}
          <strong>udokumentować i udowodnić</strong>. I tu właśnie wiele odmownych
          decyzji sypie się w sądzie.
        </p>
        <div className={styles.exceptionList}>
          {extraordinaryItems.map((item) => (
            <article className={styles.exceptionItem} key={item.title}>
              <div>
                <h5>{item.title}</h5>
                <p>{item.text}</p>
              </div>
            </article>
          ))}
        </div>
        <DetailCallout tone="red" label="Pułapka - na co uważaj">
          Linie lotnicze bardzo chętnie powołują się na „nadzwyczajne
          okoliczności” nawet wtedy, gdy ich faktycznie nie było. Twierdzenie
          linii to nie dowód - muszą je konkretnie udokumentować. Wiele odmów
          opiera się na blefie, który odpada przy pierwszym poważnym wezwaniu
          prawnym.
        </DetailCallout>
      </DetailSection>

      <DetailSection title="Jak długo masz na zgłoszenie roszczenia?">
        <p>
          W Polsce roszczenia z tytułu rozporządzenia WE 261/2004 przedawniają
          się po <strong>roku od daty lotu</strong>. Oznacza to, że możesz
          zgłosić opóźnienie maksymalnie rok od lądowania i nadal masz pełne prawo
          do odszkodowania.
        </p>
        <p>
          Nie zwlekaj jednak bez powodu. Im starszy lot, tym trudniej zebrać
          dokumentację. Linie kasują zapisy operacyjne, lotniska archiwizują dane
          z ograniczonym dostępem, a Ty możesz już nie mieć karty pokładowej ani
          maila z rezerwacją. Działaj, gdy informacje są jeszcze świeże.
        </p>
        <DetailCallout label="Termin - 1 rok od dnia lotu">
          Masz lot z 2025 roku, który się spóźnił? Możesz go zgłosić
          teraz. Sprawdzenie nic nie kosztuje, a możesz odzyskać pieniądze, o
          których już zapomniałeś.
        </DetailCallout>
      </DetailSection>

      <DetailSection title="Czy warto działać samodzielnie?">
        <p>
          Technicznie tak, możesz wysłać reklamację samemu. Problem w tym, że
          linie lotnicze doskonale wiedzą, że większość pasażerów odpuszcza po
          pierwszej odmowie. I właśnie na to liczą. Pierwsze pismo ignorują,
          drugie odrzucają ze standardowym uzasadnieniem.
        </p>
        <p>
          Statystyki są bezlitosne,{" "}
          <strong>ponad 60% roszczeń złożonych bez pomocy prawnika</strong>{" "}
          zostaje odrzuconych na pierwszym etapie. Te same sprawy, gdy trafiają
          do nas wygrywamy w 97% przypadków. Różnica nie leży w faktach.
          Leży w tym, że wiemy dokładnie, jak z liniami rozmawiać, a gdy to nie przynosi skutku, dochodzimy Twoich praw na drodze sądowej.
        </p>
        <p>
          W oweme działamy w modelu <strong>success fee</strong> nie płacisz nic
          z góry. Koszty ewentualnego postępowania sądowego pokrywamy my. Jeśli
          sprawa nie kwalifikuje się do odszkodowania powiemy Ci o tym wprost,
          bez żadnych opłat i bez marnowania Twojego czasu.
        </p>
        <DetailCallout tone="green" label="Podsumowanie">
          Opóźnienie 3h+ daje prawo do odszkodowania 250-600 € na osobę. Już od
          2h przysługuje Ci opieka na lotnisku. Masz 1 rok na zgłoszenie.
          Sprawdzenie nic nie kosztuje. Jeśli wygramy - płacisz prowizję od
          odzyskanej kwoty. Jeśli przegramy - nie płacisz nic.
        </DetailCallout>
      </DetailSection>
    </>
  );
}

function CancelDetails() {
  return (
    <>
      <DetailSection title="Odwołanie lotu - kiedy linia musi zapłacić?">
        <p>
          Samo odwołanie lotu nie zawsze daje prawo do odszkodowania pieniężnego.
          Kluczowy jest moment, w którym linia Cię o tym powiadomiła.
          Rozporządzenie WE 261/2004 mówi jasno: jeśli dowiedziałeś się o
          odwołaniu zbyt późno - <strong>należy Ci się pełne odszkodowanie</strong>.
          Jeśli linia poinformowała Cię odpowiednio wcześnie i zaproponowała
          alternatywę - sytuacja jest bardziej złożona.
        </p>
        <p>
          Poniżej oś czasu, która pokazuje, kiedy odszkodowanie przysługuje, a
          kiedy nie:
        </p>
        <CancellationTimeline />
        <DetailCallout label="Ważne - zasięg prawa">
          Rozporządzenie WE 261/2004 chroni każdego pasażera na locie startującym
          z lotniska w UE lub locie do UE obsługiwanym przez europejskiego
          przewoźnika. Nie ma znaczenia cena biletu ani klasa - prawa są
          jednakowe dla wszystkich.
        </DetailCallout>
      </DetailSection>

      <DetailSection title="Ile wynosi odszkodowanie za odwołany lot?">
        <p>
          Kwota odszkodowania zależy wyłącznie od długości trasy - nie od ceny
          biletu, klasy podróży ani linii lotniczej. Decyduje odległość między
          lotniskiem odlotu a lotniskiem docelowym:
        </p>
        <CancellationCompensationTiers />
        <p>
          Ważna informacja: linia może obniżyć odszkodowanie o połowę, jeśli
          zaproponowała Ci lot alternatywny, który dowiezie Cię do celu w
          zbliżonym czasie. Jeśli jednak żadnej alternatywy nie było - lub była
          ona wyraźnie gorsza - przysługuje Ci pełna kwota.
        </p>
        <DetailCallout tone="green" label="Lecisz z grupą? Kwota mnoży się przez osoby.">
          Odszkodowanie przysługuje każdemu pasażerowi z osobna. Para lecąca do
          Nowego Jorku może odzyskać łącznie <strong>1 200 €</strong>, a rodzina
          czteroosobowa nawet <strong>2 400 €</strong>. Jedno zgłoszenie wystarczy
          dla całej grupy - zajmiemy się wszystkimi.
        </DetailCallout>
      </DetailSection>

      <DetailSection title="Zwrot biletu czy lot zastępczy? Twój wybór.">
        <p>
          Niezależnie od prawa do odszkodowania pieniężnego, przy odwołaniu lotu
          masz zawsze do wyboru dwie opcje. To <strong>Twoja decyzja</strong> -
          linia nie może Ci jej narzucić ani odmówić żadnej z nich.
        </p>
        <CancellationChoiceCards />
        <DetailCallout tone="red" label="Pułapka - na co uważaj">
          Linie często proponują voucher na przyszłe loty zamiast zwrotu gotówki.
          Voucher to nie to samo co zwrot - i nie musisz go przyjmować. Masz prawo
          żądać przelewu na konto. Nie podpisuj niczego pod presją na lotnisku bez
          dokładnego przeczytania.
        </DetailCallout>
      </DetailSection>

      <DetailSection title="Opieka na lotnisku - zanim polecisz">
        <p>
          Niezależnie od tego, czy przysługuje Ci odszkodowanie pieniężne - przy
          odwołaniu lotu linia jest <strong>natychmiast zobowiązana</strong> do
          zapewnienia Ci opieki na miejscu. To osobne prawo, które działa
          równolegle z roszczeniem o odszkodowanie.
        </p>
        <DetailRows rows={cancellationCareRows} />
      </DetailSection>

      <DetailSection title="Co zrobić na lotnisku - 5 kroków">
        <p>
          Sposób, w jaki zachowasz się w momencie odwołania lotu, bezpośrednio
          wpływa na skuteczność późniejszego roszczenia. Kilka prostych kroków
          może zdecydować o tym, czy odzyskasz pieniądze - czy nie.
        </p>
        <DetailRows rows={cancellationAirportSteps} />
      </DetailSection>

      <DetailSection title="Kiedy linia nie musi płacić odszkodowania?">
        <p>
          Podobnie jak przy opóźnieniu, linia może być zwolniona z obowiązku
          wypłaty odszkodowania, jeśli odwołanie wynikało z{" "}
          <strong>nadzwyczajnych okoliczności</strong>, których nie mogła
          przewidzieć ani im zapobiec. Kluczowe słowo: musi to udowodnić.
        </p>
        <div className={styles.exceptionList}>
          {cancellationExceptionItems.map((item) => (
            <article className={styles.exceptionItem} key={item.title}>
              <div>
                <h5>{item.title}</h5>
                <p>{item.text}</p>
              </div>
            </article>
          ))}
        </div>
        <DetailCallout tone="red" label="Pułapka - awaria techniczna to nie siła wyższa">
          To jeden z najczęstszych sposobów, w jaki linie próbują uniknąć wypłaty
          odszkodowania. Trybunał Sprawiedliwości UE wielokrotnie orzekał, że
          standardowe problemy techniczne wynikające ze zwykłej eksploatacji
          samolotu <strong>nie są nadzwyczajnymi okolicznościami</strong>. Jeśli
          linia odmówiła Ci odszkodowania, powołując się na awarię -
          prawdopodobnie blefuje.
        </DetailCallout>
      </DetailSection>

      <DetailSection title="Ile masz czasu na zgłoszenie roszczenia?">
        <p>
          W Polsce roszczenia z tytułu rozporządzenia WE 261/2004 przedawniają
          się po <strong>3 latach od daty lotu</strong>. Jeśli Twój lot został
          odwołany w 2023 lub 2024 roku - nadal możesz zgłosić roszczenie.
        </p>
        <p>
          Nie zwlekaj jednak bez powodu: im starszy lot, tym trudniej zebrać
          dokumentację. Linie usuwają wewnętrzne zapisy po określonym czasie, a
          Ty możesz już nie mieć maila z potwierdzeniem ani karty pokładowej.
          Działaj, gdy szczegóły są jeszcze świeże w pamięci i w skrzynce
          mailowej.
        </p>
        <DetailCallout label="Termin - 3 lata od dnia odwołanego lotu">
          Sprawdzenie, czy Twoja sprawa kwalifikuje się do odszkodowania, zajmuje
          60 sekund i jest całkowicie bezpłatne. Jeśli masz szansę - działamy.
          Jeśli nie - powiemy Ci wprost.
        </DetailCallout>
      </DetailSection>

      <DetailSection title="Czy warto działać samodzielnie?">
        <p>
          Możesz spróbować zgłosić roszczenie samodzielnie - przepisy na to
          pozwalają. Problem w tym, że linie lotnicze mają wyspecjalizowane
          działy, które odrzucają wnioski, opóźniają odpowiedzi i powołują się na
          wyjątki, które często w ogóle nie mają zastosowania. Liczą na to, że
          pasażer odpuści.
        </p>
        <p>
          Przypadki odwołanych lotów są szczególnie podatne na ten proceder, bo
          linia może próbować podciągnąć odwołanie pod &quot;nadzwyczajne
          okoliczności&quot; - nawet gdy faktyczne przyczyny były zupełnie inne.
          Doświadczony prawnik potrafi to zidentyfikować i obalić.
        </p>
        <p>
          W oweme pracujemy wyłącznie w modelu <strong>success fee</strong>: nie
          płacisz nic z góry, koszty sądowe pokrywamy my, a prowizję pobieramy
          tylko od odzyskanej kwoty. Jeśli przegramy - nie płacisz nic. Jeśli
          Twoja sprawa nie kwalifikuje się - powiadamiamy Cię o tym bezpłatnie i
          bez zbędnego przeciągania.
        </p>
        <DetailCallout tone="green" label="Podsumowanie - co najważniejsze">
          Odwołanie lotu bez min. 14-dniowego wyprzedzenia uprawnia do
          odszkodowania 250-600 € na osobę. Zawsze przysługuje Ci zwrot biletu
          lub lot zastępczy. Masz 3 lata na zgłoszenie. Awaria techniczna to w
          większości przypadków powód do odszkodowania - nie wyjątek od niego.
          Sprawdzenie nic nie kosztuje.
        </DetailCallout>
      </DetailSection>
    </>
  );
}

function DeniedDetails() {
  return (
    <>
      <DetailSection title="Co to jest overbooking i dlaczego linie to robią?">
        <p>
          Overbooking to celowa praktyka linii lotniczych polegająca na sprzedaniu
          większej liczby biletów niż miejsc w samolocie. Linie robią to świadomie
          i legalnie - statystycznie zawsze część pasażerów nie pojawia się na
          lotnisku. Gdy jednak wszyscy stawią się punktualnie, ktoś musi zostać na
          ziemi.
        </p>
        <p>
          To nie przypadek, nie pomyłka systemu - to{" "}
          <strong>skalkulowane ryzyko biznesowe linii</strong>, które ponosi
          wyłącznie pasażer. Właśnie dlatego rozporządzenie WE 261/2004 daje Ci w
          takiej sytuacji jedne z najsilniejszych praw spośród wszystkich
          przypadków zakłóceń podróży.
        </p>
        <DeniedInsightCards />
      </DetailSection>

      <DetailSection title="Kiedy dokładnie przysługuje Ci odszkodowanie?">
        <p>
          Prawo do odszkodowania pojawia się, gdy spełniasz wszystkie poniższe
          warunki - i zostałeś wpuszczenia na pokład odmówiony wbrew swojej woli.
          Jeśli dobrowolnie zgodziłeś się ustąpić miejsca w zamian za rekompensatę
          od linii, sytuacja wygląda inaczej.
        </p>
        <DeniedEligibilityGrid />
        <DetailCallout label="Lot na którym ląduje ochrona prawna">
          Rozporządzenie WE 261/2004 chroni Cię na każdym locie startującym z
          lotniska w UE oraz na lotach do UE obsługiwanych przez europejskiego
          przewoźnika - niezależnie od ceny biletu i klasy podróży.
        </DetailCallout>
      </DetailSection>

      <DetailSection title="Ile wynosi odszkodowanie?">
        <p>
          Kwota odszkodowania za odmowę wejścia na pokład jest identyczna jak przy
          opóźnieniu i odwołaniu lotu - i zależy wyłącznie od długości trasy, nie
          od ceny biletu:
        </p>
        <CancellationCompensationTiers />
        <p>
          Ważna różnica w stosunku do odwołania: przy przymusowej odmowie wejścia
          na pokład linia <strong>nie może obniżyć odszkodowania o połowę</strong>,
          nawet jeśli zaoferuje Ci lot zastępczy docierający do celu w rozsądnym
          czasie. Pełna kwota należy Ci się bezwarunkowo.
        </p>
        <DetailCallout tone="green" label="Lecisz z grupą? Każda osoba liczy się osobno.">
          Jeśli z pokładu usunięto kilku pasażerów z jednej rezerwacji,
          odszkodowanie przysługuje każdemu z nich z osobna. Para podróżująca do
          Nowego Jorku może odzyskać łącznie <strong>1 200 €</strong>. Jedno
          zgłoszenie wystarczy dla całej grupy.
        </DetailCallout>
      </DetailSection>

      <DetailSection title="Dobrowolna vs przymusowa odmowa - kluczowa różnica">
        <p>
          Zanim linia odmówi komukolwiek wejścia przymusowo, ma obowiązek poszukać
          ochotników - pasażerów, którzy dobrowolnie zgodzą się polecieć później w
          zamian za uzgodnioną rekompensatę. To dwie zupełnie różne sytuacje z
          różnymi konsekwencjami prawnymi.
        </p>
        <DeniedComparisonTable />
        <DetailCallout tone="amber" label="Wskazówka - jeśli linia szuka ochotników">
          Jeśli przy bramce ogłoszą poszukiwanie ochotników, możesz negocjować
          warunki. Standardowa oferta linii to voucher - ale masz prawo żądać{" "}
          <strong>gotówki lub przelewu</strong> zamiast vouchera, a kwota powinna
          co najmniej pokrywać ustawowe odszkodowanie. Nie musisz przyjmować
          pierwszej oferty.
        </DetailCallout>
      </DetailSection>

      <DetailSection title="Co Ci przysługuje natychmiast - opieka na miejscu">
        <p>
          Niezależnie od odszkodowania pieniężnego, przy każdej odmowie wejścia na
          pokład linia jest <strong>natychmiast zobowiązana</strong> do zapewnienia
          Ci pełnej opieki. To osobne prawo, działające równolegle z roszczeniem o
          odszkodowanie.
        </p>
        <DetailRows rows={deniedCareRows} />
      </DetailSection>

      <DetailSection title="Lot zastępczy czy pełny zwrot biletu?">
        <p>
          Tak samo jak przy odwołaniu lotu, masz prawo wyboru między dwiema
          opcjami. Linia nie może Ci tej decyzji narzucić - to wyłącznie Twój
          wybór, który musisz podjąć na miejscu lub wkrótce po incydencie.
        </p>
        <DeniedChoiceCards />
        <DetailCallout tone="red" label="Pułapka - nie musisz przyjmować vouchera">
          Linie nagminnie oferują voucher na przyszłe loty zamiast zwrotu gotówki.
          Voucher to nie zwrot pieniędzy - i masz pełne prawo odmówić jego
          przyjęcia i zażądać przelewu. Nie podpisuj żadnych dokumentów pod presją
          przy bramce bez dokładnego przeczytania.
        </DetailCallout>
      </DetailSection>

      <DetailSection title="Co zrobić na lotnisku - 6 kroków">
        <p>
          Odmowa wejścia na pokład to szok i stres. Dlatego warto wiedzieć z góry,
          co konkretnie zrobić - żeby nie stracić ani praw, ani nerwów.
        </p>
        <DetailRows rows={deniedAirportSteps} />
      </DetailSection>

      <DetailSection title="Kiedy linia może odmówić bez odszkodowania?">
        <p>
          Odmowa wejścia na pokład to jeden z przypadków, w których katalog
          uzasadnionych wyjątków jest stosunkowo wąski. Rozporządzenie WE 261/2004
          jest tu szczególnie rygorystyczne. Linia może odmówić Ci odszkodowania
          wyłącznie w nielicznych, ściśle określonych sytuacjach:
        </p>
        <div className={styles.exceptionList}>
          {deniedExceptionItems.map((item) => (
            <article className={styles.exceptionItem} key={item.title}>
              <div>
                <h5>{item.title}</h5>
                <p>{item.text}</p>
              </div>
            </article>
          ))}
        </div>
        <DetailCallout tone="red" label="Pamiętaj - ciężar dowodu leży po stronie linii">
          Jeśli linia twierdzi, że Twoja odmowa wejścia była uzasadniona - musi to
          udowodnić. Same słowne zapewnienia przy stanowisku obsługi to za mało.
          Jeśli odmówili Ci bez dokumentacji - masz mocną pozycję w sporze
          prawnym.
        </DetailCallout>
      </DetailSection>

      <DetailSection title="Ile masz czasu na zgłoszenie roszczenia?">
        <p>
          W Polsce roszczenia z tytułu rozporządzenia WE 261/2004 przedawniają
          się po <strong>3 latach od daty lotu</strong>. Odmowa wejścia na pokład
          sprzed nawet 3 lat nadal może być podstawą do skutecznego roszczenia.
        </p>
        <p>
          Działaj jednak szybko - im wcześniej, tym lepiej. Dokumentacja jest
          świeża, zapisy systemu check-in są dostępne, a Ty prawdopodobnie nadal
          masz wszystkie e-maile z rezerwacją. Czekanie bez powodu tylko utrudnia
          sprawę.
        </p>
        <DetailCallout label="Termin - 3 lata od dnia lotu">
          Sprawdzenie Twojej sprawy zajmuje 60 sekund i jest całkowicie bezpłatne.
          Nie musisz nic wiedzieć o prawie - wystarczy, że znasz numer lotu i
          datę. Resztą zajmujemy się my.
        </DetailCallout>
      </DetailSection>

      <DetailSection title="Dlaczego warto działać z prawnikiem?">
        <p>
          Odmowa wejścia na pokład to jeden z przypadków, w których Twoja pozycja
          prawna jest szczególnie silna. A mimo to linie regularnie odrzucają
          roszczenia składane samodzielnie - licząc na to, że pasażer nie będzie
          wiedział, jak odpowiedzieć.
        </p>
        <p>
          Najczęstszy trick: linia twierdzi, że pasażer &quot;dobrowolnie wyraził
          zgodę&quot; na zmianę lotu - powołując się na mgliście sformułowany dokument
          podpisany przy bramce pod presją. Bez znajomości przepisów trudno taki
          argument obalić. Z prawnikiem - to kwestia jednego pisma.
        </p>
        <p>
          W oweme pracujemy w modelu <strong>success fee</strong>: zero opłat z
          góry, koszty sądowe po naszej stronie, prowizja wyłącznie od odzyskanej
          kwoty. Jeśli przegramy - nie płacisz nic. Jeśli Twoja sprawa nie ma
          podstaw - powiemy Ci o tym wprost i bezpłatnie.
        </p>
        <DetailCallout tone="green" label="Podsumowanie - co najważniejsze">
          Przymusowa odmowa wejścia na pokład daje prawo do odszkodowania 250-600
          € na osobę - bez możliwości obniżki przez linię. Zawsze przysługuje Ci
          lot zastępczy lub zwrot biletu. Żądaj pisemnego potwierdzenia odmowy.
          Masz 3 lata na zgłoszenie. Sprawdzenie nic nie kosztuje.
        </DetailCallout>
      </DetailSection>
    </>
  );
}

function MissedConnectionDetails() {
  return (
    <>
      <DetailSection title="Jak działa nieudana przesiadka - i gdzie leży odpowiedzialność?">
        <p>
          Nieudana przesiadka to sytuacja, w której opóźnienie pierwszego lotu
          sprawia, że nie zdążasz na kolejny. Skutek jest prosty: docierasz do
          celu znacznie później, niż zaplanowałeś. Ale to,{" "}
          <strong>kto za to odpowiada</strong>, zależy od jednego kluczowego
          czynnika - jak kupiłeś bilety.
        </p>
        <p>Poniżej pokazujemy, jak wygląda typowa nieudana przesiadka i co z niej wynika:</p>
        <MissedRouteDiagram />
      </DetailSection>

      <DetailSection title="Jeden bilet czy dwa - to decyduje o wszystkim">
        <p>
          Zanim zaczniesz myśleć o odszkodowaniu, musisz wiedzieć, w jaki sposób
          kupiłeś bilety. To <strong>absolutnie kluczowa różnica</strong> -
          determinuje nie tylko prawo do odszkodowania, ale i to, kto w ogóle musi
          Ci pomagać na lotnisku.
        </p>
        <MissedReservationTable />
        <DetailCallout tone="amber" label="Wskazówka - sprawdź swój bilet przed lotem">
          Jeden numer rezerwacji (PNR) przy całej trasie = jedno połączenie. Jeśli
          masz dwa osobne PNR lub dwa e-maile z potwierdzeniami od różnych linii -
          to dwie oddzielne rezerwacje. W razie wątpliwości sprawdź u nas
          bezpłatnie - to kwestia kilku sekund.
        </DetailCallout>
      </DetailSection>

      <DetailSection title="Kiedy przysługuje Ci odszkodowanie?">
        <p>
          Prawo do odszkodowania przy nieudanej przesiadce zależy od kilku
          warunków naraz. Najważniejszy z nich:{" "}
          <strong>liczy się łączne opóźnienie dotarcia do celu końcowego</strong>{" "}
          - nie opóźnienie poszczególnych lotów z osobna.
        </p>
        <MissedEligibilityPanels />
        <DetailCallout label="Kluczowy przelicznik - cel końcowy, nie przesiadka">
          Jeśli przez nieudaną przesiadkę dotarłeś do Nowego Jorku 5 godzin po
          planowym czasie - to jest Twoje 5-godzinne opóźnienie na celu końcowym.
          Nie ma znaczenia, że lot z Frankfurtu do Nowego Jorku był punktualny.
          Linia odpowiada za całą trasę objętą jedną rezerwacją.
        </DetailCallout>
      </DetailSection>

      <DetailSection title="Ile wynosi odszkodowanie?">
        <p>
          Kwota odszkodowania przy nieudanej przesiadce jest liczona tak samo jak
          przy każdym innym opóźnieniu - na podstawie odległości{" "}
          <strong>między lotniskiem odlotu a lotniskiem docelowym</strong>, nie
          przesiadkowym. Decyduje ostateczna destynacja:
        </p>
        <MissedCompensationTiers />
        <p>
          Nieudane przesiadki na trasach długodystansowych to najczęstszy
          scenariusz roszczeń wartych <strong>600 € na osobę</strong>. Rodzina
          czteroosobowa lecąca do Stanów może odzyskać 2 400 € za jeden incydent -
          niezależnie od ceny biletu.
        </p>
        <DetailCallout tone="green" label="Pamiętaj - każda osoba w rezerwacji ma osobne prawo">
          Odszkodowanie przysługuje każdemu pasażerowi z osobna. Jedno zgłoszenie
          wystarczy dla całej grupy - zajmujemy się wszystkimi na raz, bez
          dodatkowych kosztów.
        </DetailCallout>
      </DetailSection>

      <DetailSection title="Co Ci przysługuje natychmiast - na lotnisku przesiadkowym">
        <p>
          Niezależnie od późniejszego odszkodowania, gdy utkniesz na lotnisku
          przesiadkowym z powodu opóźnienia linii, masz{" "}
          <strong>natychmiastowe prawo do opieki</strong>. Idź do stanowiska
          obsługi linii odpowiedzialnej za opóźniony pierwszy lot i zażądaj pomocy.
        </p>
        <DetailRows rows={missedCareRows} />
      </DetailSection>

      <DetailSection title="Co zrobić na lotnisku - 6 kroków">
        <p>
          Stres i pośpiech na obcym lotnisku sprzyjają błędom. Poniżej konkretna
          lista - co zrobić krok po kroku, żeby nie stracić ani prawa do lotu
          zastępczego, ani prawa do późniejszego odszkodowania.
        </p>
        <DetailRows rows={missedAirportSteps} />
      </DetailSection>

      <DetailSection title="Kiedy linia nie musi płacić?">
        <p>
          Tak samo jak przy opóźnieniach i odwołaniach, linia może być zwolniona z
          odszkodowania, jeśli nieudana przesiadka wynikła z{" "}
          <strong>nadzwyczajnych okoliczności</strong>. Musi jednak udowodnić, że
          te okoliczności faktycznie wystąpiły i były bezpośrednią przyczyną - nie
          wystarczy samo twierdzenie.
        </p>
        <div className={styles.exceptionList}>
          {missedExceptionItems.map((item) => (
            <article className={styles.exceptionItem} key={item.title}>
              <div>
                <h5>{item.title}</h5>
                <p>{item.text}</p>
              </div>
            </article>
          ))}
        </div>
        <DetailCallout tone="red" label="Pułapka - za krótki czas na przesiadkę to nie Twój problem">
          Jeśli linia sprzedała Ci bilet z przesiadką 45 minut i opóźnienie
          pierwszego lotu sprawiło, że nie zdążyłeś - to{" "}
          <strong>linia ponosi odpowiedzialność</strong> za zaproponowanie
          niemożliwego do realizacji połączenia. Wielu pasażerów daje się zbyć tym
          argumentem. Nie daj się.
        </DetailCallout>
      </DetailSection>

      <DetailSection title="Co z bagażem, który poleciał bez Ciebie?">
        <p>
          To jeden z najbardziej stresujących aspektów nieudanej przesiadki - Twój
          bagaż odprawiony na lotnisko docelowe może już tam być, podczas gdy Ty
          utknąłeś na przesiadce. Albo odwrotnie - bagaż utknął razem z Tobą, ale
          lot zastępczy go nie zabrał.
        </p>
        <p>
          W obu przypadkach jesteś chroniony osobnymi przepisami -{" "}
          <strong>Konwencją Montrealską</strong>, która reguluje odpowiedzialność
          linii za opóźnienie lub zagubienie bagażu. To osobne roszczenie, które
          możesz złożyć równolegle z roszczeniem za opóźnienie.
        </p>
        <DetailCallout label="Bagaż a przesiadka - dwa osobne roszczenia">
          Odszkodowanie za nieudaną przesiadkę i odszkodowanie za opóźniony lub
          zagubiony bagaż to dwa niezależne prawa. Możesz dochodzić obu
          jednocześnie. Przy problemach z bagażem kluczowe jest zgłoszenie PIR
          (Property Irregularity Report) bezpośrednio na lotnisku - bez tego
          roszczenie bagażowe jest bardzo trudne do udowodnienia.
        </DetailCallout>
      </DetailSection>

      <DetailSection title="Jak długo masz na zgłoszenie roszczenia?">
        <p>
          W Polsce roszczenia z tytułu rozporządzenia WE 261/2004 przedawniają
          się po <strong>3 latach od daty lotu</strong>. Nieudana przesiadka
          sprzed 2 lat - nadal możliwa do zgłoszenia.
        </p>
        <p>
          Jednak przy nieudanych przesiadkach szczególnie ważne jest działanie
          szybko. Sprawa wymaga zebrania dokumentacji obu lotów naraz - a dane
          operacyjne linii są kasowane po określonym czasie. Im szybciej działasz,
          tym łatwiej nam zbudować silne roszczenie.
        </p>
        <DetailCallout label="Termin - 3 lata od dnia przesiadki">
          Sprawdzenie Twojej sprawy zajmuje 60 sekund i jest bezpłatne. Podaj
          numer pierwszego lotu i datę - resztą zajmujemy się my, łącznie z
          dokumentacją drugiego lotu i obliczeniem łącznego opóźnienia na miejscu
          docelowym.
        </DetailCallout>
      </DetailSection>

      <DetailSection title="Dlaczego nieudane przesiadki są trudniejsze do samodzielnego dochodzenia?">
        <p>
          Nieudana przesiadka to najzłożniejszy ze wszystkich scenariuszy objętych
          rozporządzeniem WE 261/2004. Wymaga jednoczesnego udowodnienia: że
          opóźnienie pierwszego lotu jest faktem, że przesiadka była objęta jedną
          rezerwacją, że łączne opóźnienie na miejscu docelowym przekroczyło 3
          godziny, i że przyczyna nie była nadzwyczajna.
        </p>
        <p>
          Linie wykorzystują tę złożoność. Odrzucają roszczenia, twierdząc, że
          &quot;drugi lot był punktualny&quot; - ignorując fakt, że pasażer dotarł do
          celu z 5-godzinnym opóźnieniem. Albo powołują się na &quot;zbyt krótki czas
          przesiadki&quot;, ukrywając, że same sprzedały ten właśnie bilet. W sądzie te
          argumenty padają - ale żeby do tego doprowadzić, trzeba wiedzieć, jak je
          obalić.
        </p>
        <p>
          W oweme specjalizujemy się właśnie w takich przypadkach. Działamy w
          modelu <strong>success fee</strong> - zero opłat z góry, koszty sądowe po
          naszej stronie. Jeśli Twoja sprawa nie ma podstaw - powiemy Ci wprost i
          bezpłatnie. Jeśli ma - walczymy.
        </p>
        <DetailCallout tone="green" label="Podsumowanie - co najważniejsze">
          Jedna rezerwacja + opóźnienie 3h+ na celu końcowym = prawo do
          odszkodowania 250-600 € na osobę. Linia odpowiada za całą trasę - nie
          tylko za opóźniony odcinek. Awaria techniczna i krótki czas przesiadki
          to w większości spraw argumenty linii, które odpadają prawnie. Zbieraj
          dokumenty obu lotów. Masz 3 lata. Sprawdzenie nic nie kosztuje.
        </DetailCallout>
      </DetailSection>
    </>
  );
}

function CompactDisruptionDetails({ content }: { content: CompactDetail }) {
  return (
    <DetailSection title={content.title}>
      <p>{content.lead}</p>
      <div className={styles.compactGrid}>
        {content.sections.map((section) => (
          <article className={styles.compactItem} key={section.title}>
            <h5>{section.title}</h5>
            <p>{section.text}</p>
          </article>
        ))}
      </div>
      <DetailCallout tone={content.callout.tone} label={content.callout.label}>
        {content.callout.text}
      </DetailCallout>
    </DetailSection>
  );
}

export function AmountChecker() {
  const router = useRouter();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sliderValue, setSliderValue] = useState(50);
  const [activeDisId, setActiveDisId] = useState<DisruptionId>("delay");

  useEffect(() => {
    if (from.length >= 3 && to.length >= 3) {
      const distance = getDistance(from, to);

      if (distance !== null) {
        const nextValue = kmToSlider(distance);
        const timer = window.setTimeout(() => {
          setSliderValue(nextValue);
        }, 0);

        return () => window.clearTimeout(timer);
      }
    }

    return undefined;
  }, [from, to]);

  const currentTier = tierFromSlider(sliderValue);
  const hint = useMemo(() => computeHint(from, to), [from, to]);
  const activeDisruption = DISRUPTIONS.find((item) => item.id === activeDisId) ?? DISRUPTIONS[0];
  const detailTitle =
    activeDisId === "delay"
      ? "Jakie masz prawa gdy Twój lot jest opóźniony?"
      : activeDisId === "cancel"
        ? "Jakie masz prawa gdy Twój lot zostanie odwołany?"
        : activeDisId === "denied"
          ? "Jakie masz prawa gdy odmówiono Ci wejścia na pokład?"
          : activeDisId === "missed"
            ? "Jakie masz prawa gdy nie zdążysz na przesiadkę z powodu opóźnienia?"
            : COMPACT_DETAILS[activeDisId as keyof typeof COMPACT_DETAILS].title;
  const detailLead =
    activeDisId === "delay"
      ? "Poniżej znajdziesz najważniejsze zasady, kwoty i kroki, które warto wykonać jeszcze na lotnisku."
      : activeDisId === "cancel"
        ? "Sprawdź, kiedy odwołanie daje pełne odszkodowanie, jakie masz opcje na lotnisku i jak zabezpieczyć dowody."
        : activeDisId === "denied"
          ? "Zobacz, kiedy overbooking daje pełne odszkodowanie, czym różni się dobrowolna zgoda od przymusowej odmowy i co zrobić przy bramce."
          : activeDisId === "missed"
            ? "Sprawdź, kiedy przesiadka na jednej rezerwacji daje odszkodowanie, jak liczyć opóźnienie na celu końcowym i co zrobić na lotnisku."
            : COMPACT_DETAILS[activeDisId as keyof typeof COMPACT_DETAILS].lead;

  return (
    <section
      id="ile-mozesz"
      className={`${styles.section} ${inter.variable}`}
      aria-label="Ile możesz odzyskać"
    >
      <div className={styles.inner}>
        <div className={styles.secHead}>
          <div className={styles.secEyebrow}>EC 261/2004</div>
          <h2 className={styles.secH2}>Ile możesz odzyskać?</h2>
          <p className={styles.secSub}>
            Wysokość odszkodowania zależy od długości trasy. Wybierz lotnisko
            startowe i docelowe, a checker policzy dystans oraz próg kwoty.
          </p>
        </div>

        <div className={styles.layout}>
          <div className={styles.mainCard}>
            <div className={styles.airportsRowWrap}>
              <div className={styles.airportsRow}>
                <AirportField
                  id="from"
                  label="Lotnisko wylotu"
                  placeholder="np. WAW"
                  value={from}
                  onChange={setFrom}
                />
                <div className={styles.airportsConnectorWrap} aria-hidden="true">
                  <span className={styles.airportsConnector}>
                    <ConnectorIcon />
                  </span>
                </div>
                <AirportField
                  id="to"
                  label="Lotnisko docelowe"
                  placeholder="np. LHR"
                  value={to}
                  onChange={setTo}
                />
              </div>
            </div>

            <div className={styles.amountSection}>
              <div className={styles.amountTop}>
                <span className={styles.amountEyebrow}>Szacowana kwota</span>
                <span className={styles.tierPill}>{currentTier.label}</span>
              </div>
              <div className={styles.amountValue} aria-live="polite">
                <span className={styles.amountSup}>€</span>
                {currentTier.amt}
              </div>
              <p
                className={`${styles.amountHint} ${
                  hint.state === "qualified" ? styles.qualified : ""
                }`}
              >
                {hint.text}
              </p>
            </div>

            <div className={styles.ctaRow}>
              <button
                type="button"
                className={styles.btnCta}
                onClick={() => router.push("/claim")}
              >
                Złóż wniosek
                <ArrowRightIcon />
              </button>
            </div>

            <div className={styles.sliderSection}>
              <DistanceSlider value={sliderValue} onChange={setSliderValue} />
            </div>

            <div className={styles.disclaimer}>
              <InfoIcon />
              <span>
                Kwota wynika z dystansu lotu według progów EC&nbsp;261/2004.
                Ostateczna kwalifikacja zależy też od rodzaju zakłócenia i
                przyczyny opóźnienia.
              </span>
            </div>
          </div>

          <div
            className={styles.disStack}
            role="radiogroup"
            aria-label="Rodzaj zakłócenia lotu"
          >
            {DISRUPTIONS.map((disruption) => (
              <DisruptionCard
                key={disruption.id}
                icon={disruption.icon}
                name={disruption.name}
                desc={disruption.desc}
                badge={disruption.badge}
                controlsId="amount-detail-panel"
                isActive={activeDisId === disruption.id}
                onClick={() => setActiveDisId(disruption.id)}
              />
            ))}
          </div>
        </div>

        <div
          id="amount-detail-panel"
          className={styles.detailPanel}
          aria-live="polite"
          aria-labelledby="amount-detail-title"
        >
          <div className={styles.detailTop}>
            <span className={styles.detailEyebrow}>Wybrany problem: {activeDisruption.name}</span>
            <h3 id="amount-detail-title">{detailTitle}</h3>
            <p>{detailLead}</p>
          </div>

          {activeDisId === "delay" ? (
            <DelayDetails />
          ) : activeDisId === "cancel" ? (
            <CancelDetails />
          ) : activeDisId === "denied" ? (
            <DeniedDetails />
          ) : activeDisId === "missed" ? (
            <MissedConnectionDetails />
          ) : (
            <CompactDisruptionDetails
              content={COMPACT_DETAILS[activeDisId as keyof typeof COMPACT_DETAILS]}
            />
          )}
        </div>
      </div>
    </section>
  );
}
