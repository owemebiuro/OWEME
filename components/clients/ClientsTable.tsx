import Link from "next/link";

import { ClientsFilters } from "@/components/clients/ClientsFilters";
import { ClientsPagination } from "@/components/clients/ClientsPagination";
import type { ClientsListData } from "@/lib/clients/types";
import { formatPhone } from "@/lib/utils/phone";

type ClientsTableProps = {
  data: ClientsListData;
};

export function ClientsTable({ data }: ClientsTableProps) {
  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-neutral-500">OWEME CRM</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950">
            Klienci
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
            Szybka baza kontaktów, historii spraw i danych operacyjnych.
          </p>
        </div>
        <div className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-600">
          <span className="font-semibold text-neutral-950">{data.total}</span>{" "}
          klientów w widoku
        </div>
      </header>

      <ClientsFilters />

      <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead className="bg-neutral-50 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3">Klient</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Telefon</th>
                <th className="px-4 py-3">PESEL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-sm">
              {data.items.length ? (
                data.items.map((client) => (
                  <tr key={client.id} className="transition hover:bg-neutral-50">
                    <td className="px-4 py-4">
                      <Link
                        href={`/crm/clients/${client.id}`}
                        className="font-semibold text-neutral-950 underline-offset-4 hover:underline"
                      >
                        {client.firstName} {client.lastName}
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-neutral-600">
                      {client.email}
                    </td>
                    <td className="px-4 py-4 text-neutral-600">
                      {client.phone ? formatPhone(client.phone) : "Brak"}
                    </td>
                    <td className="px-4 py-4 text-neutral-600">
                      {client.pesel ?? "Brak"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-14 text-center">
                    <p className="text-base font-semibold text-neutral-950">
                      Brak klientów w tym widoku
                    </p>
                    <p className="mt-2 text-sm text-neutral-500">
                      Zmień wyszukiwanie albo dodaj pierwszego klienta.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <ClientsPagination
          page={data.page}
          pageSize={data.pageSize}
          total={data.total}
          totalPages={data.totalPages}
        />
      </section>
    </div>
  );
}
