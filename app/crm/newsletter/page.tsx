import type { Metadata } from "next";
import type { ComponentProps } from "react";

import { NewsletterPanel } from "@/components/newsletter/NewsletterPanel";
import { requireAuth } from "@/lib/auth-helpers";
import { PERMISSIONS, hasRolePermission } from "@/lib/trpc/permissions";
import { createTRPCCaller } from "@/lib/trpc/server";

export const metadata: Metadata = {
  title: "Newsletter | OWEME CRM",
};

export default async function NewsletterPage() {
  const currentUser = await requireAuth();

  if (!currentUser.appUser) {
    return null;
  }

  if (!hasRolePermission(currentUser.appUser.role, PERMISSIONS.NEWSLETTER_MANAGE)) {
    return (
      <main className="min-h-screen bg-neutral-50 px-4 py-6 text-neutral-950 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-lg border border-amber-200 bg-amber-50 p-6">
          <h1 className="text-xl font-semibold text-amber-800">Brak dostępu</h1>
          <p className="mt-2 text-sm text-amber-700">
            Newsletter jest dostępny dla ról ADMIN i EDITOR.
          </p>
        </div>
      </main>
    );
  }

  const trpc = await createTRPCCaller();
  const overview = JSON.parse(
    JSON.stringify(await trpc.newsletter.overview()),
  ) as ComponentProps<typeof NewsletterPanel>["overview"];

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-6 text-neutral-950 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <NewsletterPanel overview={overview} />
      </div>
    </main>
  );
}
