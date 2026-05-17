import type { Metadata } from "next";
import Link from "next/link";

import { DeleteBlogPostButton } from "@/components/blog/DeleteBlogPostButton";
import { requireRole } from "@/lib/auth-helpers";
import { createTRPCCaller } from "@/lib/trpc/server";

export const metadata: Metadata = {
  title: "Artykuły | OWEME CRM",
};

const STATUS_LABELS = {
  DRAFT: "Szkic",
  REVIEW: "Do weryfikacji",
  PUBLISHED: "Opublikowany",
} as const;

const STATUS_STYLES = {
  DRAFT: "bg-neutral-100 text-neutral-600",
  REVIEW: "bg-[var(--ember-bg)] text-[var(--ember-lo)]",
  PUBLISHED: "bg-green-50 text-green-700",
} as const;

type BlogListPost = {
  id: string;
  title: string;
  category: string;
  status: keyof typeof STATUS_LABELS;
  publishedAt: Date | null;
  updatedAt: Date;
};

export default async function AdminBlogPage() {
  await requireRole(["ADMIN", "EDITOR"]);

  const trpc = await createTRPCCaller();
  const posts = (await trpc.blog.list()) as BlogListPost[];

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-6 text-neutral-950 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-950">Artykuły</h1>
            <p className="mt-1 text-sm text-neutral-500">
              {posts.length} {posts.length === 1 ? "artykuł" : "artykułów"}
            </p>
          </div>
          <Link
            href="/crm/admin/blog/editor"
            className="inline-flex h-10 items-center rounded-md bg-[#0b4fb3] px-4 text-sm font-semibold !text-white shadow-sm transition hover:bg-[#093f8f]"
          >
            Nowy artykuł
          </Link>
        </div>

        <div className="mt-6 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
          {posts.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-neutral-500">Brak artykułów.</p>
              <Link
                href="/crm/admin/blog/editor"
                className="mt-3 inline-flex text-sm font-semibold text-[#0b4fb3] underline hover:text-[#093f8f]"
              >
                Utwórz pierwszy artykuł →
              </Link>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-neutral-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Tytuł
                  </th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500 sm:table-cell">
                    Kategoria
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Status
                  </th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500 md:table-cell">
                    Data
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-neutral-50">
                    <td className="max-w-xs truncate px-4 py-3 font-medium text-neutral-950">
                      {post.title || "(bez tytułu)"}
                    </td>
                    <td className="hidden px-4 py-3 text-neutral-600 sm:table-cell">
                      {post.category}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[post.status]}`}
                      >
                        {STATUS_LABELS[post.status]}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-neutral-500 md:table-cell">
                      {post.publishedAt
                        ? new Date(post.publishedAt).toLocaleDateString("pl-PL")
                        : new Date(post.updatedAt).toLocaleDateString("pl-PL")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-3">
                        <Link
                          href={`/crm/admin/blog/editor?id=${post.id}`}
                          className="text-xs font-semibold text-neutral-600 underline hover:text-neutral-950"
                        >
                          Edytuj
                        </Link>
                        <DeleteBlogPostButton id={post.id} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  );
}
