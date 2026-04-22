import type { Metadata } from "next";
import { Suspense } from "react";
import SiteNav from "@/components/SiteNav";
import CheckerClient from "./checker-client";

export const metadata: Metadata = {
  title: "Sprawdź swoje odszkodowanie | OWEME",
  description:
    "Wpisz numer lotu i datę — sprawdzimy w kilka sekund czy przysługuje Ci odszkodowanie do 600 EUR. Bezpłatnie, bez zobowiązań.",
  openGraph: {
    title: "Sprawdź swoje odszkodowanie za lot | OWEME",
    description: "Szybka kwalifikacja roszczenia. Do 600 EUR na osobę. Zero opłat z góry.",
    type: "website",
  },
};

export default function SprawdzPage() {
  return (
    <>
      <Suspense fallback={null}>
        <SiteNav />
      </Suspense>
      <CheckerClient />
    </>
  );
}
