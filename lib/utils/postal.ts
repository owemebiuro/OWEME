export const POSTAL_FORMATS: Record<string, RegExp> = {
  PL: /(\d{2})(\d{3})/,
  DE: /(\d{5})/,
  UK: /([A-Z]{1,2}\d[A-Z\d]?)(\d[A-Z]{2})/,
  GB: /([A-Z]{1,2}\d[A-Z\d]?)(\d[A-Z]{2})/,
};

export function formatPostalCode(countryCode: string, value: string): string {
  const normalized = value.trim().toUpperCase().replace(/\s|-/g, "");
  const country = countryCode.toUpperCase();

  if (country === "PL") {
    const match = normalized.match(POSTAL_FORMATS.PL);

    return match ? `${match[1]}-${match[2]}` : normalized;
  }

  if (country === "DE") {
    return normalized.slice(0, 5);
  }

  if (country === "UK" || country === "GB") {
    const match = normalized.match(POSTAL_FORMATS.UK);

    return match ? `${match[1]} ${match[2]}` : normalized;
  }

  return value.trim();
}
