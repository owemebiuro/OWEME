import { describe, expect, it } from "vitest";

import {
  PERMISSIONS,
  canLawyerSetClaimStatus,
  hasRolePermission,
} from "@/lib/trpc/permissions.shared";

describe("permissions", () => {
  it("OPERATOR nie moze zmieniac modelu prowizji", () => {
    expect(
      hasRolePermission("OPERATOR", PERMISSIONS.CLAIM_CHANGE_COMMISSION),
    ).toBe(false);
  });

  it("LAWYER ma ogolne prawo zmiany statusu tylko z domenowym ograniczeniem etapu sadowego", () => {
    expect(hasRolePermission("LAWYER", PERMISSIONS.CLAIM_CHANGE_STATUS)).toBe(
      true,
    );
    expect(canLawyerSetClaimStatus("COURT_STAGE")).toBe(true);
    expect(canLawyerSetClaimStatus("QUALIFIED")).toBe(false);
  });

  it("MARKETING nie ma dostepu do raportow finansowych", () => {
    expect(hasRolePermission("MARKETING", PERMISSIONS.REPORT_FINANCIAL)).toBe(
      false,
    );
  });
});

describe("EDITOR role - blog access control", () => {
  it("EDITOR ma dostep do zarzadzania blogiem", () => {
    expect(hasRolePermission("EDITOR", PERMISSIONS.BLOG_MANAGE)).toBe(true);
  });

  it("EDITOR nie ma dostepu do sprawozdan", () => {
    expect(hasRolePermission("EDITOR", PERMISSIONS.CLAIM_READ_ALL)).toBe(false);
    expect(hasRolePermission("EDITOR", PERMISSIONS.ADMIN_USERS)).toBe(false);
  });

  it("ADMIN ma dostep do zarzadzania blogiem", () => {
    expect(hasRolePermission("ADMIN", PERMISSIONS.BLOG_MANAGE)).toBe(true);
  });

  it("OPERATOR nie ma dostepu do zarzadzania blogiem", () => {
    expect(hasRolePermission("OPERATOR", PERMISSIONS.BLOG_MANAGE)).toBe(false);
  });

  it("READ_ONLY nie ma dostepu do zarzadzania blogiem", () => {
    expect(hasRolePermission("READ_ONLY", PERMISSIONS.BLOG_MANAGE)).toBe(false);
  });
});
