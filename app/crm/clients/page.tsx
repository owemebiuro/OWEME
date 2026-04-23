import type { Metadata } from "next";

import { ClientsTable } from "@/components/clients/ClientsTable";
import { requireAuth } from "@/lib/auth-helpers";
import type { ClientsListData } from "@/lib/clients/types";
import {
  parseClientsListInput,
  type ClientsRouteSearchParams,
} from "@/lib/clients/url-filters";
import { createTRPCCaller } from "@/lib/trpc/server";

export const metadata: Metadata = {
  title: "Klienci | OWEME CRM",
};

type ClientsPageProps = {
  searchParams: Promise<ClientsRouteSearchParams>;
};

type TRPCCaller = Awaited<ReturnType<typeof createTRPCCaller>>;
type ClientsListResult = Awaited<ReturnType<TRPCCaller["clients"]["list"]>>;

function serializeClientsList(data: ClientsListResult): ClientsListData {
  return {
    ...data,
    items: data.items.map((client) => ({
      id: client.id,
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email,
      phone: client.phone,
      city: client.city,
      country: client.country,
      status: client.status,
      createdAt:
        client.createdAt instanceof Date
          ? client.createdAt.toISOString()
          : client.createdAt,
      claimsCount: client._count.claims,
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
          Sesja Supabase jest aktywna{email ? ` dla ${email}` : ""}, ale lista
          klientów wymaga powiązanego użytkownika aplikacyjnego CRM.
        </p>
      </div>
    </main>
  );
}

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  const currentUser = await requireAuth();

  if (!currentUser.appUser) {
    return <AppUserMissingState email={currentUser.authUser.email} />;
  }

  const trpc = await createTRPCCaller();
  const listInput = parseClientsListInput(await searchParams);
  const clients = await trpc.clients.list(listInput);

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-6 text-neutral-950 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <ClientsTable data={serializeClientsList(clients)} />
      </div>
    </main>
  );
}
