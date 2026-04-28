import { ClaimAmountCategory, FlightStatus } from "@prisma/client";
import { describe, expect, test } from "vitest";

import { mapFlightAwareResponse } from "@/lib/flightaware/aeroapi.mapper";
import { buildEligibilityResult } from "@/lib/flightaware/flight-eligibility";
import type { FlightAwareFlightsResponse } from "@/lib/flightaware/aeroapi.types";

function response(overrides: Record<string, unknown>): FlightAwareFlightsResponse {
  return {
    flights: [
      {
        ident: "LOT231",
        ident_iata: "LO231",
        fa_flight_id: "LOT231-test",
        operator: "LOT",
        operator_iata: "LO",
        origin: {
          code: "EPWA",
          code_icao: "EPWA",
          code_iata: "WAW",
          name: "Warsaw Chopin Airport",
          city: "Warsaw",
        },
        destination: {
          code: "EGLL",
          code_icao: "EGLL",
          code_iata: "LHR",
          name: "London Heathrow Airport",
          city: "London",
        },
        cancelled: false,
        diverted: false,
        scheduled_out: "2026-04-10T06:00:00Z",
        actual_out: "2026-04-10T08:07:00Z",
        scheduled_in: "2026-04-10T08:00:00Z",
        actual_in: "2026-04-10T10:14:00Z",
        status: "Arrived / Gate Arrival",
        route_distance: 903,
        arrival_delay: 134,
        ...overrides,
      },
    ],
  };
}

describe("FlightAware AeroAPI mapper", () => {
  test("converts route_distance from NM to km before EC 261 thresholding", () => {
    const flight = mapFlightAwareResponse(response({ arrival_delay: 200 }), "LO231", "2026-04-10");
    const result = buildEligibilityResult({
      found: true,
      distanceKm: flight.distanceKm,
      delayMinutes: flight.delayMinutes,
      flightStatus: flight.flightStatus,
      departureAirportCode: flight.departureAirportCode,
      arrivalAirportCode: flight.arrivalAirportCode,
    });

    expect(flight.distanceKm).toBe(1672);
    expect(result.amountEur).toBe(400);
    expect(result.category).toBe(ClaimAmountCategory.EUR_400);
  });

  test("uses arrival_delay as gate arrival delay when AeroAPI provides it", () => {
    const flight = mapFlightAwareResponse(
      response({
        arrival_delay: 180,
        scheduled_in: "2026-04-10T08:00:00Z",
        actual_in: "2026-04-10T08:20:00Z",
        route_distance: 500,
      }),
      "LO231",
      "2026-04-10",
    );

    expect(flight.delayMinutes).toBe(180);
    expect(flight.amountCategory).toBe(ClaimAmountCategory.EUR_250);
  });

  test("computes delay from actual_in and scheduled_in when arrival_delay is null", () => {
    const flight = mapFlightAwareResponse(
      response({
        arrival_delay: null,
        scheduled_in: "2026-04-10T08:00:00Z",
        actual_in: "2026-04-10T11:05:00Z",
      }),
      "LO231",
      "2026-04-10",
    );

    expect(flight.delayMinutes).toBe(185);
  });

  test("maps AeroAPI status strings to local flight statuses", () => {
    expect(
      mapFlightAwareResponse(response({ status: "Arrived / Gate Arrival" }), "LO231", "2026-04-10")
        .flightStatus,
    ).toBe(FlightStatus.LANDED);
    expect(
      mapFlightAwareResponse(response({ status: "En Route / Late" }), "LO231", "2026-04-10")
        .flightStatus,
    ).toBe(FlightStatus.ACTIVE);
    expect(
      mapFlightAwareResponse(response({ cancelled: true, status: "Scheduled" }), "LO231", "2026-04-10")
        .flightStatus,
    ).toBe(FlightStatus.CANCELLED);
  });

  test("does not award compensation below 180 minutes unless cancelled", () => {
    const notEligible = buildEligibilityResult({
      found: true,
      distanceKm: 1673,
      delayMinutes: 134,
      flightStatus: FlightStatus.LANDED,
      departureAirportCode: "WAW",
      arrivalAirportCode: "LHR",
    });
    const cancelled = buildEligibilityResult({
      found: true,
      distanceKm: 1673,
      delayMinutes: 0,
      flightStatus: FlightStatus.CANCELLED,
      departureAirportCode: "WAW",
      arrivalAirportCode: "LHR",
    });

    expect(notEligible.amountEur).toBeNull();
    expect(cancelled.amountEur).toBe(400);
  });

  test("does not award EC 261 compensation outside covered airports", () => {
    const result = buildEligibilityResult({
      found: true,
      distanceKm: 4583,
      delayMinutes: 300,
      flightStatus: FlightStatus.LANDED,
      departureAirportCode: "JFK",
      arrivalAirportCode: "LAX",
    });

    expect(result.amountEur).toBeNull();
  });
});
