import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

import { getE2ECredentials } from "./env";

export async function loginAsE2EUser(page: Page) {
  const { email, password } = getE2ECredentials();

  await page.goto("/login");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL(/\/crm/);
}
