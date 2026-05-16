export interface Step {
  id: number;
  num: string;
  title: string;
  desc: string;
  tags: { label: string; variant: "ember" | "green" }[];
}

export const STEPS: Step[] = [
  {
    id: 0,
    num: "01",
    title: "Podaj numer lotu lub trasę",
    desc: "Wpisujesz numer lotu lub lotnisko wylotu i docelowe. System natychmiast szacuje kwotę odszkodowania na podstawie dystansu trasy i progów EC 261/2004.",
    tags: [
      { label: "Weryfikacja w 60 sek.", variant: "ember" },
      { label: "Bez rejestracji", variant: "ember" },
      { label: "Bezpłatne", variant: "green" },
    ],
  },
  {
    id: 1,
    num: "02",
    title: "Sprawdzamy kwalifikację i kwotę",
    desc: "Prawnicy oweme weryfikują lot, przyczynę zakłócenia i odległość trasy. Na tej podstawie ustalamy dokładną kwotę - 250 €, 400 € lub 600 € - i informujemy Cię o szansach na wygraną.",
    tags: [
      { label: "EC 261/2004", variant: "ember" },
      { label: "3 progi kwot", variant: "ember" },
      { label: "Analiza bezpłatna", variant: "green" },
    ],
  },
  {
    id: 2,
    num: "03",
    title: "Prawnicy przejmują korespondencję",
    desc: "Adwokaci i radcowie prawni oweme wysyłają wezwanie do zapłaty, negocjują z linią i - jeśli ta odmawia - składają pozew lub wniosek do ULC. Nie musisz nic robić.",
    tags: [
      { label: "Wezwanie do zapłaty", variant: "ember" },
      { label: "ULC lub sąd", variant: "ember" },
      { label: "Koszty po naszej stronie", variant: "green" },
    ],
  },
  {
    id: 3,
    num: "04",
    title: "Otrzymujesz przelew, my prowizję",
    desc: "Po wyegzekwowaniu odszkodowania przelewamy Ci pełną kwotę pomniejszoną o prowizję. Jeśli sprawa zakończy się przegraną - nie płacisz nam nic.",
    tags: [
      { label: "25% pozasądowo", variant: "ember" },
      { label: "45% sądowo", variant: "ember" },
      { label: "Przegrana = 0 zł", variant: "green" },
    ],
  },
];
