import { gzip } from "node:zlib";
import { promisify } from "node:util";

import type { PrismaClient } from "@prisma/client";

import {
  StorageConfigurationError,
  generateDownloadUrl,
  getR2ConfigurationStatus,
  isLocalDevelopmentStorageKey,
  listObjects,
  uploadObject,
  type StorageObject,
} from "@/lib/storage/r2";

const gzipAsync = promisify(gzip);
const backupPrefix = "backups/database/";
const backupSchemaVersion = 1;

export type BackupEntry = {
  id: string;
  name: string;
  sizeBytes: number;
  createdAt: string;
  status: "completed";
  backend: "r2" | "local-dev";
};

export type BackupStorageStatus = {
  canCreate: boolean;
  backend: "r2" | "local-dev" | "missing";
  label: string;
  missingEnv: string[];
};

function canUseDevelopmentLocalFallback() {
  return process.env.NODE_ENV !== "production";
}

function cleanStorageKey(storageKey: string) {
  return isLocalDevelopmentStorageKey(storageKey)
    ? storageKey.slice("local://".length)
    : storageKey;
}

function getBackupFileName(storageKey: string) {
  return cleanStorageKey(storageKey).split("/").at(-1) ?? storageKey;
}

function formatBackupTimestamp(date: Date) {
  return date.toISOString().replace(/[:.]/g, "-");
}

function toBackupEntry(object: StorageObject): BackupEntry {
  return {
    id: object.storageKey,
    name: getBackupFileName(object.storageKey),
    sizeBytes: object.sizeBytes,
    createdAt: object.createdAt,
    status: "completed",
    backend: isLocalDevelopmentStorageKey(object.storageKey)
      ? "local-dev"
      : "r2",
  };
}

export function isBackupStorageKey(storageKey: string) {
  return cleanStorageKey(storageKey).startsWith(backupPrefix);
}

export function getBackupStorageStatus(): BackupStorageStatus {
  const r2Status = getR2ConfigurationStatus();

  if (r2Status.configured) {
    return {
      canCreate: true,
      backend: "r2",
      label: "Cloudflare R2",
      missingEnv: [],
    };
  }

  if (canUseDevelopmentLocalFallback()) {
    return {
      canCreate: true,
      backend: "local-dev",
      label: "Lokalny storage dev",
      missingEnv: r2Status.missingEnv,
    };
  }

  return {
    canCreate: false,
    backend: "missing",
    label: "Brak konfiguracji R2",
    missingEnv: r2Status.missingEnv,
  };
}

async function collectDatabaseSnapshot(prisma: PrismaClient) {
  const tables = {
    users: await prisma.user.findMany({
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    }),
    clients: await prisma.client.findMany({
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    }),
    airlines: await prisma.airline.findMany({
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    }),
    flights: await prisma.flight.findMany({
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    }),
    claims: await prisma.claim.findMany({
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    }),
    passengers: await prisma.passenger.findMany({
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    }),
    documents: await prisma.document.findMany({
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    }),
    attachments: await prisma.attachment.findMany({
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    }),
    notes: await prisma.note.findMany({
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    }),
    tasks: await prisma.task.findMany({
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    }),
    claimStatusHistory: await prisma.claimStatusHistory.findMany({
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    }),
    assignmentHistory: await prisma.assignmentHistory.findMany({
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    }),
    payouts: await prisma.payout.findMany({
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    }),
    checkerEvents: await prisma.checkerEvent.findMany({
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    }),
    blogPosts: await prisma.blogPost.findMany({
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    }),
  };

  const counts = Object.fromEntries(
    Object.entries(tables).map(([tableName, rows]) => [tableName, rows.length]),
  );

  return {
    counts,
    tables,
  };
}

export async function createDatabaseBackup(
  prisma: PrismaClient,
  generatedByUserId: string,
): Promise<BackupEntry> {
  const generatedAt = new Date();
  const snapshot = await collectDatabaseSnapshot(prisma);
  const fileName = `oweme-crm-backup-${formatBackupTimestamp(generatedAt)}.json.gz`;
  const key = `${backupPrefix}${fileName}`;
  const payload = {
    schemaVersion: backupSchemaVersion,
    source: "oweme-crm",
    generatedAt: generatedAt.toISOString(),
    generatedByUserId,
    ...snapshot,
  };
  const body = await gzipAsync(Buffer.from(JSON.stringify(payload, null, 2)));
  const upload = await uploadObject({
    key,
    body,
    contentType: "application/gzip",
    allowDevelopmentLocalFallback: true,
  });

  return {
    id: upload.storageKey,
    name: fileName,
    sizeBytes: body.byteLength,
    createdAt: generatedAt.toISOString(),
    status: "completed",
    backend: upload.backend,
  };
}

export async function listDatabaseBackups(): Promise<BackupEntry[]> {
  try {
    const objects = await listObjects(backupPrefix, {
      allowDevelopmentLocalFallback: true,
    });

    return objects
      .filter((object) => isBackupStorageKey(object.storageKey))
      .map(toBackupEntry)
      .sort(
        (first, second) =>
          new Date(second.createdAt).getTime() -
          new Date(first.createdAt).getTime(),
      );
  } catch (error) {
    if (error instanceof StorageConfigurationError) {
      return [];
    }

    throw error;
  }
}

export async function getDatabaseBackupDownloadUrl(storageKey: string) {
  return generateDownloadUrl(storageKey, 3600);
}
