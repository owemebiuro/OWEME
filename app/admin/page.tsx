import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth-helpers";

export default async function AdminPage() {
  await requireRole(["ADMIN"]);

  redirect("/crm/admin/users");
}
