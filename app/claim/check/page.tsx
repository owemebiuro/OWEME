import { WizardShell } from "@/components/FlightChecker/Wizard/WizardShell";
import { findAirline, findAirport } from "@/lib/flight-checker-data";

type ClaimCheckPageProps = {
  searchParams: Promise<{
    from?: string | string[] | undefined;
    to?: string | string[] | undefined;
    date?: string | string[] | undefined;
    flightDate?: string | string[] | undefined;
    airline?: string | string[] | undefined;
    flightNumber?: string | string[] | undefined;
  }>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function flightDigits(value: string | undefined, airlineCode: string | undefined) {
  if (!value) {
    return null;
  }

  const withoutAirline = airlineCode
    ? value.replace(new RegExp(`^${airlineCode}`, "i"), "")
    : value;
  const digits = withoutAirline.replace(/\D+/g, "").slice(0, 4);

  return digits || null;
}

export default async function ClaimCheckPage({
  searchParams,
}: ClaimCheckPageProps) {
  const params = await searchParams;
  const from = findAirport(firstParam(params.from));
  const to = findAirport(firstParam(params.to));
  const airline = findAirline(firstParam(params.airline));
  const flightNumber = flightDigits(
    firstParam(params.flightNumber),
    airline?.iata,
  );

  return (
    <WizardShell
      initialDepartureAirport={from}
      initialDestinationAirport={to}
      initialFlightDate={firstParam(params.date) ?? firstParam(params.flightDate) ?? null}
      initialAirline={airline}
      initialFlightNumber={flightNumber}
    />
  );
}
