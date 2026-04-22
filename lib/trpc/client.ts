"use client";

import { httpBatchLink } from "@trpc/client";

import { api } from "@/lib/trpc/hooks";

function getBaseUrl() {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

export function createTRPCReactClient() {
  return api.createClient({
    links: [
      httpBatchLink({
        url: `${getBaseUrl()}/api/trpc`,
      }),
    ],
  });
}
