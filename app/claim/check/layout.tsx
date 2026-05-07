import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "oweme. — Weryfikacja roszczenia",
  robots: { index: false },
};

export default function ClaimCheckLayout({ children }: { children: ReactNode }) {
  return children;
}
