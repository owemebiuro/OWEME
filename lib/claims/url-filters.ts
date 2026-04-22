import type { ClaimSource, ClaimStatus, ClaimType } from "@prisma/client";

import { CLAIM_SOURCES, CLAIM_STATUSES, CLAIM_TYPES } from "@/lib/claims/status-colors";

export type ClaimsRouteSearchParams = Record<
  string,
  string | string[] | undefined
>;

export type ClaimsListQueryInput = {
  page: number;
  pageSize: number;
  search?: string;
  status?: ClaimStatus[];
  ownerId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  claimType?: ClaimType[];
  isCourtStage?: boolean;
  overdueTasks?: boolean;
  airlineId?: string;
  source?: ClaimSource[];
};

type SearchParamUpdate =
  | string
  | number
  | boolean
  | readonly string[]
  | null
  | undefined;

const defaultPage = 1;
const defaultPageSize = 25;
const maxPageSize = 100;

function firstParam(
  searchParams: ClaimsRouteSearchParams,
  key: string,
): string | undefined {
  const value = searchParams[key];

  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function splitParam(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseNumberParam(
  value: string | undefined,
  fallback: number,
  max?: number,
) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.min(Math.floor(parsed), max ?? parsed);
}

function parseDateParam(value: string | undefined, endOfDay = false) {
  if (!value) {
    return undefined;
  }

  const date = new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? `${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}`
      : value,
  );

  return Number.isNaN(date.getTime()) ? undefined : date;
}

function filterKnownValues<TValue extends string>(
  values: string[],
  allowedValues: readonly TValue[],
) {
  return values.filter((value): value is TValue =>
    allowedValues.includes(value as TValue),
  );
}

export function parseClaimsListInput(
  searchParams: ClaimsRouteSearchParams,
): ClaimsListQueryInput {
  const search = firstParam(searchParams, "q")?.trim();
  const ownerId = firstParam(searchParams, "ownerId")?.trim();
  const airlineId = firstParam(searchParams, "airlineId")?.trim();
  const status = filterKnownValues(
    splitParam(firstParam(searchParams, "status")),
    CLAIM_STATUSES,
  );
  const claimType = filterKnownValues(
    splitParam(firstParam(searchParams, "type")),
    CLAIM_TYPES,
  );
  const source = filterKnownValues(
    splitParam(firstParam(searchParams, "source")),
    CLAIM_SOURCES,
  );

  return {
    page: parseNumberParam(firstParam(searchParams, "page"), defaultPage),
    pageSize: parseNumberParam(
      firstParam(searchParams, "pageSize"),
      defaultPageSize,
      maxPageSize,
    ),
    ...(search ? { search } : {}),
    ...(status.length ? { status } : {}),
    ...(ownerId ? { ownerId } : {}),
    ...(parseDateParam(firstParam(searchParams, "dateFrom"))
      ? { dateFrom: parseDateParam(firstParam(searchParams, "dateFrom")) }
      : {}),
    ...(parseDateParam(firstParam(searchParams, "dateTo"), true)
      ? { dateTo: parseDateParam(firstParam(searchParams, "dateTo"), true) }
      : {}),
    ...(claimType.length ? { claimType } : {}),
    ...(firstParam(searchParams, "court") === "1"
      ? { isCourtStage: true }
      : {}),
    ...(firstParam(searchParams, "overdue") === "1"
      ? { overdueTasks: true }
      : {}),
    ...(airlineId ? { airlineId } : {}),
    ...(source.length ? { source } : {}),
  };
}

export function buildClaimsSearchParams(
  currentParams: Pick<URLSearchParams, "toString">,
  updates: Record<string, SearchParamUpdate>,
  options: { resetPage?: boolean } = {},
) {
  const params = new URLSearchParams(currentParams.toString());

  for (const [key, value] of Object.entries(updates)) {
    if (
      value === null ||
      value === undefined ||
      value === false ||
      value === "" ||
      (Array.isArray(value) && value.length === 0)
    ) {
      params.delete(key);
      continue;
    }

    if (Array.isArray(value)) {
      params.set(key, value.join(","));
      continue;
    }

    params.set(key, typeof value === "boolean" ? "1" : String(value));
  }

  if (options.resetPage !== false) {
    params.delete("page");
  }

  return params.toString();
}
