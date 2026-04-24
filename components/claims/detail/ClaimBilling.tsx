"use client";

import { useState } from "react";

import type { ClaimDetailData } from "@/lib/claims/detail-types";
import { generateTransferTitle, formatDate } from "@/lib/claims/format";
import type { ClaimsCurrentUser } from "@/lib/claims/types";
import { PERMISSIONS, hasRolePermission } from "@/lib/trpc/permissions.shared";
import { api } from "@/lib/trpc/hooks";

type ClaimBillingProps = {
  claim: ClaimDetailData;
  currentUser: ClaimsCurrentUser;
  onChanged: () => void;
};

function CheckRow({
  id,
  label,
  checked,
  dateValue,
  canEdit,
  onCheck,
  onDate,
}: {
  id: string;
  label: string;
  checked: boolean;
  dateValue: string;
  canEdit: boolean;
  onCheck: (v: boolean) => void;
  onDate: (v: string) => void;
}) {
  return (
    <div className="flex items-start gap-3">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onCheck(e.target.checked)}
        disabled={!canEdit}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-neutral-300 accent-neutral-950 disabled:opacity-50"
      />
      <div className="flex flex-1 flex-wrap items-center justify-between gap-2">
        <label
          htmlFor={id}
          className={`text-sm font-semibold ${canEdit ? "cursor-pointer" : ""} text-neutral-950`}
        >
          {label}
        </label>
        {canEdit ? (
          <input
            type="date"
            value={dateValue}
            onChange={(e) => onDate(e.target.value)}
            className="h-8 rounded-md border border-neutral-200 bg-neutral-50 px-2 text-sm text-neutral-950 focus:border-neutral-400 focus:outline-none"
          />
        ) : (
          dateValue && (
            <span className="text-sm text-neutral-500">
              {formatDate(dateValue)}
            </span>
          )
        )}
      </div>
    </div>
  );
}

export function ClaimBilling({ claim, currentUser, onChanged }: ClaimBillingProps) {
  const canEdit = hasRolePermission(currentUser.role, PERMISSIONS.BILLING_EDIT);

  const autoTitle = claim.transferTitle
    ? ""
    : generateTransferTitle(
        claim.airline?.name,
        claim.type,
        claim.flight?.flightNumber,
      );

  const [airlinePaid, setAirlinePaid] = useState(claim.airlinePaid);
  const [airlinePaidAt, setAirlinePaidAt] = useState(
    claim.airlinePaidAt?.slice(0, 10) ?? "",
  );
  const [clientPaid, setClientPaid] = useState(claim.clientPaid);
  const [clientPaidAt, setClientPaidAt] = useState(
    claim.clientPaidAt?.slice(0, 10) ?? "",
  );
  const [clientSettled, setClientSettled] = useState(claim.clientSettled);
  const [clientIban, setClientIban] = useState(claim.clientIban ?? "");
  const [transferTitle, setTransferTitle] = useState(
    claim.transferTitle ?? autoTitle ?? "",
  );
  const [copied, setCopied] = useState(false);

  const updateBilling = api.claims.updateBilling.useMutation({
    onSuccess: () => onChanged(),
  });

  function handleGenerateTitle() {
    setTransferTitle(
      generateTransferTitle(claim.airline?.name, claim.type, claim.flight?.flightNumber),
    );
  }

  async function handleCopy() {
    if (!transferTitle) return;
    await navigator.clipboard.writeText(transferTitle);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleSave() {
    updateBilling.mutate({
      id: claim.id,
      airlinePaid,
      airlinePaidAt: airlinePaidAt ? new Date(airlinePaidAt) : null,
      clientPaid,
      clientPaidAt: clientPaidAt ? new Date(clientPaidAt) : null,
      clientSettled,
      clientIban: clientIban || null,
      transferTitle: transferTitle || null,
    });
  }

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-neutral-950">Status rozliczenia</h2>

        <div className="mt-4 space-y-4">
          <CheckRow
            id="airlinePaid"
            label="Linia lotnicza wypłaciła środki"
            checked={airlinePaid}
            dateValue={airlinePaidAt}
            canEdit={canEdit}
            onCheck={setAirlinePaid}
            onDate={setAirlinePaidAt}
          />
          <CheckRow
            id="clientPaid"
            label="Przelew do klienta wykonany"
            checked={clientPaid}
            dateValue={clientPaidAt}
            canEdit={canEdit}
            onCheck={setClientPaid}
            onDate={setClientPaidAt}
          />

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="clientSettled"
              checked={clientSettled}
              onChange={(e) => setClientSettled(e.target.checked)}
              disabled={!canEdit}
              className="h-4 w-4 shrink-0 rounded border-neutral-300 accent-neutral-950 disabled:opacity-50"
            />
            <label
              htmlFor="clientSettled"
              className={`text-sm font-semibold ${canEdit ? "cursor-pointer" : ""} text-neutral-950`}
            >
              Klient rozliczony
            </label>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-neutral-950">Dane do przelewu</h2>

        <div className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="clientIban"
              className="text-sm font-semibold text-neutral-700"
            >
              IBAN klienta
            </label>
            {canEdit ? (
              <input
                type="text"
                id="clientIban"
                value={clientIban}
                onChange={(e) =>
                  setClientIban(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
                }
                placeholder="PL00000000000000000000000000"
                className="mt-1 h-10 w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 font-mono text-sm text-neutral-950 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none"
              />
            ) : (
              <p className="mt-1 font-mono text-sm text-neutral-950">
                {clientIban || <span className="text-neutral-400">Nie podano</span>}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="transferTitle"
              className="text-sm font-semibold text-neutral-700"
            >
              Tytuł przelewu
            </label>
            {canEdit ? (
              <textarea
                id="transferTitle"
                value={transferTitle}
                onChange={(e) => setTransferTitle(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-950 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none"
              />
            ) : (
              <p className="mt-1 text-sm text-neutral-950">
                {transferTitle || <span className="text-neutral-400">Nie wygenerowano</span>}
              </p>
            )}
            <div className="mt-2 flex gap-2">
              {canEdit && (
                <button
                  type="button"
                  onClick={handleGenerateTitle}
                  className="h-8 rounded-md border border-neutral-200 bg-white px-3 text-xs font-semibold text-neutral-700 transition hover:border-neutral-400"
                >
                  Generuj ponownie
                </button>
              )}
              <button
                type="button"
                onClick={handleCopy}
                disabled={!transferTitle}
                className="h-8 rounded-md border border-neutral-200 bg-white px-3 text-xs font-semibold text-neutral-700 transition hover:border-neutral-400 disabled:opacity-40"
              >
                {copied ? "Skopiowano!" : "Kopiuj"}
              </button>
            </div>
          </div>
        </div>

        {canEdit && (
          <div className="mt-5 flex items-center justify-end gap-3 border-t border-neutral-200 pt-4">
            {updateBilling.isError && (
              <p className="text-sm text-red-600">Błąd podczas zapisywania.</p>
            )}
            {updateBilling.isSuccess && (
              <p className="text-sm text-green-600">Zapisano.</p>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={updateBilling.isPending}
              className="h-10 rounded-md bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-60"
            >
              {updateBilling.isPending ? "Zapisywanie…" : "Zapisz"}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
