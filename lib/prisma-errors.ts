import { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";

const CLAIM_BILLING_COLUMNS = [
  "Claim.airlinePaid",
  "Claim.airlinePaidAt",
  "Claim.clientPaid",
  "Claim.clientPaidAt",
  "Claim.clientIban",
  "Claim.transferTitle",
  "Claim.clientSettled",
] as const;

const CLAIM_BILLING_COLUMNS_SET = new Set<string>(CLAIM_BILLING_COLUMNS);

const SCHEMA_OUTDATED_MESSAGE =
  "Schemat bazy danych OWEME jest nieaktualny. Brakuje kolumn rozliczeń spraw w tabeli Claim. Zaktualizuj schemat Prisma i uruchom aplikację ponownie.";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function getMissingColumn(error: Prisma.PrismaClientKnownRequestError) {
  const metaColumn = error.meta?.column;
  return typeof metaColumn === "string" ? metaColumn : null;
}

export function isKnownPrismaError(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError;
}

export function isMissingClaimBillingColumnsError(error: unknown) {
  if (isKnownPrismaError(error) && error.code === "P2022") {
    const missingColumn = getMissingColumn(error);
    return missingColumn ? CLAIM_BILLING_COLUMNS_SET.has(missingColumn) : false;
  }

  const message = getErrorMessage(error);
  return CLAIM_BILLING_COLUMNS.some((column) => message.includes(column));
}

export function toSchemaOutdatedTRPCError(error: unknown) {
  if (!isMissingClaimBillingColumnsError(error)) {
    return null;
  }

  return new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: SCHEMA_OUTDATED_MESSAGE,
    cause: error,
  });
}

function getErrorCause(error: unknown) {
  if (error && typeof error === "object" && "cause" in error) {
    return (error as { cause?: unknown }).cause;
  }

  return null;
}

export function isSchemaOutdatedError(error: unknown): boolean {
  if (!error) {
    return false;
  }

  if (error instanceof TRPCError) {
    return (
      error.message === SCHEMA_OUTDATED_MESSAGE ||
      isMissingClaimBillingColumnsError(error.message) ||
      isSchemaOutdatedError(error.cause)
    );
  }

  if (isMissingClaimBillingColumnsError(error)) {
    return true;
  }

  const cause = getErrorCause(error);
  return cause ? isSchemaOutdatedError(cause) : false;
}

export function isSchemaOutdatedTRPCError(error: unknown) {
  return isSchemaOutdatedError(error);
}

export function getSchemaOutdatedMessage() {
  return SCHEMA_OUTDATED_MESSAGE;
}
