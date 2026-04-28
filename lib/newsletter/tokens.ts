import { createHmac, timingSafeEqual } from "crypto";

type UnsubscribePayload = {
  email: string;
  campaignId?: string;
  exp: number;
};

function base64UrlEncode(value: string) {
  return Buffer.from(value).toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function getTokenSecret() {
  return (
    process.env.INNGEST_SIGNING_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.RESEND_API_KEY ||
    "oweme-local-newsletter-secret"
  );
}

function signPayload(payload: string) {
  return createHmac("sha256", getTokenSecret()).update(payload).digest("base64url");
}

export function createUnsubscribeToken(input: {
  email: string;
  campaignId?: string;
  days?: number;
}) {
  const payload: UnsubscribePayload = {
    email: input.email.toLowerCase(),
    campaignId: input.campaignId,
    exp: Math.floor(Date.now() / 1000) + (input.days ?? 30) * 24 * 60 * 60,
  };
  const encoded = base64UrlEncode(JSON.stringify(payload));
  return `${encoded}.${signPayload(encoded)}`;
}

export function verifyUnsubscribeToken(token: string) {
  const [encoded, signature] = token.split(".");

  if (!encoded || !signature) {
    return null;
  }

  const expected = signPayload(encoded);
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);

  if (
    expectedBuffer.length !== signatureBuffer.length ||
    !timingSafeEqual(expectedBuffer, signatureBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encoded)) as UnsubscribePayload;

    if (!payload.email || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
