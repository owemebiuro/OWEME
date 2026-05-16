"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ImpersonationBannerProps = {
  impersonatedName: string;
  impersonatedEmail: string;
};

export function ImpersonationBanner({
  impersonatedName,
  impersonatedEmail,
}: ImpersonationBannerProps) {
  const router = useRouter();
  const [stopping, setStopping] = useState(false);

  async function handleStop() {
    setStopping(true);
    try {
      await fetch("/api/admin/impersonate/stop", { method: "POST" });
      router.push("/crm/admin/users");
      router.refresh();
    } finally {
      setStopping(false);
    }
  }

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between gap-4 border-b border-[var(--ember-lo)] bg-[var(--ember)] px-4 py-2 text-sm font-semibold text-white">
      <span>
        Podszywasz się jako{" "}
        <span className="font-bold">{impersonatedName}</span>{" "}
        <span className="font-normal opacity-75">({impersonatedEmail})</span>
      </span>
      <button
        type="button"
        onClick={handleStop}
        disabled={stopping}
        className="rounded-md border border-[var(--ember-lo)] bg-white px-3 py-1 text-xs font-semibold text-[var(--ember-lo)] transition hover:bg-[var(--ember-bg)] disabled:opacity-60"
      >
        {stopping ? "Zatrzymuję..." : "Wróć do swojego konta"}
      </button>
    </div>
  );
}
