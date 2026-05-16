"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { createClient } from "@/lib/supabase/client";

type LoginFormProps = {
  redirectTo: string;
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.includes("Supabase")) {
    return "Brakuje konfiguracji Supabase. Sprawdź zmienne środowiskowe projektu.";
  }

  return "Nie udało się zalogować. Sprawdź email i hasło.";
}

export function LoginForm({ redirectTo }: LoginFormProps) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      setErrorMessage("Podaj email i hasło.");
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMessage(getErrorMessage(error));
        return;
      }

      router.replace(redirectTo);
      router.refresh();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-neutral-700"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="mt-2 w-full rounded-lg border border-[var(--line)] bg-white px-4 py-3 text-base text-[var(--ink)] outline-none transition placeholder:text-neutral-400 focus:border-[var(--ember)] focus:ring-4 focus:ring-[rgba(27,111,212,0.12)]"
          placeholder="adres@email.pl"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-neutral-700"
        >
          Hasło
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="mt-2 w-full rounded-lg border border-[var(--line)] bg-white px-4 py-3 text-base text-[var(--ink)] outline-none transition placeholder:text-neutral-400 focus:border-[var(--ember)] focus:ring-4 focus:ring-[rgba(27,111,212,0.12)]"
          placeholder="Wpisz hasło"
        />
      </div>

      {errorMessage ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isLoading}
        className="flex h-12 w-full items-center justify-center rounded-lg bg-[var(--ember)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--ember-hi)] disabled:cursor-not-allowed disabled:bg-neutral-400"
      >
        {isLoading ? "Logowanie..." : "Zaloguj się"}
      </button>
    </form>
  );
}
