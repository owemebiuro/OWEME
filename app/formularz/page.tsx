import type { Metadata } from "next";
import { Suspense } from "react";

import SiteNav from "@/components/SiteNav";
import {
  type AdminUserOption,
  ApplicationForm,
  type ApplicationInitialData,
} from "@/components/form/ApplicationForm";
import styles from "@/components/form/ApplicationForm.module.css";
import { getCurrentUser } from "@/lib/auth-helpers";
import { hasPrismaDatabaseUrl, prisma } from "@/lib/prisma";

type ApplicationSearchParams = Promise<
  Record<string, string | string[] | undefined>
>;

export const metadata: Metadata = {
  title: "Formularz wniosku | OWEME",
  description:
    "Złóż bezpłatny wniosek o odszkodowanie za opóźniony, odwołany lot lub odmowę boardingu.",
};

function readParam(params: Awaited<ApplicationSearchParams>, key: string) {
  const value = params[key];

  return Array.isArray(value) ? value[0] : value;
}

function parsePassengers(value: string | undefined) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return 1;
  }

  return Math.min(9, Math.max(1, Math.round(parsed)));
}

function parseDelay(value: string | undefined) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : null;
}

function parseSource(value: string | undefined) {
  return value === "checker" ? "CHECKER_FORM" : "WEBSITE_FORM";
}

function parseReason(value: string | undefined): ApplicationInitialData["reason"] {
  if (
    value === "DELAY" ||
    value === "CANCELLATION" ||
    value === "DENIED_BOARDING" ||
    value === "REROUTING"
  ) {
    return value;
  }

  return undefined;
}

function reasonFromLeadDisruption(
  value: string | null | undefined,
): ApplicationInitialData["reason"] {
  if (value === "cancel") {
    return "CANCELLATION";
  }

  if (value === "denied") {
    return "DENIED_BOARDING";
  }

  if (value === "delay") {
    return "DELAY";
  }

  return undefined;
}

function delayFromLeadDelayHours(value: string | null | undefined) {
  if (value === "3plus") {
    return 180;
  }

  if (value === "less3") {
    return 120;
  }

  return null;
}

async function getInitialData(
  params: Awaited<ApplicationSearchParams>,
): Promise<ApplicationInitialData> {
  const flightId = readParam(params, "flightId");
  const leadId = readParam(params, "leadId");
  const manual = readParam(params, "manual") === "1";
  const leadFromDb =
    leadId && hasPrismaDatabaseUrl()
      ? await prisma.lead.findUnique({
          where: {
            id: leadId,
          },
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phoneFormatted: true,
            phone: true,
            departureAirportCode: true,
            arrivalAirportCode: true,
            flightDate: true,
            airlineName: true,
            flightNumber: true,
            disruption: true,
            delayHours: true,
          },
        })
      : null;
  const flightFromDb =
    flightId && hasPrismaDatabaseUrl()
      ? await prisma.flight.findUnique({
          where: {
            id: flightId,
          },
          select: {
            id: true,
            flightNumber: true,
            flightDate: true,
            departureAirportCode: true,
            arrivalAirportCode: true,
            delayMinutes: true,
            airline: {
              select: {
                name: true,
              },
            },
          },
        })
      : null;

  return {
    leadId: leadId ?? undefined,
    flightId: flightFromDb?.id,
    manual: manual || !flightFromDb,
    flightNumber:
      flightFromDb?.flightNumber ??
      leadFromDb?.flightNumber ??
      readParam(params, "flightNumber") ??
      "",
    flightDate:
      flightFromDb?.flightDate.toISOString().slice(0, 10) ??
      leadFromDb?.flightDate?.toISOString().slice(0, 10) ??
      readParam(params, "flightDate") ??
      "",
    departureAirportCode:
      flightFromDb?.departureAirportCode ??
      leadFromDb?.departureAirportCode ??
      readParam(params, "departureAirportCode") ??
      "",
    arrivalAirportCode:
      flightFromDb?.arrivalAirportCode ??
      leadFromDb?.arrivalAirportCode ??
      readParam(params, "arrivalAirportCode") ??
      "",
    airlineName:
      flightFromDb?.airline.name ??
      leadFromDb?.airlineName ??
      readParam(params, "airlineName") ??
      "",
    reason:
      parseReason(readParam(params, "reason")) ??
      reasonFromLeadDisruption(leadFromDb?.disruption),
    delayMinutes:
      flightFromDb?.delayMinutes ??
      parseDelay(readParam(params, "delayMinutes")) ??
      delayFromLeadDelayHours(leadFromDb?.delayHours),
    passengers: parsePassengers(readParam(params, "passengers")),
    source: parseSource(readParam(params, "source")),
    client: {
      firstName: leadFromDb?.firstName ?? readParam(params, "firstName") ?? "",
      lastName: leadFromDb?.lastName ?? readParam(params, "lastName") ?? "",
      email: leadFromDb?.email ?? readParam(params, "email") ?? "",
      phone:
        leadFromDb?.phoneFormatted ??
        leadFromDb?.phone ??
        readParam(params, "phone") ??
        "",
    },
  };
}

async function getAdminUsers(isAdmin: boolean): Promise<AdminUserOption[]> {
  if (!isAdmin || !hasPrismaDatabaseUrl()) {
    return [];
  }

  return prisma.user.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
    },
  });
}

export default async function ApplicationPage({
  searchParams,
}: {
  searchParams: ApplicationSearchParams;
}) {
  const params = await searchParams;
  const initialData = await getInitialData(params);
  const requestedAdminMode =
    readParam(params, "admin") === "1" || readParam(params, "isAdmin") === "1";
  const currentUser = requestedAdminMode ? await getCurrentUser() : null;
  const isAdmin = Boolean(currentUser?.appUser && requestedAdminMode);
  const adminUsers = await getAdminUsers(isAdmin);

  return (
    <>
      {!isAdmin ? (
        <Suspense fallback={null}>
          <SiteNav />
        </Suspense>
      ) : null}

      <main className={styles.page}>
        <ApplicationForm
          initialData={initialData}
          isAdmin={isAdmin}
          adminUsers={adminUsers}
        />
      </main>
    </>
  );
}
