import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  getLocalDevelopmentStoragePath,
  isLocalDevelopmentStorageKey,
} from "@/lib/storage/r2";

export const dynamic = "force-dynamic";

function getContentType(filePath: string) {
  const extension = path.extname(filePath).toLowerCase();

  if (extension === ".docx") {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }

  if (extension === ".pdf") {
    return "application/pdf";
  }

  if (extension === ".png") {
    return "image/png";
  }

  if (extension === ".jpg" || extension === ".jpeg") {
    return "image/jpeg";
  }

  return "application/octet-stream";
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  if (process.env.NODE_ENV === "production") {
    return new Response("Not found", { status: 404 });
  }

  const { key } = await params;
  const storageKey = `local://${key.join("/")}`;

  if (!isLocalDevelopmentStorageKey(storageKey)) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const filePath = getLocalDevelopmentStoragePath(storageKey);
    const fileBuffer = await readFile(filePath);

    return new Response(fileBuffer, {
      headers: {
        "Content-Type": getContentType(filePath),
        "Content-Disposition": `attachment; filename="${path.basename(filePath)}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error(
      "[Storage] Nie udało się odczytać pliku z local-dev storage.",
      error,
    );

    return new Response("File not found", { status: 404 });
  }
}
