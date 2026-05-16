export const ROUTES: Record<string, number> = {
  "WAW-BER": 559,
  "WAW-VIE": 523,
  "WAW-PRG": 516,
  "WAW-BUD": 542,
  "WAW-WRO": 270,
  "WAW-KRK": 252,
  "WAW-GDN": 294,
  "WAW-POZ": 308,
  "WAW-LHR": 1447,
  "WAW-CDG": 1365,
  "WAW-AMS": 1145,
  "WAW-MUC": 879,
  "WAW-FCO": 1329,
  "WAW-MAD": 2298,
  "WAW-BCN": 2009,
  "WAW-ATH": 1733,
  "WAW-IST": 1581,
  "WAW-LIS": 2863,
  "WAW-DXB": 4227,
  "WAW-DOH": 3979,
  "WAW-BKK": 8317,
  "WAW-SIN": 9280,
  "WAW-JFK": 7041,
  "WAW-ORD": 7680,
  "WAW-LAX": 9793,
  "WAW-YYZ": 7221,
  "WAW-NRT": 8919,
  "WAW-SYD": 15978,
  "KRK-LHR": 1556,
  "KRK-CDG": 1472,
  "KRK-AMS": 1248,
  "KRK-DXB": 4086,
  "GDN-LHR": 1290,
  "GDN-CDG": 1198,
};

export const TIERS = [
  { threshold: 33, maxKm: 1500, label: "do 1 500 km", amt: 250 },
  { threshold: 67, maxKm: 3500, label: "1 500 - 3 500 km", amt: 400 },
  { threshold: 100, maxKm: 99999, label: "powyżej 3 500 km", amt: 600 },
] as const;

export type Tier = (typeof TIERS)[number];
export type HintState = "idle" | "qualified" | "no-data";

export function getDistance(from: string, to: string): number | null {
  const normalizedFrom = from.trim().toUpperCase();
  const normalizedTo = to.trim().toUpperCase();
  const key = `${normalizedFrom}-${normalizedTo}`;
  const reverseKey = `${normalizedTo}-${normalizedFrom}`;

  return ROUTES[key] ?? ROUTES[reverseKey] ?? null;
}

export function tierFromSlider(value: number): Tier {
  return TIERS.find((tier) => value <= tier.threshold) ?? TIERS[2];
}

export function tierFromKm(km: number): Tier {
  return TIERS.find((tier) => km <= tier.maxKm) ?? TIERS[2];
}

export function kmToSlider(km: number): number {
  if (km <= 1500) return Math.round((km / 1500) * 33);
  if (km <= 3500) return Math.round(33 + ((km - 1500) / 2000) * 34);

  return Math.round(67 + Math.min(((km - 3500) / 6500) * 33, 33));
}

export function computeHint(from: string, to: string) {
  if (from.length < 3 || to.length < 3) {
    return {
      state: "idle" as const,
      text: "Wpisz lotniska, a przeliczymy dystans i próg odszkodowania.",
    };
  }

  const distance = getDistance(from, to);

  if (distance === null) {
    return {
      state: "no-data" as const,
      text: "Nie mamy tej trasy w kalkulatorze MVP. Możesz nadal użyć suwaka.",
    };
  }

  const tier = tierFromKm(distance);

  return {
    state: "qualified" as const,
    text: `${from} - ${to}: ${distance.toLocaleString("pl-PL")} km. Próg: ${tier.label}.`,
  };
}
