import type { ReactNode } from "react";

import { SearchCommand } from "@/components/search/SearchCommand";

export default function CrmLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <SearchCommand />
    </>
  );
}
