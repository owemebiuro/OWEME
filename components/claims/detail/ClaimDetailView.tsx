"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ClaimAttachments } from "@/components/claims/detail/ClaimAttachments";
import { ClaimDetailsTab } from "@/components/claims/detail/ClaimDetailsTab";
import { ClaimDocuments } from "@/components/claims/detail/ClaimDocuments";
import { ClaimHeader } from "@/components/claims/detail/ClaimHeader";
import { ClaimHistory } from "@/components/claims/detail/ClaimHistory";
import { ClaimNotes } from "@/components/claims/detail/ClaimNotes";
import { ClaimSidebar } from "@/components/claims/detail/ClaimSidebar";
import { ClaimTasks } from "@/components/claims/detail/ClaimTasks";
import type { ClaimDetailData } from "@/lib/claims/detail-types";
import type {
  ClaimsCurrentUser,
  ClaimsOwnerOption,
} from "@/lib/claims/types";
import { api } from "@/lib/trpc/hooks";

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
  | "history";

const tabs: Array<{ id: TabId; label: string }> = [
  { id: "details", label: "Szczegóły" },
  { id: "documents", label: "Dokumenty" },
  { id: "attachments", label: "Załączniki" },
  { id: "notes", label: "Notatki" },
  { id: "tasks", label: "Zadania" },
  { id: "history", label: "Historia" },
];

export function ClaimDetailView({
  claim,
  owners,
  currentUser,
}: ClaimDetailViewProps) {
  const router = useRouter();
  const utils = api.useUtils();
  const [activeTab, setActiveTab] = useState<TabId>("details");

  function refreshClaim() {
    void utils.claims.getById.invalidate({ id: claim.id });
    void utils.documents.listByClaimId.invalidate({ claimId: claim.id });
    router.refresh();
  }

  function renderTab() {
    switch (activeTab) {
      case "details":
        return <ClaimDetailsTab claim={claim} />;
      case "documents":
        return <ClaimDocuments claim={claim} onChanged={refreshClaim} />;
      case "attachments":
        return (
          <ClaimAttachments
            claim={claim}
            owners={owners}
            onChanged={refreshClaim}
          />
        );
      case "notes":
        return <ClaimNotes claim={claim} onChanged={refreshClaim} />;
      case "tasks":
        return (
          <ClaimTasks claim={claim} owners={owners} onChanged={refreshClaim} />
        );
      case "history":
        return <ClaimHistory claim={claim} owners={owners} />;
    }
  }

  return (
    <>
      <ClaimHeader
        claim={claim}
        owners={owners}
        currentUser={currentUser}
        onRefresh={refreshClaim}
        onOpenDocuments={() => setActiveTab("documents")}
        onOpenNotes={() => setActiveTab("notes")}
        onOpenTasks={() => setActiveTab("tasks")}
      />

      <div className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(260px,0.32fr)_1fr] lg:px-8">
        <ClaimSidebar claim={claim} />

        <section className="min-w-0 space-y-4">
          <nav className="overflow-x-auto rounded-lg border border-neutral-200 bg-white p-1 shadow-sm">
            <div className="flex min-w-max gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  data-testid={`claim-tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                    activeTab === tab.id
                      ? "bg-neutral-950 text-white"
                      : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </nav>

          {renderTab()}
        </section>
      </div>
    </>
  );
}
