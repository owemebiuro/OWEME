"use client";

import { useState } from "react";

import type { ClientDetailData, ClientFormValues } from "@/lib/clients/types";
import { api } from "@/lib/trpc/hooks";

type ClientEditModalProps = {
  client: ClientDetailData;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
};

function initialForm(client: ClientDetailData): ClientFormValues {
  return {
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
  };
}

function nullableValue(value: string) {
  return value.trim() || null;
}

export function ClientEditModal({
  client,
  isOpen,
  onClose,
  onSaved,
}: ClientEditModalProps) {
  const [form, setForm] = useState<ClientFormValues>(() => initialForm(client));
  const updateClient = api.clients.update.useMutation({
    onSuccess: () => {
      onSaved();
      onClose();
    },
  });

  if (!isOpen) {
    return null;
  }

  function updateField(field: keyof ClientFormValues, value: string) {
    setForm((current) => ({
      ...current,
      [field]:
        field === "phone" ||
        field === "nationality" ||
        field === "address" ||
        field === "postalCode" ||
        field === "city" ||
        field === "idDocumentNumber"
          ? nullableValue(value)
          : value,
    }));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/50 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="client-edit-title"
    >
      <div className="w-full max-w-2xl rounded-lg border border-neutral-200 bg-white shadow-xl">
        <div className="border-b border-neutral-200 px-5 py-4">
          <h2 id="client-edit-title" className="text-lg font-semibold">
            Edytuj dane klienta
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Zmień tylko dane kontaktowe i operacyjne klienta.
          </p>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            updateClient.mutate({
              id: client.id,
              ...form,
            });
          }}
        >
          <div className="grid max-h-[70vh] gap-3 overflow-y-auto px-5 py-4 sm:grid-cols-2">
            {[
              ["firstName", "Imię"],
              ["lastName", "Nazwisko"],
              ["email", "Email"],
              ["phone", "Telefon"],
              ["nationality", "Narodowość"],
              ["idDocumentNumber", "Numer dokumentu"],
              ["address", "Adres"],
              ["postalCode", "Kod pocztowy"],
              ["city", "Miasto"],
              ["country", "Kraj"],
              ["status", "Status"],
            ].map(([field, label]) => (
              <label
                key={field}
                className={field === "address" ? "block sm:col-span-2" : "block"}
              >
                <span className="text-sm font-semibold text-neutral-700">
                  {label}
                </span>
                <input
                  value={String(form[field as keyof ClientFormValues] ?? "")}
                  onChange={(event) =>
                    updateField(
                      field as keyof ClientFormValues,
                      event.target.value,
                    )
                  }
                  className="mt-1 h-10 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-neutral-950"
                />
              </label>
            ))}

            {updateClient.error ? (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">
                {updateClient.error.message}
              </p>
            ) : null}
          </div>

          <div className="flex justify-end gap-2 border-t border-neutral-200 px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={updateClient.isPending}
              className="h-10 rounded-md border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-700 transition hover:border-neutral-400 disabled:cursor-wait disabled:opacity-50"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={updateClient.isPending}
              className="h-10 rounded-md bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-wait disabled:opacity-50"
            >
              Zapisz
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
