import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseEnv } from "@/lib/supabase/env";
import type { Database } from "@/types/supabase";

export function createClient() {
  const { url, publishableKey } = getSupabaseEnv();

  return createBrowserClient<Database>(url, publishableKey);
}
