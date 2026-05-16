import path from "node:path";

import "@tesseract.js-data/eng";
import jsQR from "jsqr";
import { NextRequest, NextResponse } from "next/server";
import PizZip from "pizzip";
import sharp from "sharp";
import { createWorker, OEM, PSM } from "tesseract.js";

import {
  parseBarcodePayload,
  parseBoardingPassText,
  parsePkpassJson,
} from "@/lib/boarding-pass-parser";

export const runtime = "nodejs";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const NOT_BOARDING_PASS_MESSAGE =
  "To nie wygląda na kartę pokładową. Dodaj wyraźne zdjęcie albo screen prawidłowej karty pokładowej.";
const UNSUPPORTED_FILE_MESSAGE =
  "Dodaj zdjęcie albo screen karty pokładowej w formacie JPG, PNG lub WebP.";
const TESSERACT_WORKER_PATH = path.join(
  process.cwd(),
  "node_modules",
  "tesseract.js",
  "src",
  "worker-script",
  "node",
  "index.js",
);
const TESSERACT_CORE_PATH = path.join(process.cwd(), "node_modules", "tesseract.js-core");
const TESSERACT_LANG_PATH = path.join(
  process.cwd(),
  "node_modules",
  "@tesseract.js-data",
  "eng",
  "4.0.0",
);

type OcrMode = "balanced" | "threshold" | "plain" | "route-band";

function jsonError(error: string, status: number, code: string) {
  return NextResponse.json({ error, code }, { status });
}

function fileExtension(file: File) {
  const name = file.name.toLowerCase();
  const match = name.match(/\.([a-z0-9]+)$/);
  return match?.[1] ?? "";
}

function isPkpassFile(file: File) {
  return (
    file.type === "application/vnd.apple.pkpass" ||
    fileExtension(file) === "pkpass"
  );
}

function isSupportedImageFile(file: File) {
  const supportedTypes = new Set([
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
  ]);
  const supportedExtensions = new Set(["jpg", "jpeg", "png", "webp", "heic", "heif"]);

  return supportedTypes.has(file.type) || supportedExtensions.has(fileExtension(file));
}

async function decodeQr(buffer: Buffer) {
  const image = sharp(buffer, { limitInputPixels: 32_000_000 }).rotate();
  const { data, info } = await image
    .resize({ width: 2200, height: 2200, fit: "inside", withoutEnlargement: false })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const clamped = new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength);
  const code = jsQR(clamped, info.width, info.height, {
    inversionAttempts: "attemptBoth",
  });

  return code?.data ?? null;
}

async function prepareOcrImage(buffer: Buffer, mode: OcrMode) {
  const base = sharp(buffer, { limitInputPixels: 32_000_000 }).rotate();
  const metadata = await base.metadata();
  const width = metadata.width ?? 1800;
  const height = metadata.height ?? 1800;
  const targetWidth = Math.min(Math.max(width, 1800), 2600);

  if (mode === "route-band") {
    const crop = {
      left: Math.round(width * 0.05),
      top: Math.round(height * 0.31),
      width: Math.round(width * 0.9),
      height: Math.round(height * 0.13),
    };

    return sharp(buffer, { limitInputPixels: 32_000_000 })
      .rotate()
      .extract(crop)
      .resize({ width: crop.width * 3, fit: "inside", withoutEnlargement: false })
      .grayscale()
      .normalize()
      .sharpen()
      .png()
      .toBuffer();
  }

  const image = sharp(buffer, { limitInputPixels: 32_000_000 })
    .rotate()
    .resize({ width: targetWidth, fit: "inside", withoutEnlargement: false });

  if (mode === "threshold") {
    return image.grayscale().normalize().threshold(180).png().toBuffer();
  }

  if (mode === "plain") {
    return image.png().toBuffer();
  }

  return image.grayscale().normalize().sharpen().png().toBuffer();
}

async function recognizeImageTexts(buffer: Buffer) {
  const worker = await createWorker("eng", OEM.LSTM_ONLY, {
    cachePath: path.join(process.cwd(), ".next", "cache", "tesseract"),
    corePath: TESSERACT_CORE_PATH,
    gzip: true,
    langPath: TESSERACT_LANG_PATH,
    workerPath: TESSERACT_WORKER_PATH,
  });

  try {
    const results: Array<{ confidence: number; mode: OcrMode; text: string }> = [];

    for (const mode of ["balanced", "threshold", "plain", "route-band"] satisfies OcrMode[]) {
      await worker.setParameters({
        preserve_interword_spaces: "1",
        tessedit_pageseg_mode: mode === "route-band" ? PSM.SPARSE_TEXT : PSM.AUTO,
        user_defined_dpi: "300",
      });
      const ocrImage = await prepareOcrImage(buffer, mode);
      const result = await worker.recognize(ocrImage);

      results.push({
        confidence: result.data.confidence,
        mode,
        text: result.data.text,
      });
    }

    return results;
  } finally {
    await worker.terminate();
  }
}

async function parseImage(buffer: Buffer) {
  const barcode = await decodeQr(buffer).catch(() => null);
  const barcodeResult = barcode ? parseBarcodePayload(barcode) : null;

  if (barcodeResult) {
    return barcodeResult;
  }

  const ocrResults = await recognizeImageTexts(buffer);

  for (const ocr of ocrResults) {
    const parsed = parseBoardingPassText(ocr.text, {
      ocrConfidence: ocr.confidence,
      source: "ocr",
    });

    if (parsed) {
      return parsed;
    }
  }

  const combinedText = ocrResults.map((ocr) => ocr.text).join("\n");
  const maxConfidence = Math.max(...ocrResults.map((ocr) => ocr.confidence));

  return parseBoardingPassText(combinedText, {
    ocrConfidence: maxConfidence,
    source: "ocr",
  });
}

function parsePkpass(buffer: Buffer) {
  const zip = new PizZip(buffer);
  const passJsonFile = zip.file("pass.json");

  if (!passJsonFile) {
    return null;
  }

  return parsePkpassJson(JSON.parse(passJsonFile.asText()));
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const barcode = formData.get("barcode");

    if (typeof barcode === "string" && barcode.trim()) {
      const parsed = parseBarcodePayload(barcode);

      if (!parsed) {
        return jsonError(NOT_BOARDING_PASS_MESSAGE, 422, "NOT_BOARDING_PASS");
      }

      return NextResponse.json(parsed);
    }

    const file = formData.get("file");

    if (!(file instanceof File)) {
      return jsonError("Brak pliku.", 400, "MISSING_FILE");
    }

    if (file.size > MAX_FILE_BYTES) {
      return jsonError("Plik jest zbyt duży. Dodaj obraz do 10 MB.", 413, "FILE_TOO_LARGE");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = isPkpassFile(file)
      ? parsePkpass(buffer)
      : isSupportedImageFile(file)
        ? await parseImage(buffer)
        : null;

    if (!isPkpassFile(file) && !isSupportedImageFile(file)) {
      return jsonError(UNSUPPORTED_FILE_MESSAGE, 415, "UNSUPPORTED_FILE");
    }

    if (!parsed) {
      return jsonError(NOT_BOARDING_PASS_MESSAGE, 422, "NOT_BOARDING_PASS");
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("[boarding-pass] parse failed", error);
    return jsonError(
      "Nie udało się odczytać karty pokładowej. Dodaj wyraźniejsze zdjęcie albo wpisz dane ręcznie.",
      500,
      "PARSE_FAILED",
    );
  }
}
