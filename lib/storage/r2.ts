import {
  DeleteObjectCommand,
  GetObjectCommand,
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

function getR2Config(): R2Config {
  const accountId = process.env.R2_ACCOUNT_ID;
  const endpoint =
    process.env.R2_ENDPOINT ??
    (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined);
  const bucketName = process.env.R2_BUCKET_NAME;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!endpoint || !bucketName || !accessKeyId || !secretAccessKey) {
    throw new Error("Brak konfiguracji Cloudflare R2.");
  }

  return {
    endpoint,
    bucketName,
    accessKeyId,
    secretAccessKey,
  };
}

function createR2Client() {
  const config = getR2Config();

  return new S3Client({
    region: "auto",
    endpoint: config.endpoint,
    forcePathStyle: true,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
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
  const config = getR2Config();
  const client = createR2Client();
  const command = new PutObjectCommand({
    Bucket: config.bucketName,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(client, command, { expiresIn });
}

export async function generateDownloadUrl(key: string, expiresIn = 3600) {
  const config = getR2Config();
  const client = createR2Client();
  const command = new GetObjectCommand({
    Bucket: config.bucketName,
    Key: key,
  });

  return getSignedUrl(client, command, { expiresIn });
}

export async function deleteObject(key: string) {
  const config = getR2Config();
  const client = createR2Client();
  const command = new DeleteObjectCommand({
    Bucket: config.bucketName,
    Key: key,
  });

  await client.send(command);
}

export async function uploadObject(input: {
  key: string;
  body: Buffer | Uint8Array;
  contentType: string;
}) {
  const config = getR2Config();
  const client = createR2Client();
  const command = new PutObjectCommand({
    Bucket: config.bucketName,
    Key: input.key,
    Body: input.body,
    ContentType: input.contentType,
  });

  await client.send(command);
}
