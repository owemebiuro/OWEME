import type { Metadata } from "next";
import { Suspense } from "react";
import SiteNav from "@/components/SiteNav";
import FormClient from "./form-client";

export const metadata: Metadata = {
  title: "Złóż wniosek o odszkodowanie | OWEME",
  description:
    "Wypełnij krótki formularz online i złóż wniosek o odszkodowanie za opóźniony lot. Bezpłatnie, bez zobowiązań — pobieramy tylko 30% po wygranej.",
  robots: { index: false },
};

export default async function FormularzPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;

  return (
    <>
      <Suspense fallback={null}>
        <SiteNav />
      </Suspense>
      <FormClient
        flightId={params.flightId}
        flightNumber={params.flightNumber}
        flightDate={params.flightDate}
        initialPassengers={params.passengers ? Number(params.passengers) : 1}
      />
    </>
  );
}
