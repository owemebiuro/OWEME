import { DocumentStatus, DocumentType, NoteType, UserRole } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { hasPermission } from "@/lib/auth-helpers";
import {
  DocumentRenderError,
  DocumentTemplateLoadError,
  DocumentValidationError,
  documentClaimInclude,
  generateAndStore,
} from "@/lib/documents/generator";
import {
  StorageConfigurationError,
  StorageDeleteError,
  StorageDownloadError,
  StorageUploadError,
  deleteObject,
  generateDownloadUrl,
} from "@/lib/storage/r2";
import type { Context } from "@/lib/trpc/context";
import { PERMISSIONS, permissionProcedure } from "@/lib/trpc/permissions";
import { router } from "@/lib/trpc/trpc";
import type { AppUser } from "@/types/auth";

const documentTypeSchema = z.enum(DocumentType);

const generateInputSchema = z.object({
  claimId: z.string().min(1),
  documentType: documentTypeSchema,
});

const documentIdInputSchema = z.object({
  documentId: z.string().min(1),
});

const listByClaimInputSchema = z.object({
  claimId: z.string().min(1),
});

const operatorDocuments = new Set<DocumentType>(
  Object.values(DocumentType).filter((type) => type !== DocumentType.LAWSUIT),
);
const lawyerDocuments = new Set<DocumentType>([
  DocumentType.LAWSUIT,
  DocumentType.NEGATIVE_RESPONSE_REPLY,
  DocumentType.POWER_OF_ATTORNEY,
]);

function requireAppUser(ctx: Context): AppUser {
  if (!ctx.appUser) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Brak aktywnego użytkownika aplikacyjnego OWEME.",
    });
  }

  return ctx.appUser;
}

function canReadClaim(appUser: AppUser, ownerId: string | null) {
  if (appUser.role === UserRole.ADMIN || appUser.role === UserRole.SUPER_ADMIN) {
    return true;
  }

  if (ownerId === appUser.id) {
    return true;
  }

  return hasPermission(appUser, "crm:read");
}

function canWriteClaim(appUser: AppUser, ownerId: string | null) {
  if (appUser.role === UserRole.ADMIN || appUser.role === UserRole.SUPER_ADMIN) {
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

function canGenerateDocument(appUser: AppUser, documentType: DocumentType) {
  if (appUser.role === UserRole.ADMIN || appUser.role === UserRole.SUPER_ADMIN) {
    return true;
  }

  if (appUser.role === UserRole.OPERATOR) {
    return operatorDocuments.has(documentType);
  }

  if (appUser.role === UserRole.LAWYER) {
    return lawyerDocuments.has(documentType);
  }

  return false;
}

async function getDocumentForAccess(ctx: Context, documentId: string) {
  const document = await ctx.prisma.document.findUnique({
    where: {
      id: documentId,
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

  if (!document || document.claim.deletedAt) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Nie znaleziono dokumentu.",
    });
  }

  return document;
}

function toStorageTrpcError(error: unknown) {
  if (
    error instanceof StorageConfigurationError ||
    error instanceof StorageUploadError ||
    error instanceof StorageDownloadError ||
    error instanceof StorageDeleteError
  ) {
    console.error("[Documents] Błąd warstwy storage.", error);

    return new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: error.publicMessage,
    });
  }

  return null;
}

export const documentsRouter = router({
  generate: permissionProcedure(PERMISSIONS.DOCUMENT_GENERATE)
    .input(generateInputSchema)
    .mutation(async ({ ctx, input }) => {
      const appUser = requireAppUser(ctx);

      if (!canGenerateDocument(appUser, input.documentType)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Brak uprawnień do wygenerowania tego dokumentu.",
        });
      }

      const claim = await ctx.prisma.claim.findFirst({
        where: {
          id: input.claimId,
          deletedAt: null,
        },
        include: documentClaimInclude,
      });

      if (!claim) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Nie znaleziono sprawy.",
        });
      }

      if (!canReadClaim(appUser, claim.ownerId)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Brak dostępu do sprawy.",
        });
      }

      try {
        const document = await generateAndStore(
          claim,
          input.documentType,
          appUser.id,
        );
        const downloadUrl = await generateDownloadUrl(document.storageKey, 3600);

        return {
          document,
          downloadUrl,
        };
      } catch (error) {
        if (error instanceof DocumentValidationError) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Brak wymaganych danych:\n${error.missingFields.join("\n")}`,
          });
        }

        if (error instanceof DocumentTemplateLoadError) {
          console.error("[Documents] Nie udało się wczytać szablonu DOCX.", error);

          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Nie udało się wczytać szablonu dokumentu.",
          });
        }

        if (error instanceof DocumentRenderError) {
          console.error("[Documents] Nie udało się wyrenderować dokumentu DOCX.", error);

          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Nie udało się wygenerować pliku DOCX z szablonu.",
          });
        }

        const storageError = toStorageTrpcError(error);

        if (storageError) {
          throw storageError;
        }

        throw error;
      }
    }),

  getDownloadUrl: permissionProcedure(PERMISSIONS.DOCUMENT_DOWNLOAD)
    .input(documentIdInputSchema)
    .mutation(async ({ ctx, input }) => {
      const appUser = requireAppUser(ctx);
      const document = await getDocumentForAccess(ctx, input.documentId);

      if (!canReadClaim(appUser, document.claim.ownerId)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Brak dostępu do dokumentu.",
        });
      }

      try {
        return {
          downloadUrl: await generateDownloadUrl(document.storageKey, 3600),
        };
      } catch (error) {
        const storageError = toStorageTrpcError(error);

        if (storageError) {
          throw storageError;
        }

        throw error;
      }
    }),

  markSigned: permissionProcedure(PERMISSIONS.DOCUMENT_GENERATE)
    .input(documentIdInputSchema)
    .mutation(async ({ ctx, input }) => {
      const appUser = requireAppUser(ctx);
      const document = await getDocumentForAccess(ctx, input.documentId);

      if (!canWriteClaim(appUser, document.claim.ownerId)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Brak uprawnień do oznaczenia dokumentu jako podpisany.",
        });
      }

      return ctx.prisma.$transaction(async (tx) => {
        const updatedDocument = await tx.document.update({
          where: {
            id: input.documentId,
          },
          data: {
            isSigned: true,
            signedAt: new Date(),
            status: DocumentStatus.SIGNED,
          },
        });

        await tx.note.create({
          data: {
            claimId: document.claimId,
            authorId: appUser.id,
            type: NoteType.INTERNAL,
            content: `Oznaczono dokument jako podpisany: ${document.fileName}`,
          },
        });

        return updatedDocument;
      });
    }),

  delete: permissionProcedure(PERMISSIONS.DOCUMENT_DELETE)
    .input(documentIdInputSchema)
    .mutation(async ({ ctx, input }) => {
      const appUser = requireAppUser(ctx);
      const document = await getDocumentForAccess(ctx, input.documentId);

      if (!canWriteClaim(appUser, document.claim.ownerId)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Brak uprawnień do usuwania dokumentu.",
        });
      }

      try {
        await deleteObject(document.storageKey);
      } catch (error) {
        const storageError = toStorageTrpcError(error);

        if (storageError) {
          throw storageError;
        }

        throw error;
      }

      await ctx.prisma.$transaction([
        ctx.prisma.document.delete({
          where: {
            id: input.documentId,
          },
        }),
        ctx.prisma.note.create({
          data: {
            claimId: document.claimId,
            authorId: appUser.id,
            type: NoteType.INTERNAL,
            content: `Usunięto dokument: ${document.fileName}`,
          },
        }),
      ]);

      return {
        ok: true,
      };
    }),

  listByClaimId: permissionProcedure(PERMISSIONS.DOCUMENT_DOWNLOAD)
    .input(listByClaimInputSchema)
    .query(async ({ ctx, input }) => {
      const appUser = requireAppUser(ctx);
      const claim = await ctx.prisma.claim.findFirst({
        where: {
          id: input.claimId,
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

      if (!canReadClaim(appUser, claim.ownerId)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Brak dostępu do dokumentów sprawy.",
        });
      }

      return ctx.prisma.document.findMany({
        where: {
          claimId: input.claimId,
        },
        orderBy: [{ type: "asc" }, { version: "desc" }],
      });
    }),
});
