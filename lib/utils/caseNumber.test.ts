import { describe, expect, it } from "vitest";

import { generateCaseNumber } from "@/lib/utils/caseNumber";

describe("generateCaseNumber", () => {
  it("builds the new OW{YY}{N} format", () => {
    expect(generateCaseNumber(2026, 1)).toBe("OW261");
    expect(generateCaseNumber(2026, 15)).toBe("OW2615");
    expect(generateCaseNumber(2027, 1)).toBe("OW271");
  });
});
