"use client";

import { useState } from "react";

import {
  CLIENT_STATUS_LABELS,
  CLIENT_STATUSES,
  type ClientStatus,
  normalizeClientStatus,
} from "@/lib/clients/status";
import type { ClientDetailData, ClientFormValues } from "@/lib/clients/types";
import { api } from "@/lib/trpc/hooks";
import { formatPostalCode } from "@/lib/utils/postal";
import {
  PHONE_COUNTRY_CODES,
  formatNationalPhone,
  splitPhone,
  toE164,
} from "@/lib/utils/phone";

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
    pesel: client.pesel,
    nationality: client.nationality,
    address: client.address,
    postalCode: client.postalCode,
    city: client.city,
    country: client.country,
    countryCode: client.countryCode ?? client.country,
    documentType: client.documentType,
    documentNumber: client.documentNumber,
    documentSeries: client.documentSeries,
    idDocumentNumber: client.idDocumentNumber,
    status: normalizeClientStatus(client.status),
  };
}

function nullableValue(value: string) {
  return value.trim() || null;
}

type InputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
};

function TextInput({ label, value, onChange, className }: InputProps) {
  return (
    <label className={className ?? "block"}>
      <span className="text-sm font-semibold text-neutral-700">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 h-10 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-neutral-950"
      />
    </label>
  );
}

export function ClientEditModal({
  client,
  isOpen,
  onClose,
  onSaved,
}: ClientEditModalProps) {
  const [form, setForm] = useState<ClientFormValues>(() => initialForm(client));
  const initialPhone = splitPhone(client.phone);
  const [phoneDialCode, setPhoneDialCode] = useState(initialPhone.dialCode);
  const [phoneNumber, setPhoneNumber] = useState(initialPhone.nationalNumber);
  const updateClient = api.clients.update.useMutation({
    onSuccess: () => {
      onSaved();
      onClose();
    },
  });

  if (!isOpen) {
    return null;
  }

  function updateField(field: keyof ClientFormValues, value: string | null) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleCountryChange(value: string) {
    updateField("country", value.toUpperCase());
    updateField("countryCode", value.toUpperCase());
    updateField(
      "postalCode",
      form.postalCode ? formatPostalCode(value, form.postalCode) : null,
    );
  }

  return (
    <div
      className="crm-modal-backdrop fixed inset-0 z-50 flex items-center justify-center overflow-y-auto px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="client-edit-title"
    >
      <div className="crm-modal-surface w-full max-w-2xl overflow-hidden">
        <div className="border-b border-white/50 px-5 py-4">
          <h2 id="client-edit-title" className="text-lg font-semibold">
            Edytuj dane klienta
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Dane kontaktowe są normalizowane do CRM podczas zapisu.
          </p>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            updateClient.mutate({
              id: client.id,
              ...form,
              phone: toE164(phoneDialCode, phoneNumber),
              postalCode: form.postalCode
                ? formatPostalCode(form.countryCode ?? form.country, form.postalCode)
                : null,
              status: normalizeClientStatus(form.status),
            });
          }}
        >
          <div className="grid max-h-[70vh] gap-3 overflow-y-auto px-5 py-4 sm:grid-cols-2">
            <TextInput
              label="Imię"
              value={form.firstName}
              onChange={(value) => updateField("firstName", value)}
            />
            <TextInput
              label="Nazwisko"
              value={form.lastName}
              onChange={(value) => updateField("lastName", value)}
            />
            <TextInput
              label="Email"
              value={form.email}
              onChange={(value) => updateField("email", value)}
            />
            <label className="block">
              <span className="text-sm font-semibold text-neutral-700">
                Telefon
              </span>
              <div className="mt-1 grid grid-cols-[120px_1fr] gap-2">
                <select
                  value={phoneDialCode}
                  onChange={(event) => {
                    setPhoneDialCode(event.target.value);
                    setPhoneNumber("");
                  }}
                  onBlur={() => setPhoneNumber((value) => value.trim())}
                  className="h-10 rounded-md border border-neutral-200 bg-white px-2 text-sm outline-none focus:border-neutral-950"
                >
                  {PHONE_COUNTRY_CODES.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.flag} {item.code}
                    </option>
                  ))}
                </select>
                <input
                  value={phoneNumber}
                  onChange={(event) =>
                    setPhoneNumber(
                      formatNationalPhone(phoneDialCode, event.target.value),
                    )
                  }
                  onBlur={() =>
                    setPhoneNumber((value) =>
                      formatNationalPhone(phoneDialCode, value),
                    )
                  }
                  className="h-10 rounded-md border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-neutral-950"
                />
              </div>
            </label>

            <TextInput
              label="PESEL"
              value={form.pesel ?? ""}
              onChange={(value) => updateField("pesel", nullableValue(value))}
            />
            <TextInput
              label="Narodowość"
              value={form.nationality ?? ""}
              onChange={(value) =>
                updateField("nationality", nullableValue(value))
              }
            />
            <TextInput
              label="Adres"
              value={form.address ?? ""}
              onChange={(value) => updateField("address", nullableValue(value))}
              className="block sm:col-span-2"
            />
            <TextInput
              label="Kod pocztowy"
              value={form.postalCode ?? ""}
              onChange={(value) =>
                updateField(
                  "postalCode",
                  value ? formatPostalCode(form.countryCode ?? form.country, value) : null,
                )
              }
            />
            <TextInput
              label="Miasto"
              value={form.city ?? ""}
              onChange={(value) => updateField("city", nullableValue(value))}
            />
            <TextInput
              label="Kraj"
              value={form.country}
              onChange={handleCountryChange}
            />
            <label className="block">
              <span className="text-sm font-semibold text-neutral-700">
                Status
              </span>
              <select
                value={normalizeClientStatus(form.status)}
                onChange={(event) =>
                  updateField("status", event.target.value as ClientStatus)
                }
                className="mt-1 h-10 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-neutral-950"
              >
                {CLIENT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {CLIENT_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </label>
            <TextInput
              label="Typ dokumentu"
              value={form.documentType ?? ""}
              onChange={(value) =>
                updateField("documentType", nullableValue(value))
              }
            />
            <TextInput
              label="Seria dokumentu"
              value={form.documentSeries ?? ""}
              onChange={(value) =>
                updateField("documentSeries", nullableValue(value))
              }
            />
            <TextInput
              label="Numer dokumentu"
              value={form.documentNumber ?? form.idDocumentNumber ?? ""}
              onChange={(value) => {
                const normalized = nullableValue(value);
                updateField("documentNumber", normalized);
                updateField("idDocumentNumber", normalized);
              }}
            />

            {updateClient.error ? (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">
                {updateClient.error.message}
              </p>
            ) : null}
          </div>

          <div className="flex justify-end gap-2 border-t border-white/50 px-5 py-4">
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
