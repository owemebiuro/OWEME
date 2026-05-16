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
        <div className="mx-auto max-w-3xl rounded-lg border border-[rgba(27,111,212,0.22)] bg-[var(--ember-bg)] p-6">
          <h1 className="text-xl font-semibold text-[var(--ember-lo)]">Brak dostępu</h1>
          <p className="mt-2 text-sm text-[var(--ember-lo)]">
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
