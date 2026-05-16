import { describe, expect, it } from "vitest";

import { computeLimitation } from "@/lib/limitation/limitation";

describe("computeLimitation", () => {
  it("liczy 1 rok od daty lotu bez zawieszenia", () => {
    const result = computeLimitation(
      new Date("2025-06-15"),
      null,
      null,
      new Date("2025-12-01"),
    );

    expect(result.finalExpiryDate).toEqual(new Date("2026-06-15"));
    expect(result.suspensionDays).toBe(0);
    expect(result.status).toBe("safe");
  });

  it("zawiesza bieg na 12 dni gdy odpowiedź przyszła po 12 dniach", () => {
    const result = computeLimitation(
      new Date("2025-01-01"),
      new Date("2025-03-01"),
      new Date("2025-03-13"),
      new Date("2025-12-01"),
    );

    expect(result.suspensionDays).toBe(12);
    expect(result.finalExpiryDate).toEqual(new Date("2026-01-13"));
  });

  it("zawiesza bieg na 30 dni gdy brak odpowiedzi w terminie", () => {
    const result = computeLimitation(
      new Date("2025-01-01"),
      new Date("2025-03-01"),
      null,
      new Date("2025-12-01"),
    );

    expect(result.suspensionDays).toBe(30);
    expect(result.finalExpiryDate).toEqual(new Date("2026-01-31"));
  });

  it("oznacza status jako suspended gdy jesteśmy w trakcie reklamacji", () => {
    const result = computeLimitation(
      new Date("2025-01-01"),
      new Date("2025-11-20"),
      null,
      new Date("2025-11-30"),
    );

    expect(result.isSuspendedNow).toBe(true);
    expect(result.status).toBe("suspended");
  });

  it("oznacza status jako expired po upływie terminu", () => {
    const result = computeLimitation(
      new Date("2024-01-01"),
      null,
      null,
      new Date("2025-06-01"),
    );

    expect(result.status).toBe("expired");
    expect(result.daysRemaining).toBeLessThan(0);
  });

  it("bierze wcześniejszą z dat: odpowiedź vs autokoniec", () => {
    const result = computeLimitation(
      new Date("2025-01-01"),
      new Date("2025-03-01"),
      new Date("2025-03-05"),
      new Date("2025-12-01"),
    );

    expect(result.suspensionDays).toBe(4);
  });
});
