import type { UserRole } from "@prisma/client";

type RoleBadgeProps = {
  role: UserRole;
};

const roleClasses: Record<UserRole, string> = {
  SUPER_ADMIN: "border-[var(--ember)] bg-[var(--ember)] text-white",
  ADMIN: "border-neutral-900 bg-neutral-900 text-white",
  EDITOR: "border-emerald-200 bg-emerald-50 text-emerald-700",
  OPERATOR: "border-blue-200 bg-blue-50 text-blue-700",
  LAWYER: "border-purple-200 bg-purple-50 text-purple-700",
  MARKETING: "border-pink-200 bg-pink-50 text-pink-700",
  READ_ONLY: "border-neutral-200 bg-neutral-50 text-neutral-600",
};

const roleLabels: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  EDITOR: "Redaktor",
  OPERATOR: "Operator",
  LAWYER: "Prawnik",
  MARKETING: "Marketing",
  READ_ONLY: "Tylko odczyt",
};

export function RoleBadge({ role }: RoleBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-md border px-2 py-1 text-xs font-semibold ${roleClasses[role]}`}
    >
      {roleLabels[role]}
    </span>
  );
}

export { roleLabels };
