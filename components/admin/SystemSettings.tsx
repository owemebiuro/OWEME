"use client";

import { useState } from "react";

type SettingsSectionProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
};

function SettingsSection({ title, description, children }: SettingsSectionProps) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white shadow-sm">
      <div className="border-b border-neutral-100 px-5 py-4">
        <h2 className="font-semibold text-neutral-950">{title}</h2>
        {description && <p className="mt-1 text-sm text-neutral-500">{description}</p>}
      </div>
      <div className="space-y-4 p-5">{children}</div>
    </div>
  );
}

function FieldRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-8">
      <div className="sm:w-52 sm:shrink-0">
        <p className="text-sm font-medium text-neutral-950">{label}</p>
        {description && <p className="mt-0.5 text-xs text-neutral-500">{description}</p>}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

const inputClass =
  "w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-950 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-950 disabled:bg-neutral-50 disabled:text-neutral-500";

export function SystemSettings() {
  const [saved, setSaved] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold text-neutral-500">OWEME CRM — Admin</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950">
          Ustawienia systemu
        </h1>
        <p className="mt-2 text-sm leading-6 text-neutral-600">
          Konfiguracja ogólna aplikacji OWEME CRM.
        </p>
      </header>

      {saved && (
        <div className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm font-medium text-teal-800">
          Ustawienia zostały zapisane.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <SettingsSection
          title="Dane firmy"
          description="Podstawowe informacje o kancelarii wyświetlane w dokumentach."
        >
          <FieldRow label="Nazwa firmy">
            <input
              type="text"
              defaultValue="OWEME Sp. z o.o."
              className={inputClass}
            />
          </FieldRow>
          <FieldRow label="NIP">
            <input
              type="text"
              defaultValue=""
              placeholder="000-000-00-00"
              className={inputClass}
            />
          </FieldRow>
          <FieldRow label="Adres">
            <input
              type="text"
              defaultValue=""
              placeholder="ul. Przykładowa 1, 00-000 Warszawa"
              className={inputClass}
            />
          </FieldRow>
          <FieldRow label="Email kontaktowy">
            <input
              type="email"
              defaultValue=""
              placeholder="kontakt@oweme.pl"
              className={inputClass}
            />
          </FieldRow>
          <FieldRow label="Telefon">
            <input
              type="tel"
              defaultValue=""
              placeholder="+48 000 000 000"
              className={inputClass}
            />
          </FieldRow>
        </SettingsSection>

        <SettingsSection
          title="Parametry spraw"
          description="Domyślne wartości stosowane przy tworzeniu nowych spraw."
        >
          <FieldRow label="Domyślny model prowizji">
            <select className={inputClass} defaultValue="STANDARD_30">
              <option value="STANDARD_30">Standard 30%</option>
              <option value="COURT_40">Sądowy 40%</option>
            </select>
          </FieldRow>
          <FieldRow
            label="Domyślna jurysdykcja"
            description="Czy nowe sprawy domyślnie podlegają polskiemu prawu?"
          >
            <select className={inputClass} defaultValue="PL">
              <option value="PL">Polska</option>
              <option value="EU">EU (inne)</option>
            </select>
          </FieldRow>
        </SettingsSection>

        <SettingsSection
          title="Powiadomienia"
          description="Konfiguracja automatycznych powiadomień email."
        >
          <FieldRow
            label="Email potwierdzenia sprawy"
            description="Wysyłany klientowi przy rejestracji nowej sprawy."
          >
            <div className="flex items-center gap-2">
              <input type="checkbox" id="notif-claim-registered" defaultChecked className="h-4 w-4 accent-neutral-950" />
              <label htmlFor="notif-claim-registered" className="text-sm text-neutral-700">Aktywny</label>
            </div>
          </FieldRow>
          <FieldRow
            label="Email o zmianie statusu"
            description="Wysyłany klientowi przy ważnych zmianach statusu."
          >
            <div className="flex items-center gap-2">
              <input type="checkbox" id="notif-status-change" defaultChecked className="h-4 w-4 accent-neutral-950" />
              <label htmlFor="notif-status-change" className="text-sm text-neutral-700">Aktywny</label>
            </div>
          </FieldRow>
        </SettingsSection>

        <SettingsSection
          title="Wersja i środowisko"
          description="Informacje tylko do odczytu."
        >
          <FieldRow label="Wersja aplikacji">
            <input type="text" value="0.1.0" disabled className={inputClass} />
          </FieldRow>
          <FieldRow label="Środowisko">
            <input
              type="text"
              value={process.env.NODE_ENV ?? "production"}
              disabled
              className={inputClass}
            />
          </FieldRow>
        </SettingsSection>

        <div className="flex justify-end gap-3">
          <button
            type="submit"
            className="rounded-md bg-neutral-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800"
          >
            Zapisz zmiany
          </button>
        </div>
      </form>
    </div>
  );
}
