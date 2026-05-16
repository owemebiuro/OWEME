import {
  ApiDataSource,
  ClaimAmountCategory,
  ClaimSource,
  ClaimStatus,
  ClaimType,
  CommissionModel,
  FlightStatus,
  Prisma,
  TaskStatus,
  UserRole,
  type PrismaClient,
} from "@prisma/client";

import { getAirlinePrismaData } from "@/lib/airlines/airline-prisma";
import { COMMISSION_RATES } from "@/lib/constants/fees";
import { distanceKm, findAirport } from "@/lib/flight-checker-data";
import { calculateAmountCategoryFromDistance } from "@/lib/flightaware/flight-eligibility";
import {
  generateCaseNumber,
  getNextCaseSequence,
} from "@/lib/utils/caseNumber";

type PrismaTx = Prisma.TransactionClient;

export const claimCardInclude = {
  client: {
    include: {
      _count: {
        select: {
          claims: true,
        },
      },
    },
  },
  flight: true,
  airline: true,
  owner: true,
  creator: true,
  passengers: {
    orderBy: {
      isPrimary: "desc",
    },
  },
  documents: {
    orderBy: {
      generatedAt: "desc",
    },
  },
  attachments: {
    orderBy: {
      createdAt: "desc",
    },
  },
  notes: {
    orderBy: {
      createdAt: "desc",
    },
    include: {
      author: true,
    },
  },
  tasks: {
    where: {
      status: {
        not: TaskStatus.DONE,
      },
    },
    orderBy: {
      dueDate: "asc",
    },
    include: {
      assignee: true,
    },
  },
  statusHistory: {
    orderBy: {
      createdAt: "desc",
    },
    take: 50,
    include: {
      changedBy: true,
    },
  },
  assignmentHistory: {
    orderBy: {
      createdAt: "desc",
    },
    take: 50,
    include: {
      changedBy: true,
    },
  },
  payouts: true,
} satisfies Prisma.ClaimInclude;

export type CreateClaimInput = {
  type: ClaimType;
  source: ClaimSource;
  initialStatus?: ClaimStatus;
  clientId: string;
  creatorId: string;
  flightId?: string | null;
  airlineId?: string | null;
  clientIban?: string | null;
  applicationPayload?: Prisma.InputJsonValue | null;
  isPolishJurisdiction: boolean;
  passengers?: {
    firstName: string;
    lastName: string;
    isPrimary: boolean;
    clientId?: string | null;
  }[];
};

export type ManualFlightInput = {
  flightNumber: string;
  flightDate: string;
  departureAirportCode: string;
  arrivalAirportCode: string;
  delayMinutes: number | null;
  estimatedAmountEur?: number | null;
};

export function amountCategoryToAmount(
  amountCategory: ClaimAmountCategory | null,
) {
  const amountByCategory: Record<ClaimAmountCategory, number> = {
    EUR_250: 250,
    EUR_400: 400,
    EUR_600: 600,
  };

  return amountCategory ? amountByCategory[amountCategory] : null;
}

export function amountToCategory(
  amount: number | string | null | undefined,
): ClaimAmountCategory | null {
  const numericAmount =
    typeof amount === "string" ? Number(amount.replace(",", ".")) : amount;

  if (numericAmount === 250) return ClaimAmountCategory.EUR_250;
  if (numericAmount === 400) return ClaimAmountCategory.EUR_400;
  if (numericAmount === 600) return ClaimAmountCategory.EUR_600;

  return null;
}

export function calculateClaimAmounts(
  amountCategory: ClaimAmountCategory | null,
  commissionModel: CommissionModel,
) {
  const amount = amountCategoryToAmount(amountCategory);

  if (!amount) {
    return {
      potentialAmount: null,
      estimatedFee: null,
    };
  }

  const feeRate =
    commissionModel === CommissionModel.COURT_40
      ? COMMISSION_RATES.JUDICIAL
      : COMMISSION_RATES.EXTRAJUDICIAL;

  return {
    potentialAmount: new Prisma.Decimal(amount),
    estimatedFee: new Prisma.Decimal(amount * feeRate),
  };
}

function payloadEstimatedAmount(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }

  const value = (payload as Record<string, unknown>).SZACOWANA_KWOTA_EUR;

  return typeof value === "number" || typeof value === "string" ? value : null;
}

export function estimateAmountCategoryFromRoute(input: {
  departureAirportCode: string | null | undefined;
  arrivalAirportCode: string | null | undefined;
}) {
  const departureAirport = findAirport(input.departureAirportCode);
  const arrivalAirport = findAirport(input.arrivalAirportCode);

  if (!departureAirport || !arrivalAirport) {
    return {
      distanceKm: null,
      amountCategory: null,
    };
  }

  const roundedDistanceKm = Math.round(
    distanceKm(departureAirport, arrivalAirport),
  );

  return {
    distanceKm: roundedDistanceKm,
    amountCategory: calculateAmountCategoryFromDistance(roundedDistanceKm),
  };
}

export function resolveClaimAmountCategory(input: {
  flight: {
    departureAirportCode: string | null;
    arrivalAirportCode: string | null;
    amountCategory: ClaimAmountCategory | null;
  } | null;
  applicationPayload?: unknown;
}) {
  const routeAmountCategory = input.flight
    ? estimateAmountCategoryFromRoute({
        departureAirportCode: input.flight.departureAirportCode,
        arrivalAirportCode: input.flight.arrivalAirportCode,
      }).amountCategory
    : null;

  return (
    routeAmountCategory ??
    amountToCategory(payloadEstimatedAmount(input.applicationPayload)) ??
    input.flight?.amountCategory ??
    null
  );
}

export async function generateClaimNumber(tx: PrismaTx) {
  const year = new Date().getFullYear();
  const sequence = await getNextCaseSequence(tx, year);

  return {
    year,
    sequence,
    claimNumber: generateCaseNumber(year, sequence),
  };
}

export async function getOrCreateSystemUser(tx: PrismaTx) {
  return tx.user.upsert({
    where: {
      email: "system@oweme.pl",
    },
    update: {
      isActive: true,
    },
    create: {
      email: "system@oweme.pl",
      name: "OWEME System",
      role: UserRole.ADMIN,
      isActive: true,
    },
    select: {
      id: true,
    },
  });
}

function airlineIataFromFlightNumber(flightNumber: string) {
  const normalized = flightNumber.trim().replace(/\s+/g, "").toUpperCase();
  const match = normalized.match(/^[A-Z0-9]{2}/);

  return match?.[0] ?? "XX";
}

function dateFromFlightDate(date: string) {
  return new Date(`${date.slice(0, 10)}T00:00:00.000Z`);
}

export async function createManualFlight(
  tx: PrismaTx,
  input: ManualFlightInput,
) {
  const normalizedFlightNumber = input.flightNumber
    .trim()
    .replace(/\s+/g, "")
    .toUpperCase();
  const airlineIata = airlineIataFromFlightNumber(normalizedFlightNumber);
  const airlineData = getAirlinePrismaData(airlineIata);
  const airline = await tx.airline.upsert({
    where: {
      iataCode: airlineIata,
    },
    update: airlineData,
    create: {
      iataCode: airlineIata,
      ...airlineData,
    },
    select: {
      id: true,
    },
  });
  const routeEstimate = estimateAmountCategoryFromRoute({
    departureAirportCode: input.departureAirportCode,
    arrivalAirportCode: input.arrivalAirportCode,
  });
  const amountCategory =
    routeEstimate.amountCategory ?? amountToCategory(input.estimatedAmountEur);

  return tx.flight.upsert({
    where: {
      flightNumber_flightDate: {
        flightNumber: normalizedFlightNumber,
        flightDate: dateFromFlightDate(input.flightDate),
      },
    },
    update: {
      departureAirportCode: input.departureAirportCode.toUpperCase(),
      arrivalAirportCode: input.arrivalAirportCode.toUpperCase(),
      distanceKm: routeEstimate.distanceKm,
      delayMinutes: input.delayMinutes,
      amountCategory,
      dataSource: ApiDataSource.MANUAL,
      airlineId: airline.id,
    },
    create: {
      flightNumber: normalizedFlightNumber,
      flightDate: dateFromFlightDate(input.flightDate),
      departureAirportCode: input.departureAirportCode.toUpperCase(),
      arrivalAirportCode: input.arrivalAirportCode.toUpperCase(),
      distanceKm: routeEstimate.distanceKm,
      delayMinutes: input.delayMinutes,
      flightStatus: FlightStatus.UNKNOWN,
      amountCategory,
      dataSource: ApiDataSource.MANUAL,
      airlineId: airline.id,
    },
    select: {
      id: true,
      airlineId: true,
    },
  });
}

export async function createClaimWithHistoryInTransaction(
  tx: PrismaTx,
  input: CreateClaimInput,
) {
  const flight = input.flightId
    ? await tx.flight.findUnique({
        where: { id: input.flightId },
        select: {
          amountCategory: true,
          departureAirportCode: true,
          arrivalAirportCode: true,
          airlineId: true,
        },
      })
    : null;

  const { potentialAmount, estimatedFee } = calculateClaimAmounts(
    resolveClaimAmountCategory({
      flight: flight
        ? {
            departureAirportCode: flight.departureAirportCode,
            arrivalAirportCode: flight.arrivalAirportCode,
            amountCategory: flight.amountCategory,
          }
        : null,
      applicationPayload: input.applicationPayload,
    }),
    CommissionModel.STANDARD_30,
  );
  const claimNumber = await generateClaimNumber(tx);
  const initialStatus = input.initialStatus ?? ClaimStatus.NEW;

  const createdClaim = await tx.claim.create({
    data: {
      claimNumber: claimNumber.claimNumber,
      caseYear: claimNumber.year,
      caseSequence: claimNumber.sequence,
      type: input.type,
      source: input.source,
      status: initialStatus,
      creatorId: input.creatorId,
      clientId: input.clientId,
      flightId: input.flightId ?? undefined,
      airlineId: input.airlineId ?? flight?.airlineId,
      potentialAmount,
      estimatedFee,
      clientIban: input.clientIban ?? undefined,
      applicationPayload: input.applicationPayload ?? undefined,
      commissionModel: CommissionModel.STANDARD_30,
      isPolishJurisdiction: input.isPolishJurisdiction,
      passengers: input.passengers?.length
        ? {
            create: input.passengers.map((passenger) => ({
              firstName: passenger.firstName,
              lastName: passenger.lastName,
              isPrimary: passenger.isPrimary,
              clientId: passenger.clientId,
            })),
          }
        : undefined,
    },
    include: claimCardInclude,
  });

  await tx.claimStatusHistory.create({
    data: {
      claimId: createdClaim.id,
      changedById: input.creatorId,
      oldStatus: initialStatus,
      newStatus: initialStatus,
      comment: "Utworzono sprawę.",
    },
  });

  return createdClaim;
}

export async function createClaimWithHistory(
  prisma: PrismaClient,
  input: CreateClaimInput,
) {
  return prisma.$transaction((tx) =>
    createClaimWithHistoryInTransaction(tx, input),
  );
}
