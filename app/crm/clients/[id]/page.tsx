import { TRPCError } from "@trpc/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ClientDetailView } from "@/components/clients/ClientDetailView";
import { requireAuth } from "@/lib/auth-helpers";
import type { ClientDetailData } from "@/lib/clients/types";
import { createTRPCCaller } from "@/lib/trpc/server";

type ClientPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type TRPCCaller = Awaited<ReturnType<typeof createTRPCCaller>>;
type ClientByIdResult = Awaited<ReturnType<TRPCCaller["clients"]["getById"]>>;

export async function generateMetadata({
  params,
}: ClientPageProps): Promise<Metadata> {
  const { id } = await params;

  return {
    title: `Klient ${id} | OWEME CRM`,
  };
}

function serializeDate(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value.toISOString() : value;
}

function serializeClient(client: ClientByIdResult): ClientDetailData {
  return {
    id: client.id,
    firstName: client.firstName,
    lastName: client.lastName,
    email: client.email,
    phone: client.phone,
    nationality: client.nationality,
    address: client.address,
    postalCode: client.postalCode,
    city: client.city,
    country: client.country,
    idDocumentNumber: client.idDocumentNumber,
    status: client.status,
    createdAt: serializeDate(client.createdAt) ?? "",
    updatedAt: serializeDate(client.updatedAt) ?? "",
    claimsCount: client._count.claims,
    claims: client.claims.map((claim) => ({
      id: claim.id,
      claimNumber: claim.claimNumber,
      status: claim.status,
      type: claim.type,
      createdAt: serializeDate(claim.createdAt) ?? "",
      potentialAmount: claim.potentialAmount?.toString() ?? null,
      airline: claim.airline,
      flight: claim.flight
        ? {
            flightNumber: claim.flight.flightNumber,
            flightDate: serializeDate(claim.flight.flightDate) ?? "",
          }
        : null,
    })),
  };
}

function AppUserMissingState({ email }: { email: string | undefined }) {
  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-8 text-neutral-950">
      <div className="mx-auto max-w-3xl rounded-lg border border-amber-200 bg-amber-50 p-6">
        <p className="text-sm font-semibold text-amber-700">OWEME CRM</p>
        <h1 className="mt-2 text-2xl font-semibold">
          Brak użytkownika aplikacyjnego
        </h1>
        <p className="mt-3 text-sm leading-6 text-amber-900">
          Sesja Supabase jest aktywna{email ? ` dla ${email}` : ""}, ale karta
          klienta wymaga powiązanego użytkownika aplikacyjnego CRM.
        </p>
      </div>
    </main>
  );
}

export default async function ClientPage({ params }: ClientPageProps) {
  const currentUser = await requireAuth();

  if (!currentUser.appUser) {
    return <AppUserMissingState email={currentUser.authUser.email} />;
  }

  const { id } = await params;
  const trpc = await createTRPCCaller();
  let client: ClientByIdResult;

  try {
    client = await trpc.clients.getById({ id });
  } catch (error) {
    if (error instanceof TRPCError && error.code === "NOT_FOUND") {
      notFound();
    }

    throw error;
  }

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <ClientDetailView client={serializeClient(client)} />
    </main>
  );
}
