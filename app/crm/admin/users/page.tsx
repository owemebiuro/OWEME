import type { Metadata } from "next";

import { UsersTable } from "@/components/admin/users/UsersTable";
import { requireRole } from "@/lib/auth-helpers";
import { getSupabaseAdminConfigurationStatus } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Użytkownicy | OWEME CRM",
};

export default async function AdminUsersPage() {
  const currentUser = await requireRole(["ADMIN"]);
  const supabaseAdminStatus = getSupabaseAdminConfigurationStatus();

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-6 text-neutral-950 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <UsersTable
          currentUserId={currentUser.appUser.id}
          supabaseAdminStatus={supabaseAdminStatus}
        />
      </div>
    </main>
  );
}
