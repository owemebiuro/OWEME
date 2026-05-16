"use client";

import { useEffect } from "react";

const UPDATE_PASSWORD_PATH = "/auth/update-password";

function hasRecoveryRedirectParams() {
  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;
  const hashParams = new URLSearchParams(hash);
  const searchParams = new URLSearchParams(window.location.search);
  const type = hashParams.get("type") ?? searchParams.get("type");

  if (type !== "recovery" && type !== "invite") {
    return false;
  }

  return (
    hashParams.has("access_token") ||
    hashParams.has("refresh_token") ||
    hashParams.has("error") ||
    searchParams.has("code") ||
    searchParams.has("error")
  );
}

export function AuthRecoveryRedirect() {
  useEffect(() => {
    if (
      window.location.pathname === UPDATE_PASSWORD_PATH ||
      !hasRecoveryRedirectParams()
    ) {
      return;
    }

    const nextUrl = new URL(UPDATE_PASSWORD_PATH, window.location.origin);
    nextUrl.search = window.location.search;
    nextUrl.hash = window.location.hash;
    window.location.replace(nextUrl.toString());
  }, []);

  return null;
}
