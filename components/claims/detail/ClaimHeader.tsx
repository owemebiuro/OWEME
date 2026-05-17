"use client";

import { useState } from "react";

import {
  ClaimStatusBadge,
  ClaimTypeBadge,
} from "@/components/claims/ClaimStatusBadge";
import { StatusChangeModal } from "@/components/claims/StatusChangeModal";
import { Button } from "@/components/ui/Button";
import type { ClaimDetailData } from "@/lib/claims/detail-types";
import { formatCurrency, formatDate, initials } from "@/lib/claims/format";
import type {
  ClaimsCurrentUser,
  ClaimsOwnerOption,
} from "@/lib/claims/types";
import { api } from "@/lib/trpc/hooks";
import styles from "./ClaimHeader.module.css";

type ClaimHeaderProps = {
  claim: ClaimDetailData;
  owners: ClaimsOwnerOption[];
  currentUser: ClaimsCurrentUser;
  onRefresh: () => void;
  onOpenNotes: () => void;
  onOpenTasks: () => void;
  onOpenDocuments: () => void;
};

function derivedPriority(claim: ClaimDetailData) {
  if (claim.tasks.some((task) => task.priority === "URGENT")) {
    return "Pilne zadanie";
  }

  if (claim.tasks.some((task) => task.priority === "HIGH")) {
    return "Wysoki priorytet";
  }

  if (claim.isCourtStage) {
    return "Etap sądowy";
  }

  return "Standard";
}

function getFlightSummary(claim: ClaimDetailData) {
  if (!claim.flight) {
    return "Brak danych lotu";
  }

  return `${claim.flight.flightNumber} · ${claim.flight.departureAirportCode} → ${claim.flight.arrivalAirportCode} · ${formatDate(claim.flight.flightDate)}`;
}

export function ClaimHeader({
  claim,
  owners,
  currentUser,
  onRefresh,
  onOpenNotes,
  onOpenTasks,
  onOpenDocuments,
}: ClaimHeaderProps) {
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const canChangeOwner =
    currentUser.role === "ADMIN" || currentUser.role === "SUPER_ADMIN";
  const assignOwner = api.claims.assignOwner.useMutation({
    onSuccess: onRefresh,
  });

  return (
    <header className={styles.header}>
      <div className={styles.shell}>
        <section className={styles.identity}>
          <div className={styles.kickerRow}>
            <p className={styles.kicker}>Karta sprawy</p>
            <ClaimTypeBadge type={claim.type} />
            <span className={styles.priorityPill}>{derivedPriority(claim)}</span>
          </div>

          <div className={styles.titleRow}>
            <h1 className={styles.title}>{claim.claimNumber}</h1>
            <button
              type="button"
              onClick={() => setIsStatusModalOpen(true)}
              className={styles.statusButton}
              aria-label="Zmień status sprawy"
            >
              <ClaimStatusBadge status={claim.status} />
            </button>
            {claim.subStatus ? (
              <span className={styles.priorityPill}>{claim.subStatus}</span>
            ) : null}
          </div>

          <div className={styles.summaryRow}>
            <span className={styles.summaryPill}>
              {claim.client.firstName} {claim.client.lastName}
            </span>
            <span className={styles.summaryPill}>{getFlightSummary(claim)}</span>
            <span className={styles.summaryPill}>
              Utworzono {formatDate(claim.createdAt)}
            </span>
          </div>
        </section>

        <section className={styles.metrics} aria-label="Dane sprawy">
          <div className={`${styles.metricCard} ${styles.ownerCard}`}>
            <span className={styles.avatar}>
              {claim.owner ? initials(claim.owner.name) : "?"}
            </span>
            <div className="min-w-0">
              <p className={styles.metricLabel}>Pracownik</p>
              {canChangeOwner ? (
                <select
                  value={claim.ownerId ?? ""}
                  onChange={(event) =>
                    assignOwner.mutate({
                      id: claim.id,
                      ownerId: event.target.value || null,
                    })
                  }
                  disabled={assignOwner.isPending}
                  className={styles.ownerSelect}
                >
                  <option value="">Nieprzypisana</option>
                  {owners.map((owner) => (
                    <option key={owner.id} value={owner.id}>
                      {owner.name}
                    </option>
                  ))}
                </select>
              ) : (
                <p className={styles.metricValue}>
                  {claim.owner?.name ?? "Nieprzypisana"}
                </p>
              )}
            </div>
          </div>

          <div className={styles.metricCard}>
            <p className={styles.metricLabel}>Roszczenie</p>
            <p className={styles.metricValue}>
              {formatCurrency(claim.potentialAmount)}
            </p>
          </div>

          <div className={styles.metricCard}>
            <p className={styles.metricLabel}>Kompletność</p>
            <p className={styles.metricValue}>{claim.dataCompleteness}%</p>
          </div>
        </section>

        <div className={styles.actions}>
          <Button
            type="button"
            onClick={onOpenDocuments}
            variant="primary"
            className={styles.actionButton}
          >
            Wygeneruj dokument
          </Button>
          <Button
            type="button"
            onClick={onOpenNotes}
            variant="secondary"
            className={styles.actionButton}
          >
            Dodaj notatkę
          </Button>
          <Button
            type="button"
            onClick={onOpenTasks}
            variant="secondary"
            className={styles.actionButton}
          >
            Utwórz zadanie
          </Button>
        </div>
      </div>

      {assignOwner.error ? (
        <p className={styles.error}>{assignOwner.error.message}</p>
      ) : null}

      <StatusChangeModal
        key={`${claim.id}-${claim.status}-${isStatusModalOpen}`}
        claimId={claim.id}
        currentStatus={claim.status}
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        onChanged={onRefresh}
      />
    </header>
  );
}
