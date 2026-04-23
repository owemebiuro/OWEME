import { UserRole } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { sendEmail } from "@/lib/email";
import { passwordResetEmailTemplate } from "@/lib/email/templates";
import { createSupabaseAdminClient, getSiteUrl } from "@/lib/supabase/admin";
import { PERMISSIONS, permissionProcedure } from "@/lib/trpc/permissions";
import { protectedProcedure, router } from "@/lib/trpc/trpc";

const userRoleSchema = z.enum(UserRole);

const createUserInputSchema = z.object({
  email: z.string().trim().email("Podaj poprawny email.").toLowerCase(),
  name: z.string().trim().min(2, "Imię i nazwisko jest wymagane."),
  role: userRoleSchema,
});

const updateRoleInputSchema = z.object({
  userId: z.string().min(1),
  role: userRoleSchema,
});

const userIdInputSchema = z.object({
  userId: z.string().min(1),
});

function requireCurrentAdmin(ctx: { appUser: { id: string } | null }) {
  if (!ctx.appUser) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Brak aktywnego użytkownika aplikacyjnego OWEME.",
    });
  }

  return ctx.appUser;
}

function getAdminClientOrThrow() {
  const supabaseAdmin = createSupabaseAdminClient();

  if (!supabaseAdmin) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message:
        "Brak SUPABASE_SERVICE_ROLE_KEY. Nie można wykonać operacji administracyjnej Supabase Auth.",
    });
  }

  return supabaseAdmin;
}

export const usersRouter = router({
  listActive: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.appUser) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Brak aktywnego użytkownika aplikacyjnego OWEME.",
      });
    }

    return ctx.prisma.user.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: {
        name: "asc",
      },
    });
  }),

  list: permissionProcedure(PERMISSIONS.ADMIN_USERS).query(async ({ ctx }) => {
    return ctx.prisma.user.findMany({
      select: {
        id: true,
        authUserId: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        _count: {
          select: {
            ownedClaims: true,
          },
        },
      },
      orderBy: [{ name: "asc" }, { createdAt: "desc" }],
    });
  }),

  create: permissionProcedure(PERMISSIONS.ADMIN_USERS)
    .input(createUserInputSchema)
    .mutation(async ({ ctx, input }) => {
      const supabaseAdmin = getAdminClientOrThrow();
      const existingUser = await ctx.prisma.user.findUnique({
        where: {
          email: input.email,
        },
        select: {
          id: true,
        },
      });

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Użytkownik aplikacyjny z tym adresem email już istnieje.",
        });
      }

      const invite = await supabaseAdmin.auth.admin.inviteUserByEmail(
        input.email,
        {
          data: {
            name: input.name,
            role: input.role,
          },
          redirectTo: `${getSiteUrl()}/login`,
        },
      );

      if (invite.error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: invite.error.message,
        });
      }

      return ctx.prisma.user.create({
        data: {
          email: input.email,
          name: input.name,
          role: input.role,
          authUserId: invite.data.user?.id ?? null,
          isActive: true,
        },
        select: {
          id: true,
          authUserId: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          _count: {
            select: {
              ownedClaims: true,
            },
          },
        },
      });
    }),

  updateRole: permissionProcedure(PERMISSIONS.ADMIN_USERS)
    .input(updateRoleInputSchema)
    .mutation(async ({ ctx, input }) => {
      const currentAdmin = requireCurrentAdmin(ctx);

      if (input.userId === currentAdmin.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Nie możesz zmienić własnej roli z tej listy.",
        });
      }

      return ctx.prisma.user.update({
        where: {
          id: input.userId,
        },
        data: {
          role: input.role,
        },
        select: {
          id: true,
          role: true,
        },
      });
    }),

  toggleActive: permissionProcedure(PERMISSIONS.ADMIN_USERS)
    .input(userIdInputSchema)
    .mutation(async ({ ctx, input }) => {
      const currentAdmin = requireCurrentAdmin(ctx);

      if (input.userId === currentAdmin.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Nie możesz dezaktywować własnego konta.",
        });
      }

      const user = await ctx.prisma.user.findUnique({
        where: {
          id: input.userId,
        },
        select: {
          isActive: true,
        },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Nie znaleziono użytkownika.",
        });
      }

      return ctx.prisma.user.update({
        where: {
          id: input.userId,
        },
        data: {
          isActive: !user.isActive,
        },
        select: {
          id: true,
          isActive: true,
        },
      });
    }),

  resetPassword: permissionProcedure(PERMISSIONS.ADMIN_USERS)
    .input(userIdInputSchema)
    .mutation(async ({ ctx, input }) => {
      const supabaseAdmin = getAdminClientOrThrow();
      const user = await ctx.prisma.user.findUnique({
        where: {
          id: input.userId,
        },
        select: {
          email: true,
          name: true,
        },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Nie znaleziono użytkownika.",
        });
      }

      const link = await supabaseAdmin.auth.admin.generateLink({
        type: "recovery",
        email: user.email,
        options: {
          redirectTo: `${getSiteUrl()}/login`,
        },
      });

      if (link.error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: link.error.message,
        });
      }

      const actionLink = link.data.properties?.action_link;

      if (!actionLink) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Supabase nie zwrócił linku resetowania hasła.",
        });
      }

      const template = passwordResetEmailTemplate({
        name: user.name,
        resetUrl: actionLink,
      });

      const result = await sendEmail({
        to: user.email,
        subject: template.subject,
        html: template.html,
      });

      return {
        ok: result.ok,
      };
    }),
});
