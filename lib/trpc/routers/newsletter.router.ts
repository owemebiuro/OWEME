import {
  NewsletterCampaignStatus,
  NewsletterSubscriberStatus,
  Prisma,
} from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { sendEmail } from "@/lib/email";
import {
  defaultSegments,
  previewSegment,
  type SegmentRule,
} from "@/lib/newsletter/segments";
import { createUnsubscribeToken } from "@/lib/newsletter/tokens";
import { PERMISSIONS, permissionProcedure } from "@/lib/trpc/permissions";
import { router } from "@/lib/trpc/trpc";

const campaignStatusSchema = z.enum(NewsletterCampaignStatus);
const subscriberStatusSchema = z.enum(NewsletterSubscriberStatus);
const rootOperatorSchema = z.enum(["AND", "OR"]);

const segmentConditionSchema = z.object({
  field: z.string().min(1),
  operator: z.string().min(1),
  value: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.string()),
    z.null(),
  ]).optional(),
});

const segmentRuleSchema = z.object({
  id: z.string().min(1),
  operator: rootOperatorSchema,
  conditions: z.array(segmentConditionSchema),
  group_operator: rootOperatorSchema,
});

const segmentRulesSchema = z.object({
  rules: z.array(segmentRuleSchema),
  rootOperator: rootOperatorSchema.default("AND"),
});

const campaignCreateSchema = z.object({
  name: z.string().trim().min(2, "Nazwa kampanii jest wymagana."),
  subject: z.string().trim().min(3, "Temat jest wymagany."),
  previewText: z.string().trim().optional(),
  segmentId: z.string().nullable().optional(),
  contentHtml: z.string().trim().optional(),
});

const campaignUpdateSchema = campaignCreateSchema.partial().extend({
  id: z.string().min(1),
  status: campaignStatusSchema.optional(),
  scheduledAt: z.coerce.date().nullable().optional(),
});

const subscriberCreateSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  firstName: z.string().trim().optional(),
  lastName: z.string().trim().optional(),
  source: z.string().trim().default("manual"),
  tags: z.array(z.string().trim()).default([]),
  status: subscriberStatusSchema.default("ACTIVE"),
});

const segmentCreateSchema = z.object({
  name: z.string().trim().min(2),
  description: z.string().trim().optional(),
  rules: z.array(segmentRuleSchema),
  rootOperator: rootOperatorSchema.default("AND"),
  isDynamic: z.boolean().default(true),
});

const listInputSchema = z.object({
  search: z.string().trim().optional(),
  status: z.string().trim().optional(),
}).optional();

const defaultCampaignSelect = {
  id: true,
  name: true,
  status: true,
  subject: true,
  previewText: true,
  recipientCount: true,
  scheduledAt: true,
  sentAt: true,
  createdAt: true,
  updatedAt: true,
  segment: { select: { id: true, name: true } },
  createdBy: { select: { name: true, email: true } },
  _count: { select: { emailLogs: true } },
} satisfies Prisma.NewsletterCampaignSelect;

function requireAppUser(ctx: { appUser: { id: string } | null }) {
  if (!ctx.appUser) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Brak aktywnego użytkownika aplikacyjnego OWEME.",
    });
  }

  return ctx.appUser;
}

function footerHtml() {
  return `
    <footer style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e5e5;color:#666;font-size:12px;line-height:1.5">
      <p>OWEME Kancelaria Prawna</p>
      <p><a href="{{unsubscribe_url}}">Wypisz się z newslettera</a> | <a href="{{preferences_url}}">Zmień preferencje</a></p>
      <p>Wysłano do: {{email}}</p>
    </footer>
  `;
}

function ensureFooter(html: string | null | undefined) {
  const content = html?.trim() || "<p></p>";
  return content.includes("{{unsubscribe_url}}")
    ? content
    : `${content}${footerHtml()}`;
}

export const newsletterRouter = router({
  overview: permissionProcedure(PERMISSIONS.NEWSLETTER_MANAGE).query(async ({ ctx }) => {
    requireAppUser(ctx);

    const [campaigns, subscribersTotal, subscribersActive, crmEligible, segments] =
      await ctx.prisma.$transaction([
        ctx.prisma.newsletterCampaign.findMany({
          select: defaultCampaignSelect,
          orderBy: { updatedAt: "desc" },
          take: 20,
        }),
        ctx.prisma.newsletterSubscriber.count(),
        ctx.prisma.newsletterSubscriber.count({ where: { status: "ACTIVE" } }),
        ctx.prisma.client.count({
          where: {
            marketingConsent: true,
            emailValid: true,
            email: { not: "" },
          },
        }),
        ctx.prisma.newsletterSegment.findMany({
          orderBy: [{ isSystem: "desc" }, { updatedAt: "desc" }],
          take: 20,
        }),
      ]);

    return {
      stats: {
        campaigns: campaigns.length,
        subscribersTotal,
        subscribersActive,
        crmEligible,
      },
      campaigns,
      segments,
      defaultSegments,
    };
  }),

  listCampaigns: permissionProcedure(PERMISSIONS.NEWSLETTER_MANAGE)
    .input(listInputSchema)
    .query(async ({ ctx, input }) => {
      const where: Prisma.NewsletterCampaignWhereInput = {};
      if (input?.status) {
        where.status = input.status as NewsletterCampaignStatus;
      }
      if (input?.search) {
        where.name = { contains: input.search, mode: "insensitive" };
      }

      return ctx.prisma.newsletterCampaign.findMany({
        where,
        select: defaultCampaignSelect,
        orderBy: { updatedAt: "desc" },
      });
    }),

  createCampaign: permissionProcedure(PERMISSIONS.NEWSLETTER_MANAGE)
    .input(campaignCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const appUser = requireAppUser(ctx);
      const recipientCount = input.segmentId
        ? (
            await ctx.prisma.newsletterSegment.findUnique({
              where: { id: input.segmentId },
              select: { recipientCount: true },
            })
          )?.recipientCount ?? 0
        : 0;

      return ctx.prisma.newsletterCampaign.create({
        data: {
          name: input.name,
          subject: input.subject,
          previewText: input.previewText,
          segmentId: input.segmentId ?? null,
          recipientCount,
          contentHtml: ensureFooter(input.contentHtml),
          contentText: input.contentHtml?.replace(/<[^>]*>/g, " ").trim(),
          fromName: "Kancelaria OWEME",
          fromEmail: process.env.RESEND_FROM_EMAIL ?? "newsletter@oweme.pl",
          replyTo: "kontakt@oweme.pl",
          createdById: appUser.id,
        },
        select: defaultCampaignSelect,
      });
    }),

  updateCampaign: permissionProcedure(PERMISSIONS.NEWSLETTER_MANAGE)
    .input(campaignUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, contentHtml, ...data } = input;
      const existing = await ctx.prisma.newsletterCampaign.findUnique({
        where: { id },
        select: { id: true, status: true },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Kampania nie istnieje." });
      }
      if (existing.status !== "DRAFT" && existing.status !== "SCHEDULED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Można edytować tylko kampanie robocze lub zaplanowane.",
        });
      }

      return ctx.prisma.newsletterCampaign.update({
        where: { id },
        data: {
          ...data,
          contentHtml: contentHtml === undefined ? undefined : ensureFooter(contentHtml),
          contentText:
            contentHtml === undefined ? undefined : contentHtml.replace(/<[^>]*>/g, " ").trim(),
        },
        select: defaultCampaignSelect,
      });
    }),

  validateCampaign: permissionProcedure(PERMISSIONS.NEWSLETTER_MANAGE)
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const campaign = await ctx.prisma.newsletterCampaign.findUnique({
        where: { id: input.id },
      });

      if (!campaign) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Kampania nie istnieje." });
      }

      return {
        has_recipients: campaign.recipientCount > 0,
        has_subject: campaign.subject.trim().length >= 3,
        has_preview_text: (campaign.previewText ?? "").trim().length >= 10,
        has_content: (campaign.contentHtml ?? "").trim().length > 0,
        has_unsubscribe_link: (campaign.contentHtml ?? "").includes("{{unsubscribe_url}}"),
        no_broken_images: true,
        sender_verified: Boolean(process.env.RESEND_FROM_EMAIL),
        test_sent: await ctx.prisma.newsletterEmailLog.count({
          where: { campaignId: campaign.id, status: "SENT" },
        }).then((count) => count > 0),
      };
    }),

  sendTest: permissionProcedure(PERMISSIONS.NEWSLETTER_MANAGE)
    .input(z.object({ id: z.string().min(1), email: z.string().email() }))
    .mutation(async ({ ctx, input }) => {
      const campaign = await ctx.prisma.newsletterCampaign.findUnique({
        where: { id: input.id },
      });

      if (!campaign) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Kampania nie istnieje." });
      }

      const token = createUnsubscribeToken({
        email: input.email,
        campaignId: campaign.id,
      });
      const unsubscribeUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/unsubscribe?token=${token}`;
      const html = ensureFooter(campaign.contentHtml)
        .replaceAll("{{email}}", input.email)
        .replaceAll("{{unsubscribe_url}}", unsubscribeUrl)
        .replaceAll("{{preferences_url}}", unsubscribeUrl);

      const result = await sendEmail({
        to: input.email,
        subject: `[TEST] ${campaign.subject}`,
        html,
      });

      await ctx.prisma.newsletterEmailLog.create({
        data: {
          campaignId: campaign.id,
          recipientEmail: input.email,
          status: result.ok ? "SENT" : "FAILED",
          messageId: result.ok ? result.id : null,
          errorMessage: result.ok ? null : String(result.error),
          sentAt: result.ok ? new Date() : null,
        },
      });

      return { sent: result.ok };
    }),

  listSubscribers: permissionProcedure(PERMISSIONS.NEWSLETTER_MANAGE)
    .input(listInputSchema)
    .query(async ({ ctx, input }) => {
      const where: Prisma.NewsletterSubscriberWhereInput = {};
      if (input?.status) {
        where.status = input.status as NewsletterSubscriberStatus;
      }
      if (input?.search) {
        where.OR = [
          { email: { contains: input.search, mode: "insensitive" } },
          { firstName: { contains: input.search, mode: "insensitive" } },
          { lastName: { contains: input.search, mode: "insensitive" } },
        ];
      }

      return ctx.prisma.newsletterSubscriber.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 100,
      });
    }),

  createSubscriber: permissionProcedure(PERMISSIONS.NEWSLETTER_MANAGE)
    .input(subscriberCreateSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.newsletterSubscriber.upsert({
        where: { email: input.email },
        create: {
          ...input,
          subscribedAt: input.status === "ACTIVE" ? new Date() : null,
        },
        update: {
          firstName: input.firstName,
          lastName: input.lastName,
          source: input.source,
          tags: input.tags,
          status: input.status,
          subscribedAt: input.status === "ACTIVE" ? new Date() : undefined,
        },
      });
    }),

  listSegments: permissionProcedure(PERMISSIONS.NEWSLETTER_MANAGE).query(async ({ ctx }) => {
    const dbSegments = await ctx.prisma.newsletterSegment.findMany({
      orderBy: [{ isSystem: "desc" }, { updatedAt: "desc" }],
    });

    return { dbSegments, defaultSegments };
  }),

  previewSegment: permissionProcedure(PERMISSIONS.NEWSLETTER_MANAGE)
    .input(segmentRulesSchema)
    .mutation(async ({ ctx, input }) => {
      return previewSegment(ctx.prisma, {
        rules: input.rules as SegmentRule[],
        rootOperator: input.rootOperator,
      });
    }),

  createSegment: permissionProcedure(PERMISSIONS.NEWSLETTER_MANAGE)
    .input(segmentCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const appUser = requireAppUser(ctx);
      const preview = await previewSegment(ctx.prisma, {
        rules: input.rules as SegmentRule[],
        rootOperator: input.rootOperator,
      });

      return ctx.prisma.newsletterSegment.create({
        data: {
          name: input.name,
          description: input.description,
          rules: input.rules as Prisma.InputJsonValue,
          rootOperator: input.rootOperator,
          isDynamic: input.isDynamic,
          recipientCount: preview.count,
          lastCalculatedAt: new Date(),
          createdById: appUser.id,
        },
      });
    }),
});
