import { BlogPostStatus } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { PERMISSIONS, permissionProcedure } from "@/lib/trpc/permissions";
import { publicProcedure, router } from "@/lib/trpc/trpc";
import { calcReadingTime, countWords } from "@/lib/blog/editor";

const blogPostStatusSchema = z.enum(BlogPostStatus);

const upsertInputSchema = z.object({
  id: z.string().optional(),
  slug: z.string().min(1).trim(),
  title: z.string().min(1).trim(),
  content: z.string().trim(),
  excerpt: z.string().trim().default(""),
  category: z.string().trim(),
  tags: z.string().trim().default(""),
  authorName: z.string().trim(),
  authorRole: z.string().trim().default("Redakcja OWEME"),
  authorBio: z.string().trim().default(""),
  imageAlt: z.string().trim().default(""),
  focusKeyword: z.string().trim().default(""),
  metaTitle: z.string().trim().default(""),
  metaDescription: z.string().trim().default(""),
  ogTitle: z.string().trim().default(""),
  ogDescription: z.string().trim().default(""),
  canonicalUrl: z.string().trim().default(""),
  noindex: z.boolean().default(false),
  status: blogPostStatusSchema.default("DRAFT"),
  publishedAt: z.coerce.date().nullable().optional(),
});

const blogSelect = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  category: true,
  tags: true,
  authorName: true,
  authorRole: true,
  authorBio: true,
  readTime: true,
  status: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

const blogDetailSelect = {
  ...blogSelect,
  content: true,
  imageAlt: true,
  focusKeyword: true,
  metaTitle: true,
  metaDescription: true,
  ogTitle: true,
  ogDescription: true,
  canonicalUrl: true,
  noindex: true,
  createdById: true,
} as const;

export const blogRouter = router({
  checkAccess: permissionProcedure(PERMISSIONS.BLOG_MANAGE).query(() => ({
    canManage: true,
  })),

  list: permissionProcedure(PERMISSIONS.BLOG_MANAGE).query(async ({ ctx }) => {
    return ctx.prisma.blogPost.findMany({
      select: blogSelect,
      orderBy: { updatedAt: "desc" },
    });
  }),

  getById: permissionProcedure(PERMISSIONS.BLOG_MANAGE)
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const post = await ctx.prisma.blogPost.findUnique({
        where: { id: input.id },
        select: blogDetailSelect,
      });

      if (!post) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Artykuł nie istnieje." });
      }

      return post;
    }),

  listPublished: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.blogPost.findMany({
      where: { status: BlogPostStatus.PUBLISHED },
      select: blogSelect,
      orderBy: { publishedAt: "desc" },
    });
  }),

  getPublishedBySlug: publicProcedure
    .input(z.object({ slug: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const post = await ctx.prisma.blogPost.findFirst({
        where: { slug: input.slug, status: BlogPostStatus.PUBLISHED },
        select: blogDetailSelect,
      });

      if (!post) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Artykuł nie istnieje lub nie jest opublikowany." });
      }

      return post;
    }),

  upsert: permissionProcedure(PERMISSIONS.BLOG_MANAGE)
    .input(upsertInputSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.appUser) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Brak użytkownika." });
      }

      const readTime = calcReadingTime(countWords(input.content));
      const publishedAt =
        input.status === BlogPostStatus.PUBLISHED
          ? (input.publishedAt ?? new Date())
          : input.status === BlogPostStatus.DRAFT
            ? null
            : input.publishedAt ?? null;

      const data = {
        slug: input.slug,
        title: input.title,
        content: input.content,
        excerpt: input.excerpt,
        category: input.category,
        tags: input.tags,
        authorName: input.authorName,
        authorRole: input.authorRole,
        authorBio: input.authorBio,
        imageAlt: input.imageAlt,
        focusKeyword: input.focusKeyword,
        metaTitle: input.metaTitle,
        metaDescription: input.metaDescription,
        ogTitle: input.ogTitle,
        ogDescription: input.ogDescription,
        canonicalUrl: input.canonicalUrl,
        noindex: input.noindex,
        status: input.status,
        readTime,
        publishedAt,
      };

      if (input.id) {
        const existing = await ctx.prisma.blogPost.findUnique({
          where: { id: input.id },
          select: { id: true },
        });

        if (!existing) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Artykuł nie istnieje." });
        }

        return ctx.prisma.blogPost.update({
          where: { id: input.id },
          data,
          select: blogDetailSelect,
        });
      }

      return ctx.prisma.blogPost.create({
        data: { ...data, createdById: ctx.appUser.id },
        select: blogDetailSelect,
      });
    }),

  delete: permissionProcedure(PERMISSIONS.BLOG_MANAGE)
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const post = await ctx.prisma.blogPost.findUnique({
        where: { id: input.id },
        select: { id: true },
      });

      if (!post) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Artykuł nie istnieje." });
      }

      await ctx.prisma.blogPost.delete({ where: { id: input.id } });
      return { ok: true };
    }),
});
