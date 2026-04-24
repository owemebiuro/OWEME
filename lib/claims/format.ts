import type { ClaimType } from "@prisma/client";

const incidentLabels: Record<ClaimType, string> = {
  DELAY: "opóźnionym lotem",
  CANCELLATION: "odwołanym lotem",
  DENIED_BOARDING: "odmową wejścia na pokład",
};

export function generateTransferTitle(
  airlineName: string | null | undefined,
  claimType: ClaimType,
  flightNumber: string | null | undefined,
): string {
  const airline = airlineName ?? "linii lotniczej";
  const incident = incidentLabels[claimType];
  const flight = flightNumber ?? "nieznanym locie";
  return `Wierzytelność z tytułu odszkodowania od linii lotniczej ${airline} w związku z ${incident} ${flight}`;
}

const dateFormatter = new Intl.DateTimeFormat("pl-PL", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("pl-PL", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Brak daty";
  }

  return dateFormatter.format(new Date(value));
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "Brak daty";
  }

  return dateTimeFormatter.format(new Date(value));
}

export function formatCurrency(
  value: string | number | null | undefined,
  currency = "EUR",
) {
  if (value === null || value === undefined || value === "") {
    return "Nie wyliczono";
  }

  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(value));
}

export function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
