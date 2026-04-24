import type { Metadata } from "next";

import {
  BlogEditorForm,
  type InitialPost,
} from "@/components/blog/editor/BlogEditorForm";
import { requireRole } from "@/lib/auth-helpers";
import { createTRPCCaller } from "@/lib/trpc/server";

export const metadata: Metadata = {
  title: "Edytor artykułu | OWEME CRM",
};

type EditorPageProps = {
  searchParams: Promise<{ id?: string }>;
};

export default async function AdminBlogEditorPage({ searchParams }: EditorPageProps) {
  const currentUser = await requireRole(["ADMIN", "EDITOR"]);
  const { id } = await searchParams;

  let initialPost: InitialPost | undefined;

  if (id) {
    try {
      const trpc = await createTRPCCaller();
      const post = await trpc.blog.getById({ id });
      initialPost = {
        id: post.id,
        slug: post.slug,
        title: post.title,
        content: post.content,
        excerpt: post.excerpt,
        category: post.category,
        tags: post.tags,
        authorName: post.authorName,
        authorRole: post.authorRole,
        authorBio: post.authorBio,
        imageAlt: post.imageAlt,
        focusKeyword: post.focusKeyword,
        metaTitle: post.metaTitle,
        metaDescription: post.metaDescription,
        ogTitle: post.ogTitle,
        ogDescription: post.ogDescription,
        canonicalUrl: post.canonicalUrl,
        noindex: post.noindex,
        status: post.status as "DRAFT" | "REVIEW" | "PUBLISHED",
        publishedAt:
          post.publishedAt instanceof Date
            ? post.publishedAt.toISOString()
            : (post.publishedAt ?? null),
      };
    } catch {
      // Post not found — fall through to blank editor
    }
  }

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-6 text-neutral-950 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <BlogEditorForm
          currentUserName={currentUser.appUser.name}
          initialPost={initialPost}
        />
      </div>
    </main>
  );
}
