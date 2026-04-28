import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  createDatabaseBackup,
  getBackupStorageStatus,
  getDatabaseBackupDownloadUrl,
  isBackupStorageKey,
  listDatabaseBackups,
} from "@/lib/backups/database-backup";
import {
  StorageConfigurationError,
  StorageDownloadError,
  StorageUploadError,
} from "@/lib/storage/r2";
import { PERMISSIONS, permissionProcedure } from "@/lib/trpc/permissions";
import { router } from "@/lib/trpc/trpc";

const backupDownloadInputSchema = z.object({
  backupId: z.string().min(1),
});

function toBackupStorageTrpcError(error: unknown) {
  if (error instanceof StorageConfigurationError) {
    console.error("[Backups] Storage backupów nie jest skonfigurowany.", error);

    return new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message:
        "Nie udało się utworzyć kopii zapasowej, ponieważ storage R2 nie jest skonfigurowany.",
    });
  }

  if (error instanceof StorageUploadError || error instanceof StorageDownloadError) {
    console.error("[Backups] Błąd warstwy storage.", error);

    return new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: error.publicMessage,
    });
  }

  return null;
}

export const backupsRouter = router({
  list: permissionProcedure(PERMISSIONS.ADMIN_EXPORT).query(async () => ({
    backups: await listDatabaseBackups(),
    storage: getBackupStorageStatus(),
  })),

  create: permissionProcedure(PERMISSIONS.ADMIN_EXPORT).mutation(
    async ({ ctx }) => {
      try {
        const backup = await createDatabaseBackup(ctx.prisma, ctx.appUser.id);

        return {
          backup,
          storage: getBackupStorageStatus(),
        };
      } catch (error) {
        const storageError = toBackupStorageTrpcError(error);

        if (storageError) {
          throw storageError;
        }

        console.error("[Backups] Nie udało się utworzyć kopii zapasowej.", error);

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Nie udało się utworzyć kopii zapasowej bazy danych.",
        });
      }
    },
  ),

  getDownloadUrl: permissionProcedure(PERMISSIONS.ADMIN_EXPORT)
    .input(backupDownloadInputSchema)
    .mutation(async ({ input }) => {
      if (!isBackupStorageKey(input.backupId)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Nieprawidłowy identyfikator kopii zapasowej.",
        });
      }

      try {
        return {
          downloadUrl: await getDatabaseBackupDownloadUrl(input.backupId),
        };
      } catch (error) {
        const storageError = toBackupStorageTrpcError(error);

        if (storageError) {
          throw storageError;
        }

        throw error;
      }
    }),
});
