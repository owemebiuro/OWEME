import type { Metadata } from "next";

import { SystemLogs } from "@/components/admin/SystemLogs";
import { requireRole } from "@/lib/auth-helpers";
import { createTRPCCaller } from "@/lib/trpc/server";

export const metadata: Metadata = {
  title: "Logi systemu | OWEME CRM",
};

export default async function AdminLogsPage() {
  await requireRole(["ADMIN"]);
  const trpc = await createTRPCCaller();
  const logs = await trpc.users.systemLogs();

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-6 text-neutral-950 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <SystemLogs logs={logs} />
      </div>
    </main>
  );
}
