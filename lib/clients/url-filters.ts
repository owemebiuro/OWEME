export type ClientsRouteSearchParams = Record<
  string,
  string | string[] | undefined
>;

export type ClientsListQueryInput = {
  page: number;
  pageSize: number;
  search?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  pesel?: string;
};

const defaultPage = 1;
const defaultPageSize = 25;
const maxPageSize = 100;

function firstParam(
  searchParams: ClientsRouteSearchParams,
  key: string,
): string | undefined {
  const value = searchParams[key];

  return Array.isArray(value) ? value[0] : value;
}

function parseNumberParam(value: string | undefined, fallback: number) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.floor(parsed);
}

export function parseClientsListInput(
  searchParams: ClientsRouteSearchParams,
): ClientsListQueryInput {
  const search = firstParam(searchParams, "q")?.trim();
  const firstName = firstParam(searchParams, "firstName")?.trim();
  const lastName = firstParam(searchParams, "lastName")?.trim();
  const email = firstParam(searchParams, "email")?.trim();
  const phone = firstParam(searchParams, "phone")?.trim();
  const pesel = firstParam(searchParams, "pesel")?.trim();

  return {
    page: parseNumberParam(firstParam(searchParams, "page"), defaultPage),
    pageSize: Math.min(
      parseNumberParam(firstParam(searchParams, "pageSize"), defaultPageSize),
      maxPageSize,
    ),
    ...(search ? { search } : {}),
    ...(firstName ? { firstName } : {}),
    ...(lastName ? { lastName } : {}),
    ...(email ? { email } : {}),
    ...(phone ? { phone } : {}),
    ...(pesel ? { pesel } : {}),
  };
}

export function buildClientsSearchParams(
  currentParams: Pick<URLSearchParams, "toString">,
  updates: Record<string, string | number | null | undefined>,
  options: { resetPage?: boolean } = {},
) {
  const params = new URLSearchParams(currentParams.toString());

  for (const [key, value] of Object.entries(updates)) {
    if (value === null || value === undefined || value === "") {
      params.delete(key);
      continue;
    }

    params.set(key, String(value));
  }

  if (options.resetPage !== false) {
    params.delete("page");
  }

  return params.toString();
}
