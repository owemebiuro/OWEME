import type { ClaimDetailData } from "@/lib/claims/detail-types";
import { commissionModelLabels } from "@/lib/claims/detail-labels";

type ClaimDetailsTabProps = {
  claim: ClaimDetailData;
};

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <h2 className="text-base font-semibold text-neutral-950">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function DataTile({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {label}
      </p>
      <div className="mt-1 font-semibold text-neutral-950">
        {value || "Brak"}
      </div>
    </div>
  );
}

export function ClaimDetailsTab({ claim }: ClaimDetailsTabProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <Panel title="Dane klienta">
        <div className="grid gap-3 sm:grid-cols-2">
          <DataTile label="PESEL" value={claim.client.pesel} />
          <DataTile label="Typ dokumentu" value={claim.client.documentType} />
          <DataTile label="Seria dokumentu" value={claim.client.documentSeries} />
          <DataTile label="Numer dokumentu" value={claim.client.documentNumber} />
        </div>
      </Panel>

      <Panel title="Pasażerowie">
        <div className="space-y-3">
          {claim.passengers.length ? (
            claim.passengers.map((passenger) => (
              <div
                key={passenger.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-3"
              >
                <div>
                  <p className="font-semibold text-neutral-950">
                    {passenger.firstName} {passenger.lastName}
                  </p>
                  <p className="mt-1 text-sm text-neutral-500">
                    {passenger.isPrimary
                      ? "Pasażer główny"
                      : passenger.relationToClient ?? "Pasażer"}
                  </p>
                </div>
                <span
                  className={`rounded-md border px-2 py-1 text-xs font-semibold ${
                    passenger.hasSignedDocs
                      ? "border-green-200 bg-green-50 text-green-700"
                      : "border-[rgba(27,111,212,0.22)] bg-[var(--ember-bg)] text-[var(--ember-lo)]"
                  }`}
                >
                  {passenger.hasSignedDocs ? "Dokumenty OK" : "Brak podpisu"}
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-neutral-500">
              Nie dodano jeszcze pasażerów.
            </p>
          )}
        </div>
      </Panel>

      <Panel title="Dane sprawy">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <DataTile
              label="Model prowizji"
              value={commissionModelLabels[claim.commissionModel]}
            />
            <DataTile label="Sygnatura I instancji" value={claim.signatureFirst} />
            <DataTile label="Sygnatura II instancji" value={claim.signatureSecond} />
            <DataTile label="Sąd" value={claim.courtName} />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-semibold text-neutral-700">
                Kompletność danych
              </span>
              <span className="font-semibold text-neutral-950">
                {claim.dataCompleteness}%
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-neutral-100">
              <div
                className="h-full rounded-full bg-teal-500"
                style={{ width: `${Math.min(100, claim.dataCompleteness)}%` }}
              />
            </div>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white px-3 py-3 text-sm leading-6 text-neutral-600">
            Jurysdykcja polska:{" "}
            <span className="font-semibold text-neutral-950">
              {claim.isPolishJurisdiction ? "tak" : "nie"}
            </span>
            <br />
            Etap sądowy:{" "}
            <span className="font-semibold text-neutral-950">
              {claim.isCourtStage ? "tak" : "nie"}
            </span>
          </div>
        </div>
      </Panel>
    </div>
  );
}
