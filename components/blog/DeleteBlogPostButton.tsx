"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { api } from "@/lib/trpc/hooks";

export function DeleteBlogPostButton({ id }: { id: string }) {
  const [confirming, setConfirming] = useState(false);
  const router = useRouter();
  const deleteMutation = api.blog.delete.useMutation({
    onSuccess: () => router.refresh(),
  });

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className="text-xs text-neutral-500">Usuń?</span>
        <button
          type="button"
          onClick={() => deleteMutation.mutate({ id })}
          disabled={deleteMutation.isPending}
          className="text-xs font-semibold text-red-600 hover:text-red-800 disabled:opacity-50"
        >
          Tak
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="text-xs text-neutral-500 hover:text-neutral-700"
        >
          Nie
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="text-xs font-semibold text-red-500 hover:text-red-700"
    >
      Usuń
    </button>
  );
}
