export const maxUploadSizeBytes = 25 * 1024 * 1024;

export const allowedAttachmentContentTypes = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export function isAllowedAttachmentContentType(contentType: string) {
  return allowedAttachmentContentTypes.includes(
    contentType as (typeof allowedAttachmentContentTypes)[number],
  );
}

export function validateAttachmentFile(input: {
  contentType: string;
  fileSize: number;
}) {
  const errors: string[] = [];

  if (!isAllowedAttachmentContentType(input.contentType)) {
    errors.push("Ten typ pliku nie jest obsługiwany.");
  }

  if (input.fileSize <= 0) {
    errors.push("Plik jest pusty.");
  }

  if (input.fileSize >= maxUploadSizeBytes) {
    errors.push("Plik musi mieć mniej niż 25 MB.");
  }

  return errors;
}
