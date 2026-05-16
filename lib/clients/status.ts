export type ClientStatus = "active" | "inactive" | "suspended" | "vip";

export const CLIENT_STATUS_LABELS: Record<ClientStatus, string> = {
  active: "Aktywny",
  inactive: "Nieaktywny",
  suspended: "Zawieszony",
  vip: "VIP",
};

export const CLIENT_STATUSES = Object.keys(
  CLIENT_STATUS_LABELS,
) as ClientStatus[];

export function normalizeClientStatus(status: string | null | undefined) {
  const normalized = status?.trim().toLowerCase();

  return CLIENT_STATUSES.includes(normalized as ClientStatus)
    ? (normalized as ClientStatus)
    : "active";
}

export function getClientStatusLabel(status: string | null | undefined) {
  return CLIENT_STATUS_LABELS[normalizeClientStatus(status)];
}
