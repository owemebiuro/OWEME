"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { ClaimDetailsTab } from "@/components/claims/detail/ClaimDetailsTab";
import { ClaimHeader } from "@/components/claims/detail/ClaimHeader";
import { ClaimSidebar } from "@/components/claims/detail/ClaimSidebar";
import type { ClaimDetailData } from "@/lib/claims/detail-types";
import type {
  ClaimsCurrentUser,
  ClaimsOwnerOption,
} from "@/lib/claims/types";
import { api } from "@/lib/trpc/hooks";
import styles from "./ClaimDetailView.module.css";

type ClaimDetailViewProps = {
  claim: ClaimDetailData;
  owners: ClaimsOwnerOption[];
  currentUser: ClaimsCurrentUser;
};

type TabId =
  | "details"
  | "documents"
  | "attachments"
  | "notes"
  | "tasks"
  | "history"
  | "billing";

const tabs: Array<{ id: TabId; label: string }> = [
  { id: "details", label: "Szczegóły" },
  { id: "documents", label: "Dokumenty" },
  { id: "attachments", label: "Załączniki" },
  { id: "notes", label: "Notatki" },
  { id: "tasks", label: "Zadania" },
  { id: "history", label: "Historia" },
  { id: "billing", label: "Rozliczenia" },
];

function TabLoading({ label = "Ladowanie zakladki" }: { label?: string }) {
  return (
    <div
      className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm"
      aria-label={label}
    >
      <div className="animate-pulse space-y-4">
        <div className="h-4 w-40 rounded-full bg-neutral-200" />
        <div className="grid gap-3 md:grid-cols-2">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="rounded-md border border-neutral-100 p-3">
              <div className="h-3 w-24 rounded-full bg-neutral-200" />
              <div className="mt-3 h-4 w-40 rounded-full bg-neutral-200" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const ClaimDocumentsPanel = dynamic(
  () =>
    import("@/components/claims/detail/ClaimDocuments").then(
      (mod) => mod.ClaimDocuments,
    ),
  { loading: () => <TabLoading label="Ladowanie dokumentow" /> },
);

const ClaimAttachmentsPanel = dynamic(
  () =>
    import("@/components/claims/detail/ClaimAttachments").then(
      (mod) => mod.ClaimAttachments,
    ),
  { loading: () => <TabLoading label="Ladowanie zalacznikow" /> },
);

const ClaimNotesPanel = dynamic(
  () =>
    import("@/components/claims/detail/ClaimNotes").then(
      (mod) => mod.ClaimNotes,
    ),
  { loading: () => <TabLoading label="Ladowanie notatek" /> },
);

const ClaimTasksPanel = dynamic(
  () =>
    import("@/components/claims/detail/ClaimTasks").then(
      (mod) => mod.ClaimTasks,
    ),
  { loading: () => <TabLoading label="Ladowanie zadan" /> },
);

const ClaimHistoryPanel = dynamic(
  () =>
    import("@/components/claims/detail/ClaimHistory").then(
      (mod) => mod.ClaimHistory,
    ),
  { loading: () => <TabLoading label="Ladowanie historii" /> },
);

const ClaimBillingPanel = dynamic(
  () =>
    import("@/components/claims/detail/ClaimBilling").then(
      (mod) => mod.ClaimBilling,
    ),
  { loading: () => <TabLoading label="Ladowanie rozliczen" /> },
);

export function ClaimDetailView({
  claim,
  owners,
  currentUser,
}: ClaimDetailViewProps) {
  const router = useRouter();
  const utils = api.useUtils();
  const [activeTab, setActiveTab] = useState<TabId>("details");
  const [requestedTab, setRequestedTab] = useState<TabId>("details");
  const [isTabPending, startTabTransition] = useTransition();

  function refreshClaim() {
    void utils.claims.getById.invalidate({ id: claim.id });
    void utils.documents.listByClaimId.invalidate({ claimId: claim.id });
    router.refresh();
  }

  function selectTab(tabId: TabId) {
    setRequestedTab(tabId);

    if (tabId === activeTab) {
      return;
    }

    startTabTransition(() => {
      setActiveTab(tabId);
    });
  }

  function renderTab() {
    switch (activeTab) {
      case "details":
        return <ClaimDetailsTab claim={claim} />;
      case "documents":
        return <ClaimDocumentsPanel claim={claim} onChanged={refreshClaim} />;
      case "attachments":
        return (
          <ClaimAttachmentsPanel
            claim={claim}
            owners={owners}
            onChanged={refreshClaim}
          />
        );
      case "notes":
        return <ClaimNotesPanel claim={claim} onChanged={refreshClaim} />;
      case "tasks":
        return (
          <ClaimTasksPanel
            claim={claim}
            owners={owners}
            currentUser={currentUser}
            onChanged={refreshClaim}
          />
        );
      case "history":
        return <ClaimHistoryPanel claim={claim} owners={owners} />;
      case "billing":
        return (
          <ClaimBillingPanel
            claim={claim}
            currentUser={currentUser}
            onChanged={refreshClaim}
          />
        );
    }
  }

  return (
    <>
      <ClaimHeader
        claim={claim}
        owners={owners}
        currentUser={currentUser}
        onRefresh={refreshClaim}
        onOpenDocuments={() => selectTab("documents")}
        onOpenNotes={() => selectTab("notes")}
        onOpenTasks={() => selectTab("tasks")}
      />

      <div className={styles.detailGrid}>
        <ClaimSidebar claim={claim} onChanged={refreshClaim} />

        <section className={styles.detailMain}>
          <nav className="overflow-x-auto rounded-lg border border-neutral-200 bg-white p-1 shadow-sm">
            <div className="flex min-w-max gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  data-testid={`claim-tab-${tab.id}`}
                  aria-pressed={requestedTab === tab.id}
                  onClick={() => selectTab(tab.id)}
                  className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                    requestedTab === tab.id
                      ? "bg-[var(--ember)] text-white shadow-sm"
                      : "text-[var(--mist)] hover:bg-[var(--ember-bg)] hover:text-[var(--ember-lo)]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </nav>

          {isTabPending && activeTab !== requestedTab ? (
            <div className="rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-600 shadow-sm">
              Ladowanie zakladki...
            </div>
          ) : null}

          {renderTab()}
        </section>
      </div>
    </>
  );
}
