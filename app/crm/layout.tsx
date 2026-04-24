import type { ReactNode } from "react";

import { CrmShell } from "@/components/crm/CrmShell";
import { SearchCommand } from "@/components/search/SearchCommand";
import { getCurrentUser } from "@/lib/auth-helpers";

export default async function CrmLayout({ children }: { children: ReactNode }) {
  const currentUser = await getCurrentUser();

  return (
    <CrmShell user={currentUser?.appUser ?? null}>
      {children}
      <SearchCommand />
    </CrmShell>
  );
}
