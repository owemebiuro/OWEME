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
  clientId: string;
  creatorId: string;
  flightId?: string | null;
  airlineId?: string | null;
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

  const feeRate = commissionModel === CommissionModel.COURT_40 ? 0.4 : 0.3;

  return {
    potentialAmount: new Prisma.Decimal(amount),
    estimatedFee: new Prisma.Decimal(amount * feeRate),
  };
}

export function estimateAmountCategoryFromDelay(
  delayMinutes: number | null,
): ClaimAmountCategory | null {
  return delayMinutes !== null && delayMinutes >= 180
    ? ClaimAmountCategory.EUR_600
    : null;
}

export async function generateClaimNumber(tx: PrismaTx) {
  const year = new Date().getFullYear();
  const prefix = `OW-${year}-`;
  const lastClaim = await tx.claim.findFirst({
    where: {
      claimNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      claimNumber: "desc",
    },
    select: {
      claimNumber: true,
    },
  });
  const lastNumber = lastClaim?.claimNumber.split("-").at(-1);
  const nextNumber = (lastNumber ? Number.parseInt(lastNumber, 10) : 0) + 1;

  return `${prefix}${String(nextNumber).padStart(5, "0")}`;
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
  const airline = await tx.airline.upsert({
    where: {
      iataCode: airlineIata,
    },
    update: {},
    create: {
      iataCode: airlineIata,
      name: "Nieznana linia",
    },
    select: {
      id: true,
    },
  });
  const amountCategory = estimateAmountCategoryFromDelay(input.delayMinutes);

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
          airlineId: true,
        },
      })
    : null;

  const { potentialAmount, estimatedFee } = calculateClaimAmounts(
    flight?.amountCategory ?? null,
    CommissionModel.STANDARD_30,
  );
  const claimNumber = await generateClaimNumber(tx);

  const createdClaim = await tx.claim.create({
    data: {
      claimNumber,
      type: input.type,
      source: input.source,
      status: ClaimStatus.NEW,
      creatorId: input.creatorId,
      clientId: input.clientId,
      flightId: input.flightId ?? undefined,
      airlineId: input.airlineId ?? flight?.airlineId,
      potentialAmount,
      estimatedFee,
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
      oldStatus: ClaimStatus.NEW,
      newStatus: ClaimStatus.NEW,
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
