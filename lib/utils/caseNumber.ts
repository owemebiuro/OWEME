import type { Prisma } from "@prisma/client";

export function generateCaseNumber(year: number, sequence: number): string {
  const yy = String(year).slice(-2);

  return `OW${yy}${sequence}`;
}

export async function getNextCaseSequence(
  tx: Prisma.TransactionClient,
  year = new Date().getFullYear(),
) {
  const lastClaim = await tx.claim.findFirst({
    where: {
      caseYear: year,
      caseSequence: {
        not: null,
      },
    },
    orderBy: {
      caseSequence: "desc",
    },
    select: {
      caseSequence: true,
    },
  });

  return (lastClaim?.caseSequence ?? 0) + 1;
}
