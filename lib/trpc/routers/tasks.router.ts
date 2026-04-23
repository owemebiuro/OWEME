import { TaskPriority, TaskStatus } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { PERMISSIONS, permissionProcedure } from "@/lib/trpc/permissions";
import { router } from "@/lib/trpc/trpc";

const createTaskInputSchema = z.object({
  claimId: z.string().min(1),
  title: z.string().trim().min(1, "Tytuł zadania jest wymagany."),
  dueDate: z.coerce.date().optional(),
  assigneeId: z.string().min(1).nullable().optional(),
  priority: z.enum(TaskPriority).default(TaskPriority.MEDIUM),
});

const closeTaskInputSchema = z.object({
  id: z.string().min(1),
});

export const tasksRouter = router({
  create: permissionProcedure(PERMISSIONS.TASK_CREATE)
    .input(createTaskInputSchema)
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

      if (input.assigneeId) {
        const assignee = await ctx.prisma.user.findFirst({
          where: {
            id: input.assigneeId,
            isActive: true,
          },
          select: {
            id: true,
          },
        });

        if (!assignee) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Wybrany użytkownik nie istnieje.",
          });
        }
      }

      return ctx.prisma.task.create({
        data: {
          claimId: input.claimId,
          creatorId: ctx.appUser.id,
          assigneeId: input.assigneeId ?? null,
          title: input.title,
          dueDate: input.dueDate,
          priority: input.priority,
        },
        include: {
          assignee: true,
        },
      });
    }),

  close: permissionProcedure(PERMISSIONS.TASK_CLOSE)
    .input(closeTaskInputSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.appUser) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Brak aktywnego użytkownika aplikacyjnego OWEME.",
        });
      }

      const task = await ctx.prisma.task.findFirst({
        where: {
          id: input.id,
          status: {
            not: TaskStatus.DONE,
          },
        },
        select: {
          id: true,
        },
      });

      if (!task) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Nie znaleziono aktywnego zadania.",
        });
      }

      return ctx.prisma.task.update({
        where: {
          id: input.id,
        },
        data: {
          status: TaskStatus.DONE,
          closedAt: new Date(),
        },
        include: {
          assignee: true,
        },
      });
    }),
});
