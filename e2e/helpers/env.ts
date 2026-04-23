export function hasE2ECredentials() {
  return Boolean(process.env.OWEME_E2E_EMAIL && process.env.OWEME_E2E_PASSWORD);
}

export function hasE2EDatabase() {
  return Boolean(process.env.E2E_DATABASE_URL);
}

export function getE2ECredentials() {
  const email = process.env.OWEME_E2E_EMAIL;
  const password = process.env.OWEME_E2E_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Set OWEME_E2E_EMAIL and OWEME_E2E_PASSWORD before running authenticated E2E tests.",
    );
  }

  return { email, password };
}
