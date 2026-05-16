import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { forbidden } from "next/navigation";

import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import { canViewAnalytics } from "@/lib/analytics/access";
import { requireAuth } from "@/lib/auth-helpers";

export const metadata: Metadata = {
  title: "Analityka | OWEME CRM",
};

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

export default async function AnalyticsPage() {
  const currentUser = await requireAuth();

  if (!canViewAnalytics(currentUser.appUser)) {
    forbidden();
  }

  return (
    <main className={`${inter.variable} min-h-screen px-1 py-1 text-neutral-950 sm:px-2`}>
      <div className="mx-auto w-full max-w-7xl">
        <AnalyticsDashboard />
      </div>
    </main>
  );
}
