import type { Metadata } from "next";

import { BlogEditorForm } from "@/components/blog/editor/BlogEditorForm";
import { requireRole } from "@/lib/auth-helpers";

export const metadata: Metadata = {
  title: "Edytor artykułu | OWEME CRM",
};

export default async function AdminBlogEditorPage() {
  const currentUser = await requireRole(["ADMIN", "EDITOR"]);

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-6 text-neutral-950 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <BlogEditorForm currentUserName={currentUser.appUser.name} />
      </div>
    </main>
  );
}
