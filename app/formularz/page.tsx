import type { Metadata } from "next";
import { Suspense } from "react";

import PlanesDeco from "@/components/PlanesDeco";
import SiteNav from "@/components/SiteNav";
import {
  ApplicationForm,
  type ApplicationInitialData,
} from "@/components/form/ApplicationForm";
import styles from "@/app/landing.module.css";
import { hasPrismaDatabaseUrl, prisma } from "@/lib/prisma";

type ApplicationSearchParams = Promise<
  Record<string, string | string[] | undefined>
>;

export const metadata: Metadata = {
  title: "Formularz wniosku | OWEME",
  description:
    "Złóż bezpłatny wniosek o odszkodowanie za opóźniony, odwołany lot lub odmowę boardingu.",
};

function readParam(
  params: Awaited<ApplicationSearchParams>,
  key: string,
) {
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

async function getInitialData(
  params: Awaited<ApplicationSearchParams>,
): Promise<ApplicationInitialData> {
  const flightId = readParam(params, "flightId");
  const manual = readParam(params, "manual") === "1";
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
          },
        })
      : null;

  return {
    flightId: flightFromDb?.id,
    manual: manual || !flightFromDb,
    flightNumber:
      flightFromDb?.flightNumber ?? readParam(params, "flightNumber") ?? "",
    flightDate:
      flightFromDb?.flightDate.toISOString().slice(0, 10) ??
      readParam(params, "flightDate") ??
      "",
    departureAirportCode:
      flightFromDb?.departureAirportCode ??
      readParam(params, "departureAirportCode") ??
      "",
    arrivalAirportCode:
      flightFromDb?.arrivalAirportCode ??
      readParam(params, "arrivalAirportCode") ??
      "",
    delayMinutes: flightFromDb?.delayMinutes ?? parseDelay(readParam(params, "delayMinutes")),
    passengers: parsePassengers(readParam(params, "passengers")),
  };
}

export default async function ApplicationPage({
  searchParams,
}: {
  searchParams: ApplicationSearchParams;
}) {
  const params = await searchParams;
  const initialData = await getInitialData(params);

  return (
    <>
      <Suspense fallback={null}>
        <SiteNav />
      </Suspense>

      <main className={styles.applicationPage}>
        <section className={styles.applicationPanel}>
          <div className={styles.applicationIntro}>
            <div className={styles.heroBadge}>
              <span className={styles.pulse} />
              Krok 2 z 2
            </div>
            <h1>Złóż wniosek o odszkodowanie</h1>
            <p>
              Uzupełnij dane pasażera i lotu. Analiza jest bezpłatna, a OWEME
              pobiera prowizję dopiero po skutecznym odzyskaniu środków.
            </p>
            <div className={styles.applicationBenefits}>
              <span>0% z góry</span>
              <span>30% success fee</span>
              <span>Obsługa dokumentów</span>
            </div>
          </div>

          <div className={styles.applicationBox}>
            <PlanesDeco />
            <ApplicationForm initialData={initialData} />
          </div>
        </section>
      </main>
    </>
  );
}
