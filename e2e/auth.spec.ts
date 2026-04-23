import { expect, test } from "@playwright/test";

import { hasE2ECredentials, hasE2EDatabase } from "./helpers/env";

test.describe("Auth", () => {
  test("niezalogowany użytkownik trafia z /crm na /login", async ({ page }) => {
    await page.goto("/crm");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('input[name="email"]')).toBeVisible();
  });

  test("logowanie poprawnym hasłem przekierowuje do CRM", async ({ page }) => {
    test.skip(
      !hasE2EDatabase() || !hasE2ECredentials(),
      "Wymaga E2E_DATABASE_URL oraz OWEME_E2E_EMAIL/OWEME_E2E_PASSWORD.",
    );

    await page.goto("/login");
    await page.locator('input[name="email"]').fill(process.env.OWEME_E2E_EMAIL!);
    await page
      .locator('input[name="password"]')
      .fill(process.env.OWEME_E2E_PASSWORD!);
    await page.locator('button[type="submit"]').click();

    await expect(page).toHaveURL(/\/crm/);
    await expect(page.getByText("OWEME CRM").first()).toBeVisible();
  });

  test("logowanie błędnym hasłem pokazuje komunikat błędu", async ({ page }) => {
    test.skip(
      !hasE2EDatabase() || !process.env.OWEME_E2E_EMAIL,
      "Wymaga E2E_DATABASE_URL oraz OWEME_E2E_EMAIL.",
    );

    await page.goto("/login");
    await page.locator('input[name="email"]').fill(process.env.OWEME_E2E_EMAIL!);
    await page.locator('input[name="password"]').fill("wrong-password");
    await page.locator('button[type="submit"]').click();

    await expect(page.getByText(/Nie uda/)).toBeVisible();
  });
});
