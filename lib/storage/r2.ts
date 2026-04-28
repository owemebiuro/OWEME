import { mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import type { Dirent } from "node:fs";
import path from "node:path";

import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

type R2Config = {
  endpoint: string;
  bucketName: string;
  accessKeyId: string;
  secretAccessKey: string;
};

type StorageUploadResult = {
  storageKey: string;
  backend: "r2" | "local-dev";
};

type UploadObjectInput = {
  key: string;
  body: Buffer | Uint8Array;
  contentType: string;
  allowDevelopmentLocalFallback?: boolean;
};

type ListObjectsOptions = {
  allowDevelopmentLocalFallback?: boolean;
};

export type StorageObject = {
  storageKey: string;
  sizeBytes: number;
  createdAt: string;
};

const localStoragePrefix = "local://";
const localStorageRoot = path.join(process.cwd(), ".dev-storage");

export class StorageConfigurationError extends Error {
  readonly publicMessage =
    "Nie udało się zapisać pliku. Storage plików nie jest skonfigurowany.";

  constructor(
    public readonly missingEnv: string[],
    public readonly operation: string,
  ) {
    super(
      `Storage Cloudflare R2 nie jest skonfigurowany dla operacji "${operation}". Brakujące zmienne: ${missingEnv.join(
        ", ",
      )}.`,
    );
    this.name = "StorageConfigurationError";
  }
}

export class StorageUploadError extends Error {
  readonly publicMessage = "Nie udało się zapisać pliku w storage dokumentów.";

  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "StorageUploadError";
  }
}

export class StorageDownloadError extends Error {
  readonly publicMessage = "Nie udało się przygotować pobrania pliku.";

  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "StorageDownloadError";
  }
}

export class StorageDeleteError extends Error {
  readonly publicMessage = "Nie udało się usunąć pliku ze storage.";

  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "StorageDeleteError";
  }
}

function getMissingR2Env() {
  const missing: string[] = [];

  if (!process.env.R2_BUCKET_NAME) {
    missing.push("R2_BUCKET_NAME");
  }

  if (!process.env.R2_ACCESS_KEY_ID) {
    missing.push("R2_ACCESS_KEY_ID");
  }

  if (!process.env.R2_SECRET_ACCESS_KEY) {
    missing.push("R2_SECRET_ACCESS_KEY");
  }

  if (!process.env.R2_ENDPOINT && !process.env.R2_ACCOUNT_ID) {
    missing.push("R2_ACCOUNT_ID or R2_ENDPOINT");
  }

  return missing;
}

export function isR2Configured() {
  return getMissingR2Env().length === 0;
}

export function getR2ConfigurationStatus() {
  const missingEnv = getMissingR2Env();

  return {
    configured: missingEnv.length === 0,
    missingEnv,
  };
}

function getR2Config(operation: string): R2Config {
  const accountId = process.env.R2_ACCOUNT_ID;
  const endpoint =
    process.env.R2_ENDPOINT ??
    (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined);
  const bucketName = process.env.R2_BUCKET_NAME;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const missingEnv = getMissingR2Env();

  if (
    missingEnv.length > 0 ||
    !endpoint ||
    !bucketName ||
    !accessKeyId ||
    !secretAccessKey
  ) {
    throw new StorageConfigurationError(missingEnv, operation);
  }

  return {
    endpoint,
    bucketName,
    accessKeyId,
    secretAccessKey,
  };
}

function createR2Client(operation: string) {
  const config = getR2Config(operation);

  return {
    client: new S3Client({
      region: "auto",
      endpoint: config.endpoint,
      forcePathStyle: true,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    }),
    config,
  };
}

function sanitizeFileName(fileName: string) {
  const withoutPath = fileName.split(/[\\/]/).at(-1) ?? "plik";
  const normalized = withoutPath
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .toLowerCase();

  return normalized || "plik";
}

function canUseDevelopmentLocalFallback() {
  return process.env.NODE_ENV !== "production";
}

function ensureRelativeStoragePath(value: string) {
  const normalized = path.posix.normalize(value).replace(/^(\.\.(\/|\\|$))+/, "");

  if (normalized.startsWith("..")) {
    throw new StorageUploadError(
      "Ścieżka local-dev storage jest nieprawidłowa.",
    );
  }

  return normalized.replace(/^\/+/, "");
}

function getLocalStorageRelativePath(storageKey: string) {
  return storageKey.startsWith(localStoragePrefix)
    ? ensureRelativeStoragePath(storageKey.slice(localStoragePrefix.length))
    : null;
}

export function isLocalDevelopmentStorageKey(storageKey: string) {
  return storageKey.startsWith(localStoragePrefix);
}

export function getLocalDevelopmentStoragePath(storageKey: string) {
  const relativePath = getLocalStorageRelativePath(storageKey);

  if (!relativePath) {
    throw new StorageDownloadError(
      "Próba odczytu ścieżki local-dev dla klucza, który nie jest lokalny.",
    );
  }

  const resolvedPath = path.resolve(localStorageRoot, relativePath);
  const resolvedRoot = path.resolve(localStorageRoot);

  if (!resolvedPath.startsWith(resolvedRoot)) {
    throw new StorageDownloadError(
      "Ścieżka local-dev storage wychodzi poza dozwolony katalog.",
    );
  }

  return resolvedPath;
}

function buildLocalStorageKey(key: string) {
  return `${localStoragePrefix}${ensureRelativeStoragePath(key)}`;
}

function buildLocalDownloadUrl(storageKey: string) {
  const relativePath = getLocalStorageRelativePath(storageKey);

  if (!relativePath) {
    throw new StorageDownloadError(
      "Nie udało się przygotować lokalnego URL pobrania.",
    );
  }

  return `/api/dev-storage/${relativePath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/")}`;
}

async function uploadObjectToLocalDevelopmentStorage(
  key: string,
  body: Buffer | Uint8Array,
) {
  const storageKey = buildLocalStorageKey(key);
  const filePath = getLocalDevelopmentStoragePath(storageKey);

  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, body);

  return {
    storageKey,
    backend: "local-dev" as const,
  };
}

async function listLocalDevelopmentStorageObjects(prefix: string) {
  const normalizedPrefix = ensureRelativeStoragePath(prefix);
  const rootPath = getLocalDevelopmentStoragePath(
    buildLocalStorageKey(normalizedPrefix),
  );
  const resolvedRoot = path.resolve(localStorageRoot);
  const results: StorageObject[] = [];

  async function visit(directoryPath: string) {
    let entries: Dirent[];

    try {
      entries = await readdir(directoryPath, { withFileTypes: true });
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        return;
      }

      throw error;
    }

    for (const entry of entries) {
      const entryPath = path.join(directoryPath, entry.name);

      if (!path.resolve(entryPath).startsWith(resolvedRoot)) {
        throw new StorageDownloadError(
          "Ścieżka local-dev storage wychodzi poza dozwolony katalog.",
        );
      }

      if (entry.isDirectory()) {
        await visit(entryPath);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      const fileStats = await stat(entryPath);
      const relativePath = path
        .relative(localStorageRoot, entryPath)
        .split(path.sep)
        .join("/");

      results.push({
        storageKey: buildLocalStorageKey(relativePath),
        sizeBytes: fileStats.size,
        createdAt: fileStats.mtime.toISOString(),
      });
    }
  }

  await visit(rootPath);

  return results;
}

export function getStorageKey(claimId: string, fileName: string) {
  return `claims/${claimId}/attachments/${Date.now()}-${sanitizeFileName(
    fileName,
  )}`;
}

export function getDocumentStorageKey(
  claimId: string,
  documentType: string,
  version: number,
) {
  return `claims/${claimId}/documents/${documentType}-v${version}-${Date.now()}.docx`;
}

export async function generateUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 300,
) {
  try {
    const { client, config } = createR2Client("presigned upload");
    const command = new PutObjectCommand({
      Bucket: config.bucketName,
      Key: key,
      ContentType: contentType,
    });

    return await getSignedUrl(client, command, { expiresIn });
  } catch (error) {
    if (error instanceof StorageConfigurationError) {
      throw error;
    }

    throw new StorageUploadError(
      "Nie udało się wygenerować presigned URL uploadu dla Cloudflare R2.",
      error,
    );
  }
}

export async function generateDownloadUrl(key: string, expiresIn = 3600) {
  if (isLocalDevelopmentStorageKey(key)) {
    try {
      const filePath = getLocalDevelopmentStoragePath(key);
      await readFile(filePath);
      return buildLocalDownloadUrl(key);
    } catch (error) {
      throw new StorageDownloadError(
        "Nie udało się przygotować lokalnego URL pobrania dla dokumentu developerskiego.",
        error,
      );
    }
  }

  try {
    const { client, config } = createR2Client("presigned download");
    const command = new GetObjectCommand({
      Bucket: config.bucketName,
      Key: key,
    });

    return await getSignedUrl(client, command, { expiresIn });
  } catch (error) {
    if (error instanceof StorageConfigurationError) {
      throw error;
    }

    throw new StorageDownloadError(
      "Nie udało się wygenerować presigned URL pobrania z Cloudflare R2.",
      error,
    );
  }
}

export async function deleteObject(key: string) {
  if (isLocalDevelopmentStorageKey(key)) {
    try {
      const filePath = getLocalDevelopmentStoragePath(key);
      await rm(filePath, { force: true });
      return;
    } catch (error) {
      throw new StorageDeleteError(
        "Nie udało się usunąć lokalnego pliku developerskiego.",
        error,
      );
    }
  }

  try {
    const { client, config } = createR2Client("delete object");
    const command = new DeleteObjectCommand({
      Bucket: config.bucketName,
      Key: key,
    });

    await client.send(command);
  } catch (error) {
    if (error instanceof StorageConfigurationError) {
      throw error;
    }

    throw new StorageDeleteError(
      "Nie udało się usunąć pliku z Cloudflare R2.",
      error,
    );
  }
}

export async function listObjects(
  prefix: string,
  options: ListObjectsOptions = {},
): Promise<StorageObject[]> {
  try {
    const { client, config } = createR2Client("list objects");
    const objects: StorageObject[] = [];
    let continuationToken: string | undefined;

    do {
      const response = await client.send(
        new ListObjectsV2Command({
          Bucket: config.bucketName,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        }),
      );

      for (const object of response.Contents ?? []) {
        if (!object.Key) {
          continue;
        }

        objects.push({
          storageKey: object.Key,
          sizeBytes: object.Size ?? 0,
          createdAt:
            object.LastModified?.toISOString() ?? new Date(0).toISOString(),
        });
      }

      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    return objects;
  } catch (error) {
    if (
      error instanceof StorageConfigurationError &&
      options.allowDevelopmentLocalFallback &&
      canUseDevelopmentLocalFallback()
    ) {
      return listLocalDevelopmentStorageObjects(prefix);
    }

    if (error instanceof StorageConfigurationError) {
      throw error;
    }

    throw new StorageDownloadError(
      "Nie udało się pobrać listy plików ze storage.",
      error,
    );
  }
}

export async function uploadObject(
  input: UploadObjectInput,
): Promise<StorageUploadResult> {
  try {
    const { client, config } = createR2Client("upload object");
    const command = new PutObjectCommand({
      Bucket: config.bucketName,
      Key: input.key,
      Body: input.body,
      ContentType: input.contentType,
    });

    await client.send(command);

    return {
      storageKey: input.key,
      backend: "r2",
    };
  } catch (error) {
    if (
      error instanceof StorageConfigurationError &&
      input.allowDevelopmentLocalFallback &&
      canUseDevelopmentLocalFallback()
    ) {
      console.warn(
        `[Storage] ${error.message} Włączam local-dev fallback dla serwerowego zapisu pliku.`,
      );

      return uploadObjectToLocalDevelopmentStorage(input.key, input.body);
    }

    if (error instanceof StorageConfigurationError) {
      throw error;
    }

    throw new StorageUploadError(
      "Nie udało się wysłać pliku do Cloudflare R2.",
      error,
    );
  }
}
