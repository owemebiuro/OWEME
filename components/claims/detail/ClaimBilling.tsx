"use client";

import { useEffect, useMemo, useState } from "react";

import type { ClaimDetailData } from "@/lib/claims/detail-types";
import { formatDate } from "@/lib/claims/format";
import type { ClaimsCurrentUser } from "@/lib/claims/types";
import { isJudicialStatus } from "@/lib/constants/statuses";
import { calculateSettlement } from "@/lib/settlements/calculator";
import { PERMISSIONS, hasRolePermission } from "@/lib/trpc/permissions.shared";
import { api } from "@/lib/trpc/hooks";

type ClaimBillingProps = {
  claim: ClaimDetailData;
  currentUser: ClaimsCurrentUser;
  onChanged: () => void;
};

type RatePayload =
  | {
      rate: number;
      effectiveDate: string;
      cached: boolean;
      fallback?: boolean;
    }
  | {
      error: string;
    };

const moneyFormatter = new Intl.NumberFormat("pl-PL", {
  style: "currency",
  currency: "PLN",
});

const eurFormatter = new Intl.NumberFormat("pl-PL", {
  style: "currency",
  currency: "EUR",
});

function formatRate(rate: number) {
  return new Intl.NumberFormat("pl-PL", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(rate);
}

function parseAmount(value: string) {
  const normalized = value.replace(",", ".");
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : 0;
}

export function ClaimBilling({
  claim,
  currentUser,
  onChanged,
}: ClaimBillingProps) {
  const canEdit = hasRolePermission(currentUser.role, PERMISSIONS.BILLING_EDIT);
  const [airlineAmount, setAirlineAmount] = useState(
    claim.potentialAmount ?? "600",
  );
  const [rate, setRate] = useState<number | null>(null);
  const [rateDate, setRateDate] = useState("");
  const [rateError, setRateError] = useState("");
  const [courtCosts, setCourtCosts] = useState("");
  const [courtCostsPaid, setCourtCostsPaid] = useState(false);

  const createSettlement = api.claims.createSettlement.useMutation({
    onSuccess: onChanged,
  });

  useEffect(() => {
    let active = true;

    async function loadRate() {
      const response = await fetch("/api/rates/eur");
      const payload = (await response.json()) as RatePayload;

      if (!active) {
        return;
      }

      if ("error" in payload) {
        setRateError(payload.error);
        return;
      }

      setRate(payload.rate);
      setRateDate(payload.effectiveDate);
      setRateError(payload.fallback ? "Używam ostatniego zapisanego kursu." : "");
    }

    void loadRate().catch(() => {
      if (active) {
        setRateError("Nie udało się pobrać kursu EUR/PLN.");
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const result = useMemo(() => {
    const airlineAmountEur = parseAmount(airlineAmount);

    return calculateSettlement({
      airlineAmountEur,
      eurPlnRate: rate ?? 0,
      caseStatus: claim.status,
    });
  }, [airlineAmount, claim.status, rate]);

  function saveSettlement() {
    createSettlement.mutate({
      claimId: claim.id,
      airlineAmountEur: result.airlineAmountEur,
      eurPlnRate: result.eurPlnRate,
      airlineAmountPln: result.airlineAmountPln,
      companySharePln: result.companySharePln,
      clientSharePln: result.clientSharePln,
      courtCosts: courtCosts ? parseAmount(courtCosts) : null,
      courtCostsPaid,
    });
  }

  const judicial = isJudicialStatus(claim.status);

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-neutral-950">
              Kalkulator rozliczenia
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              Prowizja jest liczona automatycznie według aktualnego etapu sprawy.
            </p>
          </div>
          <span className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1 text-xs font-semibold text-neutral-600">
            {Math.round(result.commissionRate * 100)}%
          </span>
        </div>

        <div className="mt-5 space-y-4">
          <label className="grid gap-2 sm:grid-cols-[180px_1fr] sm:items-center">
            <span className="text-sm font-semibold text-neutral-700">
              Kwota od linii
            </span>
            <div className="flex items-center gap-2">
              <input
                value={airlineAmount}
                onChange={(event) => setAirlineAmount(event.target.value)}
                disabled={!canEdit}
                inputMode="decimal"
                className="h-10 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-neutral-950 disabled:bg-neutral-50"
              />
              <span className="text-sm font-semibold text-neutral-500">EUR</span>
            </div>
          </label>

          <div className="grid gap-2 sm:grid-cols-[180px_1fr] sm:items-center">
            <span className="text-sm font-semibold text-neutral-700">
              Kurs EUR/PLN
            </span>
            <span className="text-sm font-semibold text-neutral-950">
              {rate ? formatRate(rate) : "Pobieram..."}
              {rateDate ? (
                <span className="ml-2 font-medium text-neutral-500">
                  NBP, {rateDate}
                </span>
              ) : null}
            </span>
          </div>

          {rateError ? (
            <p className="rounded-md border border-[rgba(27,111,212,0.22)] bg-[var(--ember-bg)] px-3 py-2 text-sm text-[var(--ember-lo)]">
              {rateError}
            </p>
          ) : null}

          <div className="divide-y divide-neutral-100 rounded-lg border border-neutral-200">
            <div className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="text-neutral-600">Wartość w PLN</span>
              <span className="font-semibold text-neutral-950">
                {moneyFormatter.format(result.airlineAmountPln)}
              </span>
            </div>
            <div className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="text-neutral-600">
                Prowizja ({Math.round(result.commissionRate * 100)}%)
              </span>
              <span className="font-semibold text-[var(--ember-lo)]">
                - {moneyFormatter.format(result.companySharePln)}
              </span>
            </div>
            <div className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="text-neutral-600">Do przelewu</span>
              <span className="text-base font-bold text-green-700">
                {moneyFormatter.format(result.clientSharePln)}
              </span>
            </div>
            <div className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="text-neutral-600">Dla firmy</span>
              <span className="font-semibold text-neutral-950">
                {moneyFormatter.format(result.companySharePln)}
              </span>
            </div>
          </div>

          {judicial ? (
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
              <h3 className="text-sm font-semibold text-neutral-950">
                KZP (Koszty zastępstwa procesowego)
              </h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                <input
                  value={courtCosts}
                  onChange={(event) => setCourtCosts(event.target.value)}
                  disabled={!canEdit}
                  inputMode="decimal"
                  placeholder="Kwota KZP w PLN"
                  className="h-10 rounded-md border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-neutral-950 disabled:bg-neutral-50"
                />
                <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
                  <input
                    type="checkbox"
                    checked={courtCostsPaid}
                    onChange={(event) => setCourtCostsPaid(event.target.checked)}
                    disabled={!canEdit}
                    className="h-4 w-4 accent-neutral-950"
                  />
                  Koszty wpłynęły
                </label>
              </div>
            </div>
          ) : null}

          {canEdit ? (
            <div className="flex items-center justify-end gap-3">
              {createSettlement.error ? (
                <p className="text-sm text-red-600">
                  {createSettlement.error.message}
                </p>
              ) : null}
              {createSettlement.isSuccess ? (
                <p className="text-sm text-green-700">Zapisano rozliczenie.</p>
              ) : null}
              <button
                type="button"
                onClick={saveSettlement}
                disabled={
                  createSettlement.isPending ||
                  !rate ||
                  result.airlineAmountEur <= 0
                }
                className="h-10 rounded-md bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Zapisz rozliczenie
              </button>
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-neutral-950">
          Historia rozliczeń
        </h2>
        <div className="mt-4 grid gap-3">
          {claim.payouts.length ? (
            claim.payouts.map((payout) => (
              <article
                key={payout.id}
                className="grid gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4 md:grid-cols-4"
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Kwota od linii
                  </p>
                  <p className="mt-1 font-semibold text-neutral-950">
                    {payout.airlinePaymentAmount
                      ? eurFormatter.format(Number(payout.airlinePaymentAmount))
                      : eurFormatter.format(Number(payout.amountRecovered))}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Dla klienta
                  </p>
                  <p className="mt-1 font-semibold text-green-700">
                    {moneyFormatter.format(
                      Number(payout.clientShare ?? payout.clientAmount),
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Dla firmy
                  </p>
                  <p className="mt-1 font-semibold text-[var(--ember-lo)]">
                    {moneyFormatter.format(
                      Number(payout.companyShare ?? payout.owemeFee),
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Data
                  </p>
                  <p className="mt-1 font-semibold text-neutral-950">
                    {formatDate(payout.calculatedAt ?? payout.receivedAt)}
                  </p>
                </div>
              </article>
            ))
          ) : (
            <p className="rounded-lg border border-dashed border-neutral-300 px-4 py-8 text-center text-sm text-neutral-500">
              Brak zapisanych rozliczeń.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
