export interface Airport {
  iata: string;
  name: string;
  city: string;
  country: string;
  flag: string;
  lat: number;
  lon: number;
}

export interface Airline {
  iata: string;
  name: string;
}

export type Disruption = "delay" | "cancel" | "denied";
export type DelayHours = "3plus" | "less3" | "never";

export const AIRPORTS: readonly Airport[] = [
  { iata: "WAW", name: "Warszawa Chopina", city: "Warszawa", country: "Polska", flag: "🇵🇱", lat: 52.1657, lon: 20.9671 },
  { iata: "WMI", name: "Warszawa Modlin", city: "Nowy Dwór Mazowiecki", country: "Polska", flag: "🇵🇱", lat: 52.4511, lon: 20.6518 },
  { iata: "KRK", name: "Kraków Balice", city: "Kraków", country: "Polska", flag: "🇵🇱", lat: 50.0777, lon: 19.7848 },
  { iata: "GDN", name: "Gdańsk im. Lecha Wałęsy", city: "Gdańsk", country: "Polska", flag: "🇵🇱", lat: 54.3776, lon: 18.4662 },
  { iata: "WRO", name: "Wrocław Strachowice", city: "Wrocław", country: "Polska", flag: "🇵🇱", lat: 51.1027, lon: 16.8858 },
  { iata: "POZ", name: "Poznań Ławica", city: "Poznań", country: "Polska", flag: "🇵🇱", lat: 52.421, lon: 16.8263 },
  { iata: "KTW", name: "Katowice Pyrzowice", city: "Katowice", country: "Polska", flag: "🇵🇱", lat: 50.4743, lon: 19.08 },
  { iata: "LCJ", name: "Łódź Lublinek", city: "Łódź", country: "Polska", flag: "🇵🇱", lat: 51.7219, lon: 19.3981 },
  { iata: "RZE", name: "Rzeszów Jasionka", city: "Rzeszów", country: "Polska", flag: "🇵🇱", lat: 50.11, lon: 22.019 },
  { iata: "SZZ", name: "Szczecin Goleniów", city: "Szczecin", country: "Polska", flag: "🇵🇱", lat: 53.5847, lon: 14.9022 },
  { iata: "LUZ", name: "Lublin", city: "Lublin", country: "Polska", flag: "🇵🇱", lat: 51.2403, lon: 22.7136 },
  { iata: "BZG", name: "Bydgoszcz Szwederowo", city: "Bydgoszcz", country: "Polska", flag: "🇵🇱", lat: 53.0968, lon: 17.9777 },
  { iata: "LHR", name: "London Heathrow", city: "Londyn", country: "Wielka Brytania", flag: "🇬🇧", lat: 51.47, lon: -0.4543 },
  { iata: "LGW", name: "London Gatwick", city: "Londyn", country: "Wielka Brytania", flag: "🇬🇧", lat: 51.1537, lon: -0.1821 },
  { iata: "STN", name: "London Stansted", city: "Londyn", country: "Wielka Brytania", flag: "🇬🇧", lat: 51.885, lon: 0.235 },
  { iata: "CDG", name: "Paris Charles de Gaulle", city: "Paryż", country: "Francja", flag: "🇫🇷", lat: 49.0097, lon: 2.5479 },
  { iata: "ORY", name: "Paris Orly", city: "Paryż", country: "Francja", flag: "🇫🇷", lat: 48.7233, lon: 2.3794 },
  { iata: "AMS", name: "Amsterdam Schiphol", city: "Amsterdam", country: "Holandia", flag: "🇳🇱", lat: 52.3105, lon: 4.7683 },
  { iata: "FRA", name: "Frankfurt am Main", city: "Frankfurt", country: "Niemcy", flag: "🇩🇪", lat: 50.0379, lon: 8.5622 },
  { iata: "MAD", name: "Madrid Barajas", city: "Madryt", country: "Hiszpania", flag: "🇪🇸", lat: 40.4983, lon: -3.5676 },
  { iata: "FCO", name: "Rome Fiumicino", city: "Rzym", country: "Włochy", flag: "🇮🇹", lat: 41.8003, lon: 12.2389 },
  { iata: "BCN", name: "Barcelona El Prat", city: "Barcelona", country: "Hiszpania", flag: "🇪🇸", lat: 41.2974, lon: 2.0833 },
  { iata: "VIE", name: "Vienna International", city: "Wiedeń", country: "Austria", flag: "🇦🇹", lat: 48.1103, lon: 16.5697 },
  { iata: "ZRH", name: "Zurich Airport", city: "Zurych", country: "Szwajcaria", flag: "🇨🇭", lat: 47.4581, lon: 8.5555 },
  { iata: "MUC", name: "Munich Airport", city: "Monachium", country: "Niemcy", flag: "🇩🇪", lat: 48.3538, lon: 11.7861 },
  { iata: "ARN", name: "Stockholm Arlanda", city: "Sztokholm", country: "Szwecja", flag: "🇸🇪", lat: 59.6498, lon: 17.9238 },
  { iata: "CPH", name: "Copenhagen Airport", city: "Kopenhaga", country: "Dania", flag: "🇩🇰", lat: 55.618, lon: 12.6561 },
  { iata: "OSL", name: "Oslo Gardermoen", city: "Oslo", country: "Norwegia", flag: "🇳🇴", lat: 60.1939, lon: 11.1004 },
  { iata: "HEL", name: "Helsinki Vantaa", city: "Helsinki", country: "Finlandia", flag: "🇫🇮", lat: 60.3172, lon: 24.9633 },
  { iata: "DUB", name: "Dublin Airport", city: "Dublin", country: "Irlandia", flag: "🇮🇪", lat: 53.4213, lon: -6.2701 },
  { iata: "BRU", name: "Brussels Airport", city: "Bruksela", country: "Belgia", flag: "🇧🇪", lat: 50.9014, lon: 4.4844 },
  { iata: "LIS", name: "Lisbon Humberto Delgado", city: "Lizbona", country: "Portugalia", flag: "🇵🇹", lat: 38.7742, lon: -9.1342 },
  { iata: "ATH", name: "Athens International", city: "Ateny", country: "Grecja", flag: "🇬🇷", lat: 37.9364, lon: 23.9445 },
  { iata: "PRG", name: "Prague Václav Havel", city: "Praga", country: "Czechy", flag: "🇨🇿", lat: 50.1008, lon: 14.26 },
  { iata: "BUD", name: "Budapest Ferenc Liszt", city: "Budapeszt", country: "Węgry", flag: "🇭🇺", lat: 47.4298, lon: 19.2611 },
  { iata: "BER", name: "Berlin Brandenburg", city: "Berlin", country: "Niemcy", flag: "🇩🇪", lat: 52.3667, lon: 13.5033 },
  { iata: "HAM", name: "Hamburg Airport", city: "Hamburg", country: "Niemcy", flag: "🇩🇪", lat: 53.6304, lon: 9.9882 },
  { iata: "DUS", name: "Düsseldorf Airport", city: "Düsseldorf", country: "Niemcy", flag: "🇩🇪", lat: 51.2895, lon: 6.7668 },
  { iata: "MXP", name: "Milan Malpensa", city: "Mediolan", country: "Włochy", flag: "🇮🇹", lat: 45.63, lon: 8.7231 },
  { iata: "VCE", name: "Venice Marco Polo", city: "Wenecja", country: "Włochy", flag: "🇮🇹", lat: 45.5053, lon: 12.3519 },
  { iata: "NAP", name: "Naples International", city: "Neapol", country: "Włochy", flag: "🇮🇹", lat: 40.8845, lon: 14.2908 },
  { iata: "PMI", name: "Palma de Mallorca", city: "Palma", country: "Hiszpania", flag: "🇪🇸", lat: 39.5517, lon: 2.7388 },
  { iata: "AGP", name: "Málaga Costa del Sol", city: "Malaga", country: "Hiszpania", flag: "🇪🇸", lat: 36.6749, lon: -4.4991 },
  { iata: "ALC", name: "Alicante Elche", city: "Alicante", country: "Hiszpania", flag: "🇪🇸", lat: 38.2822, lon: -0.5582 },
  { iata: "NCE", name: "Nice Côte d'Azur", city: "Nicea", country: "Francja", flag: "🇫🇷", lat: 43.6653, lon: 7.215 },
  { iata: "LYS", name: "Lyon Saint Exupéry", city: "Lyon", country: "Francja", flag: "🇫🇷", lat: 45.7256, lon: 5.0811 },
  { iata: "IST", name: "Istanbul Airport", city: "Stambuł", country: "Turcja", flag: "🇹🇷", lat: 41.2753, lon: 28.7519 },
  { iata: "SAW", name: "Istanbul Sabiha Gökçen", city: "Stambuł", country: "Turcja", flag: "🇹🇷", lat: 40.8986, lon: 29.3092 },
  { iata: "DXB", name: "Dubai International", city: "Dubaj", country: "ZEA", flag: "🇦🇪", lat: 25.2532, lon: 55.3657 },
  { iata: "DOH", name: "Hamad International", city: "Doha", country: "Katar", flag: "🇶🇦", lat: 25.2731, lon: 51.6081 },
  { iata: "JFK", name: "New York JFK", city: "Nowy Jork", country: "USA", flag: "🇺🇸", lat: 40.6413, lon: -73.7781 },
  { iata: "EWR", name: "Newark Liberty", city: "Newark", country: "USA", flag: "🇺🇸", lat: 40.6895, lon: -74.1745 },
  { iata: "LAX", name: "Los Angeles International", city: "Los Angeles", country: "USA", flag: "🇺🇸", lat: 33.9416, lon: -118.4085 },
  { iata: "ORD", name: "Chicago O'Hare", city: "Chicago", country: "USA", flag: "🇺🇸", lat: 41.9742, lon: -87.9073 },
  { iata: "BKK", name: "Bangkok Suvarnabhumi", city: "Bangkok", country: "Tajlandia", flag: "🇹🇭", lat: 13.69, lon: 100.7501 },
  { iata: "SIN", name: "Singapore Changi", city: "Singapur", country: "Singapur", flag: "🇸🇬", lat: 1.3644, lon: 103.9915 },
] as const;

export const AIRLINES: readonly Airline[] = [
  { iata: "LO", name: "LOT Polish Airlines" },
  { iata: "FR", name: "Ryanair" },
  { iata: "W6", name: "Wizz Air" },
  { iata: "U2", name: "easyJet" },
  { iata: "LH", name: "Lufthansa" },
  { iata: "KL", name: "KLM" },
  { iata: "AF", name: "Air France" },
  { iata: "BA", name: "British Airways" },
  { iata: "EK", name: "Emirates" },
  { iata: "TK", name: "Turkish Airlines" },
  { iata: "QR", name: "Qatar Airways" },
  { iata: "OS", name: "Austrian Airlines" },
  { iata: "LX", name: "Swiss" },
  { iata: "SK", name: "SAS Scandinavian Airlines" },
  { iata: "DY", name: "Norwegian" },
  { iata: "TP", name: "TAP Air Portugal" },
  { iata: "IB", name: "Iberia" },
  { iata: "VY", name: "Vueling" },
  { iata: "AZ", name: "ITA Airways" },
  { iata: "A3", name: "Aegean Airlines" },
  { iata: "AY", name: "Finnair" },
  { iata: "SN", name: "Brussels Airlines" },
  { iata: "EW", name: "Eurowings" },
  { iata: "HV", name: "Transavia" },
  { iata: "EI", name: "Aer Lingus" },
  { iata: "VS", name: "Virgin Atlantic" },
  { iata: "UA", name: "United Airlines" },
  { iata: "DL", name: "Delta Air Lines" },
  { iata: "AA", name: "American Airlines" },
  { iata: "AC", name: "Air Canada" },
] as const;

export function searchAirports(query: string) {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return AIRPORTS.slice(0, 8);
  }

  return AIRPORTS.filter((airport) => {
    const haystack = `${airport.iata} ${airport.name} ${airport.city} ${airport.country}`.toLowerCase();
    return haystack.includes(normalized);
  }).slice(0, 12);
}

export function searchAirlines(query: string) {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return AIRLINES.slice(0, 8);
  }

  return AIRLINES.filter((airline) => {
    const haystack = `${airline.iata} ${airline.name}`.toLowerCase();
    return haystack.includes(normalized);
  }).slice(0, 12);
}

export function findAirport(iata: string | null | undefined) {
  const normalized = iata?.trim().toUpperCase();
  return AIRPORTS.find((airport) => airport.iata === normalized) ?? null;
}

export function findAirline(value: string | null | undefined) {
  const normalized = value?.trim().toLowerCase();

  if (!normalized) {
    return null;
  }

  return (
    AIRLINES.find(
      (airline) =>
        airline.iata.toLowerCase() === normalized ||
        airline.name.toLowerCase() === normalized,
    ) ?? null
  );
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function distanceKm(from: Airport, to: Airport) {
  const earthRadiusKm = 6371;
  const deltaLat = toRadians(to.lat - from.lat);
  const deltaLon = toRadians(to.lon - from.lon);
  const fromLat = toRadians(from.lat);
  const toLat = toRadians(to.lat);
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(fromLat) *
      Math.cos(toLat) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function compensationAmount(fromCode: string, toCode: string) {
  const from = findAirport(fromCode);
  const to = findAirport(toCode);

  if (!from || !to) {
    return 400;
  }

  const distance = distanceKm(from, to);

  if (distance < 1500) {
    return 250;
  }

  if (distance <= 3500) {
    return 400;
  }

  return 600;
}
