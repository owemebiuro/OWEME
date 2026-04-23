import { expect, test } from "@playwright/test";

import { loginAsE2EUser } from "./helpers/auth";
import { hasE2ECredentials, hasE2EDatabase } from "./helpers/env";

test.describe("Lista spraw", () => {
  test.beforeEach(async () => {
    test.skip(
      !hasE2EDatabase() || !hasE2ECredentials(),
      "Wymaga E2E_DATABASE_URL oraz OWEME_E2E_EMAIL/OWEME_E2E_PASSWORD.",
    );
  });

  test("lista spraw jest widoczna po zalogowaniu jako operator", async ({
    page,
  }) => {
    await loginAsE2EUser(page);
    await page.goto("/crm/claims");

    await expect(page).toHaveURL(/\/crm\/claims/);
    await expect(page.getByRole("heading", { name: "Sprawy" })).toBeVisible();
    await expect(page.locator("table")).toBeVisible();
  });

  test("preset statusu NEW zapisuje filtr w URL", async ({ page }) => {
    await loginAsE2EUser(page);
    await page.goto("/crm/claims");

    await page.getByRole("button", { name: "Nowe sprawy" }).click();

    await expect(page).toHaveURL(/status=NEW/);
  });

  test("klikniecie w sprawe otwiera karte sprawy", async ({ page }) => {
    await loginAsE2EUser(page);
    await page.goto("/crm/claims");

    const firstClaim = page.locator('a[href^="/crm/claims/"]').first();

    if ((await firstClaim.count()) === 0) {
      test.skip(true, "Seed E2E nie zawiera spraw do otwarcia.");
    }

    await firstClaim.click();

    await expect(page).toHaveURL(/\/crm\/claims\/[^/]+$/);
    await expect(page.getByTestId("claim-tab-details")).toBeVisible();
  });
});
