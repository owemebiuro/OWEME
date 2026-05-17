import {
  ApiDataSource,
  BlogPostStatus,
  ClaimAmountCategory,
  ClaimSource,
  ClaimStatus,
  ClaimType,
  CommissionModel,
  FlightStatus,
  Prisma,
  PrismaClient,
  SettlementStatus,
  UserRole,
} from "@prisma/client";

import { airlineCrmData } from "../lib/airlines/airline-crm-data";
import { getAirlinePrismaData } from "../lib/airlines/airline-prisma";

const prisma = new PrismaClient();

const ids = {
  users: {
    admin: "seed-user-admin",
    operator1: "seed-user-operator-1",
    operator2: "seed-user-operator-2",
    lawyer: "seed-user-lawyer",
    readOnly: "seed-user-read-only",
  },
  airlines: {
    lot: "seed-airline-lot",
    ryanair: "seed-airline-ryanair",
    wizzAir: "seed-airline-wizz-air",
  },
  clients: {
    client1: "seed-client-jan-kowalski",
    client2: "seed-client-marta-zielinska",
    client3: "seed-client-tomasz-wisniewski",
  },
  flights: {
    lo123: "seed-flight-lo123-2024-03-15",
    fr456: "seed-flight-fr456-2024-04-02",
    w6789: "seed-flight-w6789-2024-05-10",
  },
  claims: {
    new: "seed-claim-new",
    qualified: "seed-claim-qualified",
    demandSent: "seed-claim-demand-letter-sent",
    courtStage: "seed-claim-court-stage",
    closedPaid: "seed-claim-closed-paid",
  },
  payouts: {
    closedPaid: "seed-payout-closed-paid",
  },
} as const;

function date(value: string) {
  return new Date(value);
}

async function seedUsers() {
  const users = [
    {
      id: ids.users.admin,
      email: "admin@oweme.pl",
      name: "Admin OWEME",
      role: UserRole.ADMIN,
    },
    {
      id: ids.users.operator1,
      email: "operator1@oweme.pl",
      name: "Anna Kowalska",
      role: UserRole.OPERATOR,
    },
    {
      id: ids.users.operator2,
      email: "operator2@oweme.pl",
      name: "Marek Nowak",
      role: UserRole.OPERATOR,
    },
    {
      id: ids.users.lawyer,
      email: "prawnik@oweme.pl",
      name: "Piotr Wiśniewski",
      role: UserRole.LAWYER,
    },
    {
      id: ids.users.readOnly,
      email: "readonly@oweme.pl",
      name: "Zarząd",
      role: UserRole.READ_ONLY,
    },
  ];

  await Promise.all(
    users.map((user) =>
      prisma.user.upsert({
        where: { email: user.email },
        update: {
          name: user.name,
          role: user.role,
          isActive: true,
        },
        create: {
          ...user,
          isActive: true,
        },
      }),
    ),
  );
}

async function seedAirlines() {
  const seedAirlineId = (iataCode: string) => {
    if (iataCode === "LO") return ids.airlines.lot;
    if (iataCode === "FR") return ids.airlines.ryanair;
    if (iataCode === "W6") return ids.airlines.wizzAir;

    return `seed-airline-${iataCode.toLowerCase()}`;
  };

  await Promise.all(
    airlineCrmData.map((airline) =>
      prisma.airline.upsert({
        where: { iataCode: airline.iata },
        update: getAirlinePrismaData(airline.iata),
        create: {
          id: seedAirlineId(airline.iata),
          iataCode: airline.iata,
          ...getAirlinePrismaData(airline.iata),
        },
      }),
    ),
  );
}

async function seedClients() {
  const clients = [
    {
      id: ids.clients.client1,
      firstName: "Jan",
      lastName: "Kowalski",
      email: "jan.kowalski@example.com",
      phone: "+48 501 234 567",
      nationality: "PL",
      address: "ul. Marszałkowska 10/5",
      postalCode: "00-590",
      city: "Warszawa",
      country: "PL",
      idDocumentNumber: "ABC123456",
    },
    {
      id: ids.clients.client2,
      firstName: "Marta",
      lastName: "Zielińska",
      email: "marta.zielinska@example.com",
      phone: "+48 602 345 678",
      nationality: "PL",
      address: "ul. Długa 18",
      postalCode: "31-147",
      city: "Kraków",
      country: "PL",
      idDocumentNumber: "DEF654321",
    },
    {
      id: ids.clients.client3,
      firstName: "Tomasz",
      lastName: "Wiśniewski",
      email: "tomasz.wisniewski@example.com",
      phone: "+48 733 456 789",
      nationality: "PL",
      address: "ul. Piotrkowska 120",
      postalCode: "90-006",
      city: "Łódź",
      country: "PL",
      idDocumentNumber: "GHI789012",
    },
  ];

  await Promise.all(
    clients.map((client) =>
      prisma.client.upsert({
        where: { id: client.id },
        update: {
          firstName: client.firstName,
          lastName: client.lastName,
          email: client.email,
          phone: client.phone,
          nationality: client.nationality,
          address: client.address,
          postalCode: client.postalCode,
          city: client.city,
          country: client.country,
          idDocumentNumber: client.idDocumentNumber,
          status: "ACTIVE",
        },
        create: {
          ...client,
          status: "ACTIVE",
        },
      }),
    ),
  );
}

async function seedFlights() {
  const flights: Prisma.FlightUncheckedCreateInput[] = [
    {
      id: ids.flights.lo123,
      flightNumber: "LO123",
      flightDate: date("2024-03-15T00:00:00.000Z"),
      departureAirportCode: "WAW",
      arrivalAirportCode: "LHR",
      departureCountry: "PL",
      arrivalCountry: "GB",
      scheduledDeparture: date("2024-03-15T06:45:00.000Z"),
      actualDeparture: date("2024-03-15T10:45:00.000Z"),
      scheduledArrival: date("2024-03-15T08:35:00.000Z"),
      actualArrival: date("2024-03-15T12:35:00.000Z"),
      delayMinutes: 240,
      flightStatus: FlightStatus.LANDED,
      distanceKm: 1470,
      amountCategory: ClaimAmountCategory.EUR_400,
      dataSource: ApiDataSource.MANUAL,
      airlineId: ids.airlines.lot,
    },
    {
      id: ids.flights.fr456,
      flightNumber: "FR456",
      flightDate: date("2024-04-02T00:00:00.000Z"),
      departureAirportCode: "KTW",
      arrivalAirportCode: "BCN",
      departureCountry: "PL",
      arrivalCountry: "ES",
      scheduledDeparture: date("2024-04-02T11:20:00.000Z"),
      scheduledArrival: date("2024-04-02T14:00:00.000Z"),
      delayMinutes: null,
      flightStatus: FlightStatus.CANCELLED,
      distanceKm: 1675,
      amountCategory: ClaimAmountCategory.EUR_400,
      dataSource: ApiDataSource.MANUAL,
      airlineId: ids.airlines.ryanair,
    },
    {
      id: ids.flights.w6789,
      flightNumber: "W6789",
      flightDate: date("2024-05-10T00:00:00.000Z"),
      departureAirportCode: "WAW",
      arrivalAirportCode: "CIA",
      departureCountry: "PL",
      arrivalCountry: "IT",
      scheduledDeparture: date("2024-05-10T15:10:00.000Z"),
      scheduledArrival: date("2024-05-10T17:25:00.000Z"),
      delayMinutes: null,
      flightStatus: FlightStatus.UNKNOWN,
      distanceKm: 1320,
      amountCategory: ClaimAmountCategory.EUR_400,
      dataSource: ApiDataSource.MANUAL,
      airlineId: ids.airlines.wizzAir,
    },
  ];

  await Promise.all(
    flights.map((flight) =>
      prisma.flight.upsert({
        where: {
          flightNumber_flightDate: {
            flightNumber: flight.flightNumber,
            flightDate: flight.flightDate,
          },
        },
        update: {
          departureAirportCode: flight.departureAirportCode,
          arrivalAirportCode: flight.arrivalAirportCode,
          departureCountry: flight.departureCountry,
          arrivalCountry: flight.arrivalCountry,
          scheduledDeparture: flight.scheduledDeparture,
          actualDeparture: flight.actualDeparture,
          scheduledArrival: flight.scheduledArrival,
          actualArrival: flight.actualArrival,
          delayMinutes: flight.delayMinutes,
          flightStatus: flight.flightStatus,
          distanceKm: flight.distanceKm,
          amountCategory: flight.amountCategory,
          dataSource: flight.dataSource,
          airlineId: flight.airlineId,
        },
        create: flight,
      }),
    ),
  );
}

async function seedClaims() {
  const claims: Prisma.ClaimUncheckedCreateInput[] = [
    {
      id: ids.claims.new,
      claimNumber: "OWE-2024-0001",
      type: ClaimType.DELAY,
      source: ClaimSource.WEBSITE_FORM,
      status: ClaimStatus.NEW,
      ownerId: null,
      creatorId: ids.users.admin,
      clientId: ids.clients.client1,
      flightId: ids.flights.lo123,
      airlineId: ids.airlines.lot,
      potentialAmount: "400.00",
      estimatedFee: "120.00",
      commissionModel: CommissionModel.STANDARD_30,
      dataCompleteness: 45,
    },
    {
      id: ids.claims.qualified,
      claimNumber: "OWE-2024-0002",
      type: ClaimType.CANCELLATION,
      source: ClaimSource.CHECKER_FORM,
      status: ClaimStatus.QUALIFIED,
      ownerId: ids.users.operator1,
      creatorId: ids.users.operator1,
      clientId: ids.clients.client2,
      flightId: ids.flights.fr456,
      airlineId: ids.airlines.ryanair,
      potentialAmount: "400.00",
      estimatedFee: "120.00",
      commissionModel: CommissionModel.STANDARD_30,
      dataCompleteness: 80,
      qualifiedAt: date("2024-04-04T09:15:00.000Z"),
    },
    {
      id: ids.claims.demandSent,
      claimNumber: "OWE-2024-0003",
      type: ClaimType.DELAY,
      source: ClaimSource.MANUAL,
      status: ClaimStatus.DEMAND_LETTER_SENT,
      ownerId: ids.users.operator2,
      creatorId: ids.users.operator2,
      clientId: ids.clients.client3,
      flightId: ids.flights.w6789,
      airlineId: ids.airlines.wizzAir,
      potentialAmount: "400.00",
      estimatedFee: "120.00",
      commissionModel: CommissionModel.STANDARD_30,
      dataCompleteness: 90,
      qualifiedAt: date("2024-05-12T10:00:00.000Z"),
    },
    {
      id: ids.claims.courtStage,
      claimNumber: "OWE-2024-0004",
      type: ClaimType.DENIED_BOARDING,
      source: ClaimSource.IMPORT,
      status: ClaimStatus.COURT_STAGE,
      ownerId: ids.users.lawyer,
      creatorId: ids.users.operator1,
      clientId: ids.clients.client1,
      flightId: ids.flights.fr456,
      airlineId: ids.airlines.ryanair,
      potentialAmount: "400.00",
      estimatedFee: "160.00",
      commissionModel: CommissionModel.COURT_40,
      isCourtStage: true,
      dataCompleteness: 100,
      qualifiedAt: date("2024-04-08T12:30:00.000Z"),
    },
    {
      id: ids.claims.closedPaid,
      claimNumber: "OWE-2024-0005",
      type: ClaimType.DELAY,
      source: ClaimSource.WEBSITE_FORM,
      status: ClaimStatus.CLOSED_PAID,
      ownerId: ids.users.operator1,
      creatorId: ids.users.admin,
      clientId: ids.clients.client2,
      flightId: ids.flights.lo123,
      airlineId: ids.airlines.lot,
      potentialAmount: "400.00",
      estimatedFee: "120.00",
      commissionModel: CommissionModel.STANDARD_30,
      dataCompleteness: 100,
      qualifiedAt: date("2024-03-18T08:00:00.000Z"),
      closedAt: date("2024-06-01T10:00:00.000Z"),
      closeReason: "Odszkodowanie wypłacone i rozliczone z klientem.",
    },
  ];

  await Promise.all(
    claims.map((claim) =>
      prisma.claim.upsert({
        where: { claimNumber: claim.claimNumber },
        update: {
          type: claim.type,
          source: claim.source,
          status: claim.status,
          ownerId: claim.ownerId,
          creatorId: claim.creatorId,
          clientId: claim.clientId,
          flightId: claim.flightId,
          airlineId: claim.airlineId,
          potentialAmount: claim.potentialAmount,
          estimatedFee: claim.estimatedFee,
          commissionModel: claim.commissionModel,
          isCourtStage: claim.isCourtStage ?? false,
          dataCompleteness: claim.dataCompleteness,
          qualifiedAt: claim.qualifiedAt,
          closedAt: claim.closedAt,
          closeReason: claim.closeReason,
        },
        create: claim,
      }),
    ),
  );
}

async function seedPayouts() {
  await prisma.payout.upsert({
    where: { id: ids.payouts.closedPaid },
    update: {
      claimId: ids.claims.closedPaid,
      amountRecovered: "400.00",
      currency: "EUR",
      receivedAt: date("2024-05-20T09:00:00.000Z"),
      owemeFee: "120.00",
      commissionModel: CommissionModel.STANDARD_30,
      clientAmount: "280.00",
      clientPaidAt: date("2024-06-01T10:00:00.000Z"),
      status: SettlementStatus.COMPLETED,
      notes: "Rozliczenie testowe dla sprawy zamkniętej.",
    },
    create: {
      id: ids.payouts.closedPaid,
      claimId: ids.claims.closedPaid,
      amountRecovered: "400.00",
      currency: "EUR",
      receivedAt: date("2024-05-20T09:00:00.000Z"),
      owemeFee: "120.00",
      commissionModel: CommissionModel.STANDARD_30,
      clientAmount: "280.00",
      clientPaidAt: date("2024-06-01T10:00:00.000Z"),
      status: SettlementStatus.COMPLETED,
      notes: "Rozliczenie testowe dla sprawy zamkniętej.",
    },
  });
}

async function seedBlogPosts() {
  const posts = [
    {
      id: "seed-blog-we261",
      slug: "we-261-2004-odszkodowanie-za-opozniony-lot",
      title: "WE 261/2004: Jak uzyskać odszkodowanie za opóźniony lot?",
      content: `Rozporządzenie WE 261/2004 to jedna z najważniejszych regulacji chroniących prawa pasażerów lotniczych w Unii Europejskiej. Jeśli Twój lot był opóźniony o co najmniej 3 godziny, odwołany lub zostałeś pozbawiony miejsca na pokładzie, możesz ubiegać się o odszkodowanie w wysokości od 250 do 600 euro.

Kiedy przysługuje odszkodowanie?

Masz prawo do odszkodowania, jeśli spełniony jest co najmniej jeden z poniższych warunków:
- Twój lot wyleciał z lotniska na terenie UE
- Twój lot przyleciał do UE i był obsługiwany przez europejskiego przewoźnika

Opóźnienie musi wynosić co najmniej 3 godziny przy przylecie do celu.

Ile wynosi odszkodowanie?

Wysokość odszkodowania zależy od długości trasy:
- Do 1500 km: 250 euro
- 1500–3500 km: 400 euro
- Powyżej 3500 km: 600 euro

Jak złożyć wniosek?

Możesz samodzielnie napisać do linii lotniczej lub skorzystać z pomocy profesjonalnej firmy, która zajmie się całą procedurą za Ciebie. OWEME działa na zasadzie success fee — płacisz tylko wtedy, gdy wygramy.`,
      excerpt:
        "Rozporządzenie unijne daje Ci prawo do nawet 600 euro za opóźniony lub odwołany lot. Wyjaśniamy kiedy, jak i od kogo możesz to odzyskać.",
      category: "Prawa pasażera",
      tags: "WE 261/2004, odszkodowanie, opóźnienie, prawa pasażera",
      authorName: "Redakcja OWEME",
      authorRole: "Eksperci ds. praw pasażerów",
      authorBio:
        "Zespół OWEME specjalizuje się w dochodzeniu odszkodowań lotniczych od 2020 roku. Wygraliśmy tysiące spraw dla polskich pasażerów.",
      imageAlt: "Samolot na tle zachodzącego słońca — symbol opóźnionego lotu",
      focusKeyword: "odszkodowanie za opóźniony lot",
      metaTitle: "Odszkodowanie za opóźniony lot WE 261/2004 | OWEME",
      metaDescription:
        "Dowiedz się, kiedy i jak uzyskać do 600 euro odszkodowania za opóźniony lub odwołany lot zgodnie z rozporządzeniem WE 261/2004.",
      ogTitle: "Odszkodowanie za opóźniony lot — kompletny poradnik",
      ogDescription:
        "WE 261/2004 gwarantuje Ci odszkodowanie. Sprawdź, czy kwalifikujesz się w 30 sekund.",
      canonicalUrl: "https://oweme.pl/twoje-prawa/we-261-2004-odszkodowanie-za-opozniony-lot",
      noindex: false,
      readTime: 4,
      status: BlogPostStatus.PUBLISHED,
      publishedAt: new Date("2025-01-15T10:00:00.000Z"),
      createdById: ids.users.admin,
    },
    {
      id: "seed-blog-overbooking",
      slug: "overbooking-odmowa-boardingu-odszkodowanie",
      title: "Overbooking i odmowa boardingu — co Ci się należy?",
      content: `Overbooking (nadsprzedaż miejsc) to praktyka powszechnie stosowana przez linie lotnicze. Gdy na pokładzie zabraknie miejsca, pasażer może zostać poproszony o dobrowolne lub przymusowe opuszczenie lotu. W obu przypadkach przysługują Ci określone prawa.

Dobrowolna odmowa boardingu

Jeśli zgadzasz się na późniejszy lot, możesz negocjować rekompensatę z linią lotniczą. Nie podlega ona przepisom WE 261/2004, więc linia może zaproponować vouchery lub gotówkę.

Przymusowa odmowa boardingu

Jeśli zostałeś usunięty z lotu bez zgody, masz prawo do:
- Odszkodowania 250–600 euro (w zależności od długości trasy)
- Zwrotu pełnej ceny biletu lub alternatywnego połączenia
- Opieki: posiłki, napoje, dostęp do komunikacji, nocleg jeśli konieczny

Jak postąpić na lotnisku?

Nie podpisuj żadnych dokumentów ograniczających Twoje prawa. Poproś o pisemne potwierdzenie przyczyny odmowy boardingu. Zachowaj wszystkie dokumenty — kartę pokładową, potwierdzenie rezerwacji i rachunki za ewentualne dodatkowe koszty.`,
      excerpt:
        "Linia nie wpuściła Cię na pokład? Masz prawo do odszkodowania nawet 600 euro plus zwrot biletu. Wyjaśniamy krok po kroku.",
      category: "Overbooking",
      tags: "overbooking, odmowa boardingu, WE 261/2004, odszkodowanie",
      authorName: "Redakcja OWEME",
      authorRole: "Eksperci ds. praw pasażerów",
      authorBio:
        "Zespół OWEME specjalizuje się w dochodzeniu odszkodowań lotniczych od 2020 roku. Wygraliśmy tysiące spraw dla polskich pasażerów.",
      imageAlt: "Pasażer przy bramce lotniskowej — overbooking",
      focusKeyword: "odmowa boardingu odszkodowanie",
      metaTitle: "Overbooking — odmowa boardingu i odszkodowanie | OWEME",
      metaDescription:
        "Usunięto Cię z lotu z powodu overbookingu? Sprawdź, jakie prawa Ci przysługują i jak ubiegać się o odszkodowanie do 600 euro.",
      ogTitle: "Overbooking — Twoje prawa i odszkodowanie",
      ogDescription:
        "Odmowa boardingu daje Ci prawo do odszkodowania. Sprawdź bezpłatnie, ile możesz dostać.",
      canonicalUrl: "https://oweme.pl/twoje-prawa/overbooking-odmowa-boardingu-odszkodowanie",
      noindex: false,
      readTime: 3,
      status: BlogPostStatus.PUBLISHED,
      publishedAt: new Date("2025-02-03T10:00:00.000Z"),
      createdById: ids.users.admin,
    },
  ];

  await Promise.all(
    posts.map((post) =>
      prisma.blogPost.upsert({
        where: { slug: post.slug },
        update: {
          title: post.title,
          content: post.content,
          excerpt: post.excerpt,
          status: post.status,
          publishedAt: post.publishedAt,
        },
        create: post,
      }),
    ),
  );
}

async function main() {
  await seedUsers();
  await seedAirlines();
  await seedClients();
  await seedFlights();
  await seedClaims();
  await seedPayouts();
  await seedBlogPosts();
}

main()
  .then(async () => {
    console.log("Seed danych testowych OWEME zakończony.");
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Seed danych testowych OWEME nie powiódł się.");
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
