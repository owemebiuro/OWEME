import { createClient } from "@supabase/supabase-js";

import { getSupabaseEnv } from "@/lib/supabase/env";
import type { Database } from "@/types/supabase";

function isValidAdminKeyFormat(value: string) {
  if (value.startsWith("sb_secret_")) {
    return true;
  }

  if (!value.startsWith("eyJ")) {
    return false;
  }

  return value.split(".").length === 3;
}

export function getSupabaseAdminConfigurationStatus() {
  const missingEnv: string[] = [];
  const invalidEnv: string[] = [];

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    missingEnv.push("SUPABASE_SERVICE_ROLE_KEY");
  } else if (!isValidAdminKeyFormat(process.env.SUPABASE_SERVICE_ROLE_KEY)) {
    invalidEnv.push("SUPABASE_SERVICE_ROLE_KEY");
  }

  return {
    configured: missingEnv.length === 0 && invalidEnv.length === 0,
    missingEnv,
    invalidEnv,
  };
}

export function createSupabaseAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    return null;
  }

  if (!isValidAdminKeyFormat(serviceRoleKey)) {
    return null;
  }

  const { url } = getSupabaseEnv();

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function getSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ??
    "http://localhost:3000"
  );
}
