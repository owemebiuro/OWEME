import type { ReactNode } from "react";

import { ImpersonationBanner } from "@/components/admin/ImpersonationBanner";
import { CrmShell } from "@/components/crm/CrmShell";
import { SearchCommand } from "@/components/search/SearchCommand";
import { getCurrentUser } from "@/lib/auth-helpers";

export default async function CrmLayout({ children }: { children: ReactNode }) {
  const currentUser = await getCurrentUser();

  return (
    <>
      {currentUser?.realAppUser && currentUser.appUser ? (
        <ImpersonationBanner
          impersonatedName={currentUser.appUser.name}
          impersonatedEmail={currentUser.appUser.email}
        />
      ) : null}
      <CrmShell user={currentUser?.appUser ?? null}>
        {children}
        <SearchCommand />
      </CrmShell>
    </>
  );
}
