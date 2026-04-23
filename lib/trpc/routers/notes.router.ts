import { NoteType } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { PERMISSIONS, permissionProcedure } from "@/lib/trpc/permissions";
import { router } from "@/lib/trpc/trpc";

const createNoteInputSchema = z.object({
  claimId: z.string().min(1),
  content: z.string().trim().min(1, "Treść notatki jest wymagana."),
  type: z.enum(NoteType).default(NoteType.INTERNAL),
});

export const notesRouter = router({
  create: permissionProcedure(PERMISSIONS.NOTE_CREATE)
    .input(createNoteInputSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.appUser) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Brak aktywnego użytkownika aplikacyjnego OWEME.",
        });
      }

      const claim = await ctx.prisma.claim.findFirst({
        where: {
          id: input.claimId,
          deletedAt: null,
        },
        select: {
          id: true,
        },
      });

      if (!claim) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Nie znaleziono sprawy.",
        });
      }

      return ctx.prisma.note.create({
        data: {
          claimId: input.claimId,
          authorId: ctx.appUser.id,
          content: input.content,
          type: input.type,
        },
        include: {
          author: true,
        },
      });
    }),
});
