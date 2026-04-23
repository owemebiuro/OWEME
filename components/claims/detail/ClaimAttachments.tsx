"use client";

import type { AttachmentType } from "@prisma/client";
import { useRef, useState } from "react";

import type { ClaimDetailData } from "@/lib/claims/detail-types";
import { attachmentTypeLabels } from "@/lib/claims/detail-labels";
import {
  formatDateTime,
  formatFileSize,
} from "@/lib/claims/format";
import type { ClaimsOwnerOption } from "@/lib/claims/types";
import { api } from "@/lib/trpc/hooks";

type ClaimAttachmentsProps = {
  claim: ClaimDetailData;
  owners: ClaimsOwnerOption[];
  onChanged: () => void;
};

const attachmentTypes = [
  "BOARDING_PASS",
  "BOOKING_CONFIRMATION",
  "ID_DOCUMENT",
  "CORRESPONDENCE",
  "COURT_DOCUMENT",
  "OTHER",
] as const satisfies readonly AttachmentType[];

const statusClasses: Record<string, string> = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  UPLOADED: "border-blue-200 bg-blue-50 text-blue-700",
  VERIFIED: "border-green-200 bg-green-50 text-green-700",
  REJECTED: "border-red-200 bg-red-50 text-red-700",
};

function fileIcon(mimeType: string) {
  if (mimeType.includes("pdf")) {
    return "PDF";
  }

  if (mimeType.startsWith("image/")) {
    return "IMG";
  }

  if (mimeType.includes("word")) {
    return "DOC";
  }

  return "FILE";
}

export function ClaimAttachments({
  claim,
  owners,
  onChanged,
}: ClaimAttachmentsProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [attachmentType, setAttachmentType] = useState<AttachmentType>("OTHER");
  const [isDragging, setIsDragging] = useState(false);
  const [busyAttachmentId, setBusyAttachmentId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const uploaderNames = new Map(owners.map((owner) => [owner.id, owner.name]));

  const getUploadUrl = api.attachments.getUploadUrl.useMutation();
  const confirmUpload = api.attachments.confirmUpload.useMutation({
    onSuccess: onChanged,
  });
  const getDownloadUrl = api.attachments.getDownloadUrl.useMutation();
  const deleteAttachment = api.attachments.delete.useMutation({
    onSuccess: onChanged,
  });

  const isUploading = getUploadUrl.isPending || confirmUpload.isPending;

  async function uploadFile(file: File) {
    setUploadError(null);

    try {
      const upload = await getUploadUrl.mutateAsync({
        claimId: claim.id,
        fileName: file.name,
        contentType: file.type || "application/octet-stream",
        fileSize: file.size,
        attachmentType,
      });

      const response = await fetch(upload.uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
      });

      if (!response.ok) {
        throw new Error("Upload do R2 nie powiódł się.");
      }

      await confirmUpload.mutateAsync({
        attachmentId: upload.attachmentId,
      });
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "Nie udało się wgrać pliku.",
      );
    }
  }

  async function handleFiles(files: FileList | null) {
    const file = files?.[0];

    if (file) {
      await uploadFile(file);
    }
  }

  async function downloadAttachment(attachmentId: string) {
    setBusyAttachmentId(attachmentId);

    try {
      const result = await getDownloadUrl.mutateAsync({ attachmentId });
      window.open(result.downloadUrl, "_blank", "noopener,noreferrer");
    } finally {
      setBusyAttachmentId(null);
      onChanged();
    }
  }

  async function removeAttachment(attachmentId: string) {
    setBusyAttachmentId(attachmentId);

    try {
      await deleteAttachment.mutateAsync({ attachmentId });
    } finally {
      setBusyAttachmentId(null);
    }
  }

  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-base font-semibold text-neutral-950">
            Załączniki
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Pliki sprawy są wysyłane bezpośrednio do R2 przez presigned URL.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Typ
            </span>
            <select
              value={attachmentType}
              onChange={(event) =>
                setAttachmentType(event.target.value as AttachmentType)
              }
              className="mt-1 h-10 rounded-md border border-neutral-200 bg-white px-3 text-sm font-semibold outline-none focus:border-neutral-950"
            >
              {attachmentTypes.map((type) => (
                <option key={type} value={type}>
                  {attachmentTypeLabels[type]}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            className="h-10 rounded-md bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-wait disabled:opacity-50"
          >
            Dodaj plik
          </button>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={(event) => void handleFiles(event.target.files)}
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          />
        </div>
      </div>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          void handleFiles(event.dataTransfer.files);
        }}
        className={`mt-4 rounded-lg border border-dashed px-4 py-8 text-center transition ${
          isDragging
            ? "border-neutral-950 bg-neutral-100"
            : "border-neutral-300 bg-neutral-50"
        }`}
      >
        <p className="text-sm font-semibold text-neutral-950">
          Przeciągnij plik tutaj albo użyj przycisku „Dodaj plik”
        </p>
        <p className="mt-1 text-xs text-neutral-500">
          PDF, JPG, PNG, DOC, DOCX · maksymalnie 25 MB
        </p>
      </div>

      {uploadError || getUploadUrl.error || confirmUpload.error ? (
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {uploadError ??
            getUploadUrl.error?.message ??
            confirmUpload.error?.message}
        </p>
      ) : null}

      <div className="mt-4 space-y-3">
        {claim.attachments.length ? (
          claim.attachments.map((attachment) => (
            <article
              key={attachment.id}
              className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 lg:flex-row lg:items-center lg:justify-between"
            >
              <div className="flex min-w-0 gap-3">
                <span className="flex h-11 w-12 shrink-0 items-center justify-center rounded-md bg-neutral-950 text-xs font-semibold text-white">
                  {fileIcon(attachment.mimeType)}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-neutral-950">
                    {attachment.fileName}
                  </p>
                  <p className="mt-1 text-sm text-neutral-500">
                    {attachmentTypeLabels[attachment.type]} ·{" "}
                    {formatFileSize(attachment.sizeBytes)} ·{" "}
                    {formatDateTime(attachment.createdAt)}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    Dodał:{" "}
                    {uploaderNames.get(attachment.uploadedById) ??
                      attachment.uploadedById}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-md border px-2 py-1 text-xs font-semibold ${
                    statusClasses[attachment.verificationStatus] ??
                    "border-neutral-200 bg-white text-neutral-700"
                  }`}
                >
                  {attachment.verificationStatus}
                </span>
                <button
                  type="button"
                  onClick={() => void downloadAttachment(attachment.id)}
                  disabled={busyAttachmentId === attachment.id}
                  className="h-9 rounded-md border border-neutral-200 bg-white px-3 text-sm font-semibold text-neutral-700 transition hover:border-neutral-400 disabled:cursor-wait disabled:opacity-50"
                >
                  Pobierz
                </button>
                <button
                  type="button"
                  onClick={() => void removeAttachment(attachment.id)}
                  disabled={busyAttachmentId === attachment.id}
                  className="h-9 rounded-md border border-red-200 bg-red-50 px-3 text-sm font-semibold text-red-700 transition hover:border-red-400 disabled:cursor-wait disabled:opacity-50"
                >
                  Usuń
                </button>
              </div>
            </article>
          ))
        ) : (
          <p className="rounded-lg border border-dashed border-neutral-300 px-4 py-8 text-center text-sm text-neutral-500">
            Brak załączników w sprawie.
          </p>
        )}
      </div>

      {getDownloadUrl.error || deleteAttachment.error ? (
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {getDownloadUrl.error?.message ?? deleteAttachment.error?.message}
        </p>
      ) : null}
    </section>
  );
}
