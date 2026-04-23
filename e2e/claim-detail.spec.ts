import { expect, test } from "@playwright/test";

import { loginAsE2EUser } from "./helpers/auth";
import { hasE2ECredentials, hasE2EDatabase } from "./helpers/env";

async function openFirstClaim(page: import("@playwright/test").Page) {
  await page.goto("/crm/claims");

  const firstClaim = page.locator('a[href^="/crm/claims/"]').first();

  if ((await firstClaim.count()) === 0) {
    test.skip(true, "Seed E2E nie zawiera spraw do testowania karty.");
  }

  await firstClaim.click();
  await expect(page).toHaveURL(/\/crm\/claims\/[^/]+$/);
}

test.describe("Karta sprawy", () => {
  test.beforeEach(async () => {
    test.skip(
      !hasE2EDatabase() || !hasE2ECredentials(),
      "Wymaga E2E_DATABASE_URL oraz OWEME_E2E_EMAIL/OWEME_E2E_PASSWORD.",
    );
  });

  test("laduje glowne sekcje karty sprawy", async ({ page }) => {
    await loginAsE2EUser(page);
    await openFirstClaim(page);

    await expect(page.getByTestId("claim-tab-details")).toBeVisible();
    await expect(page.getByTestId("claim-tab-documents")).toBeVisible();
    await expect(page.getByTestId("claim-tab-attachments")).toBeVisible();
    await expect(page.getByTestId("claim-tab-notes")).toBeVisible();
    await expect(page.getByTestId("claim-tab-tasks")).toBeVisible();
    await expect(page.getByTestId("claim-tab-history")).toBeVisible();
  });

  test("dodanie notatki odswieza liste notatek", async ({ page }) => {
    await loginAsE2EUser(page);
    await openFirstClaim(page);

    const noteText = `Notatka E2E ${Date.now()}`;

    await page.getByTestId("claim-tab-notes").click();
    await page.getByTestId("claim-note-content").fill(noteText);
    await page.getByTestId("claim-note-submit").click();

    await expect(page.getByText(noteText)).toBeVisible();
  });

  test.skip(
    "zmiana statusu wymaga stabilnego scenariusza danych domenowych",
    async () => {
      // Statusy maja walidacje biznesowe zalezne od dokumentow, payoutow
      // i jurysdykcji, wiec stabilny test E2E powinien uzywac dedykowanego seeda.
    },
  );
});
