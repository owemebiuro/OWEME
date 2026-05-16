const PHONE_FORMATS: Record<string, { grouping: number[]; separator: string }> = {
  "+48": { grouping: [3, 3, 3], separator: " " },
  "+49": { grouping: [3, 7], separator: " " },
  "+44": { grouping: [4, 6], separator: " " },
  "+33": { grouping: [1, 2, 2, 2, 2], separator: " " },
  "+1": { grouping: [3, 3, 4], separator: "-" },
  default: { grouping: [3, 3, 4], separator: " " },
};

export const PHONE_COUNTRY_CODES = [
  { country: "PL", flag: "🇵🇱", code: "+48", label: "Polska" },
  { country: "DE", flag: "🇩🇪", code: "+49", label: "Niemcy" },
  { country: "GB", flag: "🇬🇧", code: "+44", label: "Wielka Brytania" },
  { country: "FR", flag: "🇫🇷", code: "+33", label: "Francja" },
  { country: "US", flag: "🇺🇸", code: "+1", label: "USA" },
] as const;

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

function findDialCode(value: string) {
  return Object.keys(PHONE_FORMATS)
    .filter((code) => code !== "default")
    .sort((first, second) => second.length - first.length)
    .find((code) => value.startsWith(code));
}

function groupDigits(
  digits: string,
  grouping: number[],
  separator: string,
): string {
  const chunks: string[] = [];
  let cursor = 0;

  for (const size of grouping) {
    const chunk = digits.slice(cursor, cursor + size);

    if (!chunk) {
      break;
    }

    chunks.push(chunk);
    cursor += size;
  }

  if (cursor < digits.length) {
    chunks.push(digits.slice(cursor));
  }

  return chunks.join(separator);
}

export function formatPhone(e164: string | null | undefined): string {
  if (!e164) {
    return "";
  }

  const normalized = e164.trim().replace(/[^\d+]/g, "");
  const code = findDialCode(normalized);

  if (!code) {
    return normalized;
  }

  const format = PHONE_FORMATS[code] ?? PHONE_FORMATS.default;
  const rest = digitsOnly(normalized.slice(code.length));
  const grouped = groupDigits(rest, format.grouping, format.separator);

  return grouped ? `${code} ${grouped}` : code;
}

export function formatNationalPhone(dialCode: string, value: string): string {
  const format = PHONE_FORMATS[dialCode] ?? PHONE_FORMATS.default;

  return groupDigits(digitsOnly(value), format.grouping, format.separator);
}

export function toE164(dialCode: string, nationalValue: string): string | null {
  const digits = digitsOnly(nationalValue);

  return digits ? `${dialCode}${digits}` : null;
}

export function splitPhone(e164: string | null | undefined) {
  const fallback = PHONE_COUNTRY_CODES[0];

  if (!e164) {
    return { dialCode: fallback.code, nationalNumber: "" };
  }

  const normalized = e164.trim().replace(/[^\d+]/g, "");
  const dialCode = findDialCode(normalized) ?? fallback.code;

  return {
    dialCode,
    nationalNumber: formatNationalPhone(dialCode, normalized.slice(dialCode.length)),
  };
}
