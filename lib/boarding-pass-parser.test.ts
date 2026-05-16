import { describe, expect, it } from "vitest";

import {
  parseBarcodePayload,
  parseBoardingPassText,
} from "@/lib/boarding-pass-parser";

const referenceDate = new Date("2026-05-12T12:00:00.000Z");

describe("boarding pass parser", () => {
  it("extracts flight data from OCR-like boarding pass text", () => {
    const parsed = parseBoardingPassText(
      `
      BOARDING PASS
      Passenger: Jan Kowalski
      Flight LO 231
      Date 12 MAY 2026
      From WAW Warsaw
      To LHR London Heathrow
      Seat 12A Gate 4
      `,
      { referenceDate },
    );

    expect(parsed).toMatchObject({
      airline: "LOT Polish Airlines",
      flightDate: "2026-05-12",
      flightNumber: "LO231",
      from: "WAW",
      to: "LHR",
    });
  });

  it("extracts flight data from an IATA BCBP barcode payload", () => {
    const passengerName = "DOE/JOHN".padEnd(20, " ");
    const pnr = "ABC123".padEnd(7, " ");
    const payload = `M1${passengerName}E${pnr}WAWLHRLO 0231 132Y012A0001 100`;

    const parsed = parseBarcodePayload(payload, { referenceDate });

    expect(parsed).toMatchObject({
      airline: "LOT Polish Airlines",
      flightDate: "2026-05-12",
      flightNumber: "LO231",
      from: "WAW",
      to: "LHR",
    });
  });

  it("extracts route from airport names on mobile boarding pass screenshots", () => {
    const parsed = parseBoardingPassText(
      `
      MOBILE BOARDING PASS
      Ryanair
      Flight FR 1021
      Date 12/05
      From Warsaw Modlin
      To London Stansted
      Seat 18F
      Boarding time 08:40
      `,
      { referenceDate },
    );

    expect(parsed).toMatchObject({
      airline: "Ryanair",
      flightDate: "2026-05-12",
      flightNumber: "FR1021",
      from: "WMI",
      to: "STN",
    });
  });

  it("extracts route from Polish labels and city names", () => {
    const parsed = parseBoardingPassText(
      `
      KARTA POKLADOWA
      Numer lotu W6 123
      Data 12/05
      Wylot Warszawa Chopina
      Przylot Londyn Luton
      Miejsce 4A
      `,
      { referenceDate },
    );

    expect(parsed).toMatchObject({
      airline: "Wizz Air",
      flightDate: "2026-05-12",
      flightNumber: "W6123",
      from: "WAW",
      to: "LTN",
    });
  });

  it("extracts Wizz Air flight data from OCR-heavy app screenshots", () => {
    const parsed = parseBoardingPassText(
      String.raw`
      Karty poktadowe
      PNR
      KNY94Q
      Sequence
      0146
      LIS             we1s94  \NAW
      Lizbona -                      Warszawa-Okecie
      Terminal 2
      Date              Gate Closes       Departure
      03 Jan '26 17:00    17:30
      MALE / ADT
      `,
      { referenceDate },
    );

    expect(parsed).toMatchObject({
      airline: "Wizz Air",
      flightDate: "2026-01-03",
      flightNumber: "W61594",
      from: "LIS",
      to: "WAW",
    });
  });

  it("combines full-screen OCR with a focused route-band OCR result", () => {
    const parsed = parseBoardingPassText(
      String.raw`
      Karty poktadowe
      PNF
      KNY94Q
      LIS             wes94  \NAW
      Lizbona -                      Warszawa-Okecie
      Date              |  Gate Closes        Departure
      03Jan 26 | 17:00    17:30

      LIS
      W61594
      WAW

      Birthdate         02-01-2026
      `,
      { referenceDate },
    );

    expect(parsed).toMatchObject({
      airline: "Wizz Air",
      flightDate: "2026-01-03",
      flightNumber: "W61594",
      from: "LIS",
      to: "WAW",
    });
  });

  it("rejects random non-boarding-pass text", () => {
    const parsed = parseBoardingPassText(
      "Random holiday photo with no passenger, no route, and no real flight data.",
      { referenceDate },
    );

    expect(parsed).toBeNull();
  });
});
