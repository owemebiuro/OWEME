"use client";

import type { UserRole } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { CreateUserModal } from "@/components/admin/users/CreateUserModal";
import { RoleBadge, roleLabels } from "@/components/admin/users/RoleBadge";
import { api } from "@/lib/trpc/hooks";

type UsersTableProps = {
  currentUserId: string;
  currentUserRole: UserRole;
  supabaseAdminStatus: {
    configured: boolean;
    missingEnv: string[];
    invalidEnv: string[];
  };
};

const allRoles = [
  "SUPER_ADMIN",
  "ADMIN",
  "EDITOR",
  "OPERATOR",
  "LAWYER",
  "MARKETING",
  "READ_ONLY",
] as const satisfies readonly UserRole[];

const dateTimeFormatter = new Intl.DateTimeFormat("pl-PL", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatDateTime(value: string | Date | null) {
  if (!value) return "Nigdy";
  return dateTimeFormatter.format(new Date(value));
}

export function UsersTable({
  currentUserId,
  currentUserRole,
  supabaseAdminStatus,
}: UsersTableProps) {
  const router = useRouter();
  const utils = api.useUtils();
  const users = api.users.list.useQuery();
  const createUser = api.users.create.useMutation({
    onSuccess: async () => {
      await utils.users.list.invalidate();
      setCreateModalOpen(false);
      setCreateError(null);
    },
    onError: (error) => setCreateError(error.message),
  });
  const updateRole = api.users.updateRole.useMutation({
    onSuccess: () => utils.users.list.invalidate(),
  });
  const toggleActive = api.users.toggleActive.useMutation({
    onSuccess: () => utils.users.list.invalidate(),
  });
  const resetPassword = api.users.resetPassword.useMutation();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<UserRole | null>(null);
  const [search, setSearch] = useState("");
  const [impersonating, setImpersonating] = useState<string | null>(null);

  const isSuperAdmin = currentUserRole === "SUPER_ADMIN";

  const visibleRoles = isSuperAdmin ? allRoles : allRoles.filter((r) => r !== "SUPER_ADMIN");

  async function handleResetPassword(userId: string) {
    setMessage(null);
    const result = await resetPassword.mutateAsync({ userId });
    setMessage(
      result.ok
        ? "Email resetujący został wysłany."
        : "Reset został uruchomiony, ale email nie został wysłany. Sprawdź konfigurację Resend.",
    );
  }

  async function handleImpersonate(userId: string) {
    setImpersonating(userId);
    try {
      const res = await fetch("/api/admin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        router.push("/crm");
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setMessage(`Błąd podszywania: ${data.error ?? res.statusText}`);
      }
    } finally {
      setImpersonating(null);
    }
  }

  const filteredUsers = users.data?.filter((user) => {
    if (roleFilter && user.role !== roleFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return user.name.toLowerCase().includes(q) || user.email.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-neutral-500">OWEME CRM</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950">
            Użytkownicy
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
            Zarządzanie użytkownikami aplikacyjnymi i rolami OWEME CRM.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreateModalOpen(true)}
          disabled={!supabaseAdminStatus.configured}
          title={
            supabaseAdminStatus.configured
              ? undefined
              : "Sprawdź SUPABASE_SERVICE_ROLE_KEY, aby zapraszać użytkowników."
          }
          className="h-11 rounded-md bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Dodaj użytkownika
        </button>
      </header>

      {!supabaseAdminStatus.configured ? (
        <div className="rounded-lg border border-[rgba(27,111,212,0.22)] bg-[var(--ember-bg)] px-4 py-3 text-sm text-[var(--ember-lo)]">
          <p className="font-semibold">Supabase Admin nie jest skonfigurowany</p>
          {supabaseAdminStatus.missingEnv.length ? (
            <p className="mt-1">
              Tworzenie kont i resetowanie haseł wymaga zmiennej:{" "}
              {supabaseAdminStatus.missingEnv.join(", ")}. Dodaj ją w `.env.local`
              oraz w Vercel, a potem uruchom aplikację ponownie.
            </p>
          ) : null}
          {supabaseAdminStatus.invalidEnv.length ? (
            <p className="mt-1">
              Zmienna {supabaseAdminStatus.invalidEnv.join(", ")} ma nieprawidłowy format.
              Użyj klucza `sb_secret_...` albo pełnego `service_role` JWT z trzema segmentami.
            </p>
          ) : null}
        </div>
      ) : null}

      {message ? (
        <p className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">
          {message}
        </p>
      ) : null}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          placeholder="Szukaj po nazwie lub emailu..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 w-full rounded-md border border-neutral-200 px-3 text-sm outline-none focus:border-neutral-950 sm:max-w-xs"
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setRoleFilter(null)}
            className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition ${
              roleFilter === null
                ? "border-neutral-950 bg-neutral-950 text-white"
                : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400"
            }`}
          >
            Wszystkie
          </button>
          {visibleRoles.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setRoleFilter(roleFilter === role ? null : role)}
              className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition ${
                roleFilter === role
                  ? "border-neutral-950 bg-neutral-950 text-white"
                  : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400"
              }`}
            >
              {roleLabels[role]}
            </button>
          ))}
        </div>
      </div>

      <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-255 border-collapse text-left">
            <thead className="bg-neutral-50 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3">Użytkownik</th>
                <th className="px-4 py-3">Rola</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Sprawy</th>
                <th className="px-4 py-3">Ostatnie logowanie</th>
                <th className="px-4 py-3">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-sm">
              {users.isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-neutral-500">
                    Ładuję użytkowników...
                  </td>
                </tr>
              ) : users.error ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center font-semibold text-red-700">
                    {users.error.message}
                  </td>
                </tr>
              ) : filteredUsers?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-neutral-400">
                    Brak użytkowników spełniających kryteria filtrowania.
                  </td>
                </tr>
              ) : (
                filteredUsers?.map((user) => {
                  const isSelf = user.id === currentUserId;
                  const isTargetSuperAdmin = user.role === "SUPER_ADMIN";
                  const canModify = !isSelf && (!isTargetSuperAdmin || isSuperAdmin);

                  return (
                    <tr key={user.id} className="align-top transition hover:bg-neutral-50">
                      <td className="px-4 py-4">
                        <p className="font-semibold text-neutral-950">{user.name}</p>
                        <p className="mt-1 text-xs text-neutral-500">{user.email}</p>
                      </td>
                      <td className="px-4 py-4">
                        <RoleBadge role={user.role} />
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`rounded-md border px-2 py-1 text-xs font-semibold ${
                            user.isActive
                              ? "border-green-200 bg-green-50 text-green-700"
                              : "border-neutral-200 bg-neutral-50 text-neutral-500"
                          }`}
                        >
                          {user.isActive ? "Aktywny" : "Nieaktywny"}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-semibold text-neutral-950">
                        {user._count.ownedClaims}
                      </td>
                      <td className="px-4 py-4 text-neutral-600">
                        {formatDateTime(user.lastLoginAt)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          {isSuperAdmin && !isSelf ? (
                            <button
                              type="button"
                              onClick={() => handleImpersonate(user.id)}
                              disabled={impersonating === user.id}
                              className="rounded-md border border-[rgba(27,111,212,0.28)] bg-[var(--ember-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--ember-lo)] transition hover:bg-[var(--ember-bg)] disabled:opacity-50"
                            >
                              {impersonating === user.id ? "Logowanie..." : "Zaloguj jako"}
                            </button>
                          ) : null}

                          {isSelf ? (
                            <span className="text-xs font-medium text-neutral-400">
                              Własne konto edytuj poza listą admina.
                            </span>
                          ) : canModify ? (
                            <details className="relative">
                              <summary className="w-fit cursor-pointer rounded-md border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 transition hover:border-neutral-400">
                                Akcje
                              </summary>
                              <div className="absolute right-0 z-20 mt-2 w-64 space-y-3 rounded-lg border border-neutral-200 bg-white p-3 shadow-lg">
                                <label className="block">
                                  <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                                    Zmień rolę
                                  </span>
                                  <select
                                    value={user.role}
                                    onChange={(event) =>
                                      updateRole.mutate({
                                        userId: user.id,
                                        role: event.target.value as UserRole,
                                      })
                                    }
                                    className="mt-1 h-10 w-full rounded-md border border-neutral-200 px-2 text-sm outline-none focus:border-neutral-950"
                                  >
                                    {visibleRoles.map((role) => (
                                      <option key={role} value={role}>
                                        {roleLabels[role]}
                                      </option>
                                    ))}
                                  </select>
                                </label>

                                <button
                                  type="button"
                                  onClick={() => toggleActive.mutate({ userId: user.id })}
                                  className="block w-full rounded-md border border-neutral-200 px-3 py-2 text-left text-sm font-semibold text-neutral-700 transition hover:border-neutral-400"
                                >
                                  {user.isActive ? "Dezaktywuj" : "Aktywuj"}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleResetPassword(user.id)}
                                  disabled={!supabaseAdminStatus.configured}
                                  className="block w-full rounded-md border border-neutral-200 px-3 py-2 text-left text-sm font-semibold text-neutral-700 transition hover:border-neutral-400 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  Resetuj hasło
                                </button>
                              </div>
                            </details>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <CreateUserModal
        open={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setCreateError(null);
        }}
        onSubmit={async (input) => {
          await createUser.mutateAsync(input);
        }}
        isSubmitting={createUser.isPending}
        error={createError}
        isSuperAdmin={isSuperAdmin}
      />
    </div>
  );
}
