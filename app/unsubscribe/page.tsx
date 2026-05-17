import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { verifyUnsubscribeToken } from "@/lib/newsletter/tokens";

export const metadata: Metadata = {
  title: "Wypisanie z newslettera | OWEME",
};

type UnsubscribePageProps = {
  searchParams: Promise<{
    token?: string;
  }>;
};

export default async function UnsubscribePage({ searchParams }: UnsubscribePageProps) {
  const { token } = await searchParams;

  if (!token) {
    redirect("/");
  }

  const payload = verifyUnsubscribeToken(token);

  if (!payload) {
    return (
      <main className="min-h-screen bg-neutral-50 px-4 py-16 text-neutral-950">
        <section className="mx-auto max-w-xl rounded-lg border border-red-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold">Link jest nieprawidłowy</h1>
          <p className="mt-3 text-sm leading-6 text-neutral-600">
            Nie mogliśmy potwierdzić tokenu wypisania. Skontaktuj się z OWEME,
            jeśli nadal otrzymujesz wiadomości.
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex items-center justify-center rounded-md bg-neutral-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800"
          >
            Wróć na stronę główną
          </Link>
        </section>
      </main>
    );
  }

  await prisma.newsletterSubscriber.upsert({
    where: { email: payload.email },
    create: {
      email: payload.email,
      status: "UNSUBSCRIBED",
      unsubscribedAt: new Date(),
      unsubscribeReason: "unsubscribe_link",
      source: "unsubscribe",
    },
    update: {
      status: "UNSUBSCRIBED",
      unsubscribedAt: new Date(),
      unsubscribeReason: "unsubscribe_link",
    },
  });

  if (payload.campaignId) {
    await prisma.newsletterEmailLog.updateMany({
      where: {
        campaignId: payload.campaignId,
        recipientEmail: payload.email,
      },
      data: {
        status: "UNSUBSCRIBED",
      },
    });
  }

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-16 text-neutral-950">
      <section className="mx-auto max-w-xl rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Wypisanie potwierdzone</h1>
        <p className="mt-3 text-sm leading-6 text-neutral-600">
          Adres {payload.email} został wypisany z newslettera OWEME. Zmiana działa
          natychmiast dla kolejnych kampanii.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex items-center justify-center rounded-md bg-neutral-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-800"
        >
          Wróć na stronę główną
        </Link>
      </section>
    </main>
  );
}
