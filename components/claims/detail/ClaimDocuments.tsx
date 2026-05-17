"use client";

import type { DocumentType } from "@prisma/client";
import { useMemo, useState } from "react";

import type { ClaimDetailData } from "@/lib/claims/detail-types";
import {
  documentStatusLabels,
  documentTypeLabels,
} from "@/lib/claims/detail-labels";
import { formatDateTime } from "@/lib/claims/format";
import { api } from "@/lib/trpc/hooks";
import { Button } from "@/components/ui/Button";

type ClaimDocumentsProps = {
  claim: ClaimDetailData;
  onChanged: () => void;
};

const documentTypes = [
  "ASSIGNMENT_AGREEMENT",
  "POWER_OF_ATTORNEY",
  "DEMAND_LETTER",
  "NEGATIVE_RESPONSE_REPLY",
  "LAWSUIT",
  "SETTLEMENT_CONFIRMATION",
  "CLIENT_CONFIRMATION",
] as const satisfies readonly DocumentType[];

function parseMissingFields(message: string) {
  return message
    .replace("Brak wymaganych danych:", "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function ClaimDocuments({ claim, onChanged }: ClaimDocumentsProps) {
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [selectedType, setSelectedType] =
    useState<DocumentType>("ASSIGNMENT_AGREEMENT");
  const [expandedTypes, setExpandedTypes] = useState<Set<DocumentType>>(
    () => new Set(),
  );
  const [busyDocumentId, setBusyDocumentId] = useState<string | null>(null);

  const groupedDocuments = useMemo(() => {
    const groups = new Map<DocumentType, typeof claim.documents>();

    for (const type of documentTypes) {
      groups.set(type, []);
    }

    for (const document of claim.documents) {
      groups.set(document.type, [...(groups.get(document.type) ?? []), document]);
    }

    for (const [type, documents] of groups.entries()) {
      groups.set(
        type,
        [...documents].sort((first, second) => second.version - first.version),
      );
    }

    return groups;
  }, [claim]);

  const generateDocument = api.documents.generate.useMutation({
    onSuccess: (result) => {
      setIsGenerateOpen(false);
      window.open(result.downloadUrl, "_blank", "noopener,noreferrer");
      onChanged();
    },
  });
  const getDownloadUrl = api.documents.getDownloadUrl.useMutation();
  const markSigned = api.documents.markSigned.useMutation({
    onSuccess: onChanged,
  });
  const deleteDocument = api.documents.delete.useMutation({
    onSuccess: onChanged,
  });

  const documentError =
    getDownloadUrl.error?.message ??
    markSigned.error?.message ??
    deleteDocument.error?.message;

  async function downloadDocument(documentId: string) {
    setBusyDocumentId(documentId);

    try {
      const result = await getDownloadUrl.mutateAsync({ documentId });
      window.open(result.downloadUrl, "_blank", "noopener,noreferrer");
    } finally {
      setBusyDocumentId(null);
    }
  }

  async function signDocument(documentId: string) {
    setBusyDocumentId(documentId);

    try {
      await markSigned.mutateAsync({ documentId });
    } finally {
      setBusyDocumentId(null);
    }
  }

  async function removeDocument(documentId: string, fileName: string) {
    const confirmed = window.confirm(
      `Czy na pewno usunąć dokument "${fileName}"? Tej operacji nie można cofnąć.`,
    );

    if (!confirmed) {
      return;
    }

    setBusyDocumentId(documentId);

    try {
      await deleteDocument.mutateAsync({ documentId });
    } finally {
      setBusyDocumentId(null);
    }
  }

  function toggleExpanded(type: DocumentType) {
    setExpandedTypes((current) => {
      const next = new Set(current);

      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }

      return next;
    });
  }

  const missingFields = generateDocument.error
    ? parseMissingFields(generateDocument.error.message)
    : [];

  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-neutral-950">
            Dokumenty
          </h2>
        </div>
        <Button
          type="button"
          onClick={() => setIsGenerateOpen(true)}
          variant="primary"
        >
          Generuj nowy dokument
        </Button>
      </div>

      <div className="mt-4 space-y-3">
        {documentTypes.map((type) => {
          const documents = groupedDocuments.get(type) ?? [];
          const latest = documents[0];
          const older = documents.slice(1);

          return (
            <article
              key={type}
              className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="font-semibold text-neutral-950">
                    {documentTypeLabels[type]}
                  </p>
                  {latest ? (
                    <p className="mt-1 text-sm text-neutral-500">
                      {latest.fileName} · v{latest.version} ·{" "}
                      {formatDateTime(latest.generatedAt)}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-neutral-500">
                      Brak wygenerowanego dokumentu.
                    </p>
                  )}
                </div>

                {latest ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs font-semibold text-neutral-700">
                      {documentStatusLabels[latest.status]}
                    </span>
                    <Button
                      type="button"
                      onClick={() => void downloadDocument(latest.id)}
                      disabled={busyDocumentId === latest.id}
                      variant="secondary"
                      size="sm"
                    >
                      Pobierz
                    </Button>
                    <Button
                      type="button"
                      onClick={() => void signDocument(latest.id)}
                      disabled={latest.isSigned || busyDocumentId === latest.id}
                      variant="outline"
                      size="sm"
                      className="border-green-200 bg-green-50 text-green-700 hover:bg-green-100 disabled:cursor-not-allowed"
                    >
                      Oznacz jako podpisany
                    </Button>
                    <Button
                      type="button"
                      onClick={() => void removeDocument(latest.id, latest.fileName)}
                      disabled={busyDocumentId === latest.id}
                      variant="secondary"
                      size="sm"
                      className="border-red-200 bg-red-50 text-red-700 hover:bg-red-100 disabled:cursor-wait"
                    >
                      Usuń
                    </Button>
                    {older.length ? (
                      <Button
                        type="button"
                        onClick={() => toggleExpanded(type)}
                        variant="secondary"
                        size="sm"
                      >
                        Poprzednie pliki ({older.length})
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </div>

              {expandedTypes.has(type) && older.length ? (
                <div className="mt-3 space-y-2 border-t border-neutral-200 pt-3">
                  {older.map((document) => (
                    <div
                      key={document.id}
                      className="flex flex-col gap-2 rounded-md bg-white px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <p className="text-sm text-neutral-600">
                        v{document.version} · {document.fileName} ·{" "}
                        {formatDateTime(document.generatedAt)}
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          onClick={() => void downloadDocument(document.id)}
                          disabled={busyDocumentId === document.id}
                          variant="secondary"
                          size="sm"
                          className="h-8 text-xs disabled:cursor-wait"
                        >
                          Pobierz
                        </Button>
                        <Button
                          type="button"
                          onClick={() => void removeDocument(document.id, document.fileName)}
                          disabled={busyDocumentId === document.id}
                          variant="secondary"
                          size="sm"
                          className="h-8 border-red-200 bg-red-50 text-xs text-red-700 hover:bg-red-100 disabled:cursor-wait"
                        >
                          Usuń
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>

      {documentError ? (
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {documentError}
        </p>
      ) : null}

      {isGenerateOpen ? (
        <div
          className="crm-modal-backdrop fixed inset-0 z-50 flex items-center justify-center overflow-y-auto px-4 py-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="generate-document-title"
        >
          <div className="crm-modal-surface w-full max-w-lg overflow-hidden">
            <div className="border-b border-white/50 px-5 py-4">
              <h3
                id="generate-document-title"
                className="text-lg font-semibold text-neutral-950"
              >
                Generuj dokument
              </h3>
            </div>

            <div className="space-y-4 px-5 py-4">
              <label className="block">
                <span className="text-sm font-semibold text-neutral-700">
                  Typ dokumentu
                </span>
                <select
                  value={selectedType}
                  onChange={(event) =>
                    setSelectedType(event.target.value as DocumentType)
                  }
                  className="mt-2 h-10 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-neutral-950"
                >
                  {documentTypes.map((type) => (
                    <option key={type} value={type}>
                      {documentTypeLabels[type]}
                    </option>
                  ))}
                </select>
              </label>

              {generateDocument.error ? (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {missingFields.length ? (
                    <>
                      <p className="font-semibold">
                        Brakuje danych wymaganych przez szablon:
                      </p>
                      <ul className="mt-2 list-inside list-disc">
                        {missingFields.map((field) => (
                          <li key={field}>{field}</li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    generateDocument.error.message
                  )}
                </div>
              ) : null}
            </div>

            <div className="flex justify-end gap-2 border-t border-white/50 px-5 py-4">
              <Button
                type="button"
                onClick={() => setIsGenerateOpen(false)}
                disabled={generateDocument.isPending}
                variant="secondary"
              >
                Anuluj
              </Button>
              <Button
                type="button"
                disabled={generateDocument.isPending}
                onClick={() =>
                  generateDocument.mutate({
                    claimId: claim.id,
                    documentType: selectedType,
                  })
                }
                variant="primary"
              >
                Generuj
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
