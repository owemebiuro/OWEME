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
          claimNumber: true,
          ownerId: true,
          clientId: true,
          client: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      if (!claim) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Nie znaleziono sprawy.",
        });
      }

      const assigneeId = input.assigneeId ?? claim.ownerId ?? ctx.appUser.id;

      if (assigneeId) {
        const assignee = await ctx.prisma.user.findFirst({
          where: {
            id: assigneeId,
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

      return ctx.prisma.$transaction(async (tx) => {
        const task = await tx.task.create({
          data: {
            claimId: input.claimId,
            clientId: claim.clientId,
            creatorId: ctx.appUser.id,
            assigneeId,
            title: input.title,
            dueDate: input.dueDate,
            priority: input.priority,
          },
          include: {
            assignee: true,
          },
        });

        if (assigneeId) {
          await tx.notification.create({
            data: {
              userId: assigneeId,
              type: "task_assigned",
              title: `Nowe zadanie: ${task.title}`,
              body: `Klient: ${claim.client.firstName} ${claim.client.lastName} · Sprawa: ${claim.claimNumber} · Priorytet: ${task.priority}`,
              taskId: task.id,
              claimId: claim.id,
              priority: task.priority,
            },
          });
        }

        return task;
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

  reopen: permissionProcedure(PERMISSIONS.TASK_CLOSE)
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
          status: TaskStatus.DONE,
        },
        select: {
          id: true,
        },
      });

      if (!task) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Nie znaleziono wykonanego zadania.",
        });
      }

      return ctx.prisma.task.update({
        where: {
          id: input.id,
        },
        data: {
          status: TaskStatus.OPEN,
          closedAt: null,
        },
        include: {
          assignee: true,
        },
      });
    }),
});
