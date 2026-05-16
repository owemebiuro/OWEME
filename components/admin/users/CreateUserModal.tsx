"use client";

import type { UserRole } from "@prisma/client";
import { FormEvent, useState } from "react";

import { roleLabels } from "@/components/admin/users/RoleBadge";

type CreateUserModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: {
    email: string;
    name: string;
    role: UserRole;
  }) => Promise<void>;
  isSubmitting: boolean;
  error: string | null;
  isSuperAdmin?: boolean;
};

const baseRoles = [
  "ADMIN",
  "OPERATOR",
  "LAWYER",
  "MARKETING",
  "READ_ONLY",
] as const satisfies readonly UserRole[];

const superAdminRoles = [
  "SUPER_ADMIN",
  ...baseRoles,
] as const satisfies readonly UserRole[];

export function CreateUserModal({
  open,
  onClose,
  onSubmit,
  isSubmitting,
  error,
  isSuperAdmin = false,
}: CreateUserModalProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole>("OPERATOR");

  if (!open) {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit({ email, name, role });
    setEmail("");
    setName("");
    setRole("OPERATOR");
  }

  return (
    <div className="crm-modal-backdrop fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 py-12 sm:items-center">
      <div className="crm-modal-surface w-full max-w-lg overflow-hidden">
        <div className="border-b border-white/50 px-5 py-4">
          <h2 className="text-lg font-semibold text-neutral-950">
            Dodaj użytkownika
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Konto logowania zostanie zaproszone przez Supabase Auth.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Imię i nazwisko
            </span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-1 h-11 w-full rounded-md border border-neutral-200 px-3 text-sm outline-none focus:border-neutral-950"
              required
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Email
            </span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 h-11 w-full rounded-md border border-neutral-200 px-3 text-sm outline-none focus:border-neutral-950"
              required
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Rola
            </span>
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as UserRole)}
              className="mt-1 h-11 w-full rounded-md border border-neutral-200 px-3 text-sm outline-none focus:border-neutral-950"
            >
              {(isSuperAdmin ? superAdminRoles : baseRoles).map((userRole) => (
                <option key={userRole} value={userRole}>
                  {roleLabels[userRole]}
                </option>
              ))}
            </select>
          </label>

          {error ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-md border border-neutral-200 px-4 text-sm font-semibold text-neutral-700 transition hover:border-neutral-400"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-10 rounded-md bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-60"
            >
              {isSubmitting ? "Dodaję..." : "Dodaj użytkownika"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
