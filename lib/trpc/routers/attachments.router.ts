import { AttachmentType, NoteType, UserRole } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { hasPermission } from "@/lib/auth-helpers";
import {
  isAllowedAttachmentContentType,
  maxUploadSizeBytes,
  validateAttachmentFile,
} from "@/lib/storage/file-validation";
import {
  StorageConfigurationError,
  StorageDeleteError,
  StorageDownloadError,
  StorageUploadError,
  deleteObject,
  generateDownloadUrl,
  generateUploadUrl,
  getStorageKey,
} from "@/lib/storage/r2";
import type { Context } from "@/lib/trpc/context";
import { PERMISSIONS, permissionProcedure } from "@/lib/trpc/permissions";
import { router } from "@/lib/trpc/trpc";
import type { AppUser } from "@/types/auth";

const getUploadUrlInputSchema = z
  .object({
    claimId: z.string().min(1),
    fileName: z.string().trim().min(1),
    contentType: z.string().trim().min(1),
    fileSize: z.number().int().positive().max(maxUploadSizeBytes - 1),
    attachmentType: z.enum(AttachmentType),
  })
  .superRefine((input, ctx) => {
    if (!isAllowedAttachmentContentType(input.contentType)) {
      ctx.addIssue({
        code: "custom",
        path: ["contentType"],
        message: "Ten typ pliku nie jest obsługiwany.",
      });
    }
  });

const attachmentIdInputSchema = z.object({
  attachmentId: z.string().min(1),
});

function requireAppUser(ctx: Context): AppUser {
  if (!ctx.appUser) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Brak aktywnego użytkownika aplikacyjnego OWEME.",
    });
  }

  return ctx.appUser;
}

function canReadClaimAttachment(appUser: AppUser, ownerId: string | null) {
  if (appUser.role === UserRole.ADMIN) {
    return true;
  }

  if (ownerId === appUser.id) {
    return true;
  }

  return hasPermission(appUser, "crm:read");
}

function canWriteClaimAttachment(appUser: AppUser, ownerId: string | null) {
  if (appUser.role === UserRole.ADMIN) {
    return true;
  }

  if (ownerId === appUser.id && hasPermission(appUser, "crm:write")) {
    return true;
  }

  return (
    ownerId === null &&
    appUser.role === UserRole.OPERATOR &&
    hasPermission(appUser, "crm:write")
  );
}

async function getClaimForAttachmentAccess(ctx: Context, claimId: string) {
  const claim = await ctx.prisma.claim.findFirst({
    where: {
      id: claimId,
      deletedAt: null,
    },
    select: {
      id: true,
      ownerId: true,
    },
  });

  if (!claim) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Nie znaleziono sprawy.",
    });
  }

  return claim;
}

async function getAttachmentForAccess(ctx: Context, attachmentId: string) {
  const attachment = await ctx.prisma.attachment.findUnique({
    where: {
      id: attachmentId,
    },
    include: {
      claim: {
        select: {
          id: true,
          ownerId: true,
          deletedAt: true,
        },
      },
    },
  });

  if (!attachment || attachment.claim.deletedAt) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Nie znaleziono załącznika.",
    });
  }

  return attachment;
}

function toAttachmentStorageTrpcError(error: unknown) {
  if (
    error instanceof StorageConfigurationError ||
    error instanceof StorageUploadError ||
    error instanceof StorageDownloadError ||
    error instanceof StorageDeleteError
  ) {
    console.error("[Attachments] Błąd warstwy storage.", error);

    return new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: error.publicMessage,
    });
  }

  return null;
}

export const attachmentsRouter = router({
  getUploadUrl: permissionProcedure(PERMISSIONS.ATTACHMENT_UPLOAD)
    .input(getUploadUrlInputSchema)
    .mutation(async ({ ctx, input }) => {
      const appUser = requireAppUser(ctx);
      const validationErrors = validateAttachmentFile({
        contentType: input.contentType,
        fileSize: input.fileSize,
      });

      if (validationErrors.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: validationErrors.join(" "),
        });
      }

      const claim = await getClaimForAttachmentAccess(ctx, input.claimId);

      if (!canWriteClaimAttachment(appUser, claim.ownerId)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Brak uprawnień do dodawania załączników.",
        });
      }

      const storageKey = getStorageKey(input.claimId, input.fileName);
      let uploadUrl: string;

      try {
        uploadUrl = await generateUploadUrl(storageKey, input.contentType, 300);
      } catch (error) {
        const storageError = toAttachmentStorageTrpcError(error);

        if (storageError) {
          throw storageError;
        }

        throw error;
      }

      const attachment = await ctx.prisma.attachment.create({
        data: {
          claimId: input.claimId,
          uploadedById: appUser.id,
          type: input.attachmentType,
          fileName: input.fileName,
          mimeType: input.contentType,
          sizeBytes: input.fileSize,
          storageKey,
          verificationStatus: "PENDING",
        },
        select: {
          id: true,
        },
      });

      return {
        uploadUrl,
        attachmentId: attachment.id,
        storageKey,
      };
    }),

  confirmUpload: permissionProcedure(PERMISSIONS.ATTACHMENT_UPLOAD)
    .input(attachmentIdInputSchema)
    .mutation(async ({ ctx, input }) => {
      const appUser = requireAppUser(ctx);
      const attachment = await getAttachmentForAccess(ctx, input.attachmentId);

      if (!canWriteClaimAttachment(appUser, attachment.claim.ownerId)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Brak uprawnień do potwierdzenia uploadu.",
        });
      }

      return ctx.prisma.attachment.update({
        where: {
          id: input.attachmentId,
        },
        data: {
          verificationStatus: "UPLOADED",
        },
      });
    }),

  getDownloadUrl: permissionProcedure(PERMISSIONS.ATTACHMENT_VIEW)
    .input(attachmentIdInputSchema)
    .mutation(async ({ ctx, input }) => {
      const appUser = requireAppUser(ctx);
      const attachment = await getAttachmentForAccess(ctx, input.attachmentId);

      if (!canReadClaimAttachment(appUser, attachment.claim.ownerId)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Brak uprawnień do pobrania załącznika.",
        });
      }

      let downloadUrl: string;

      try {
        downloadUrl = await generateDownloadUrl(attachment.storageKey, 3600);
      } catch (error) {
        const storageError = toAttachmentStorageTrpcError(error);

        if (storageError) {
          throw storageError;
        }

        throw error;
      }

      await ctx.prisma.note.create({
        data: {
          claimId: attachment.claimId,
          authorId: appUser.id,
          type: NoteType.INTERNAL,
          content: `Pobrano załącznik: ${attachment.fileName}`,
        },
      });

      return {
        downloadUrl,
      };
    }),

  delete: permissionProcedure(PERMISSIONS.ATTACHMENT_DELETE)
    .input(attachmentIdInputSchema)
    .mutation(async ({ ctx, input }) => {
      const appUser = requireAppUser(ctx);
      const attachment = await getAttachmentForAccess(ctx, input.attachmentId);

      if (!canWriteClaimAttachment(appUser, attachment.claim.ownerId)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Brak uprawnień do usuwania załącznika.",
        });
      }

      try {
        await deleteObject(attachment.storageKey);
      } catch (error) {
        const storageError = toAttachmentStorageTrpcError(error);

        if (storageError) {
          throw storageError;
        }

        throw error;
      }

      await ctx.prisma.$transaction([
        ctx.prisma.attachment.delete({
          where: {
            id: input.attachmentId,
          },
        }),
        ctx.prisma.note.create({
          data: {
            claimId: attachment.claimId,
            authorId: appUser.id,
            type: NoteType.INTERNAL,
            content: `Usunięto załącznik: ${attachment.fileName}`,
          },
        }),
      ]);

      return {
        ok: true,
      };
    }),
});
