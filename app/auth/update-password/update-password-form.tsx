"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

type RecoveryState = "checking" | "ready" | "success" | "error";

function getHashParams() {
  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;

  return new URLSearchParams(hash);
}

function getTokenError() {
  const hashParams = getHashParams();
  const searchParams = new URLSearchParams(window.location.search);

  return (
    hashParams.get("error_description") ??
    searchParams.get("error_description") ??
    hashParams.get("error") ??
    searchParams.get("error")
  );
}

function cleanUrl() {
  window.history.replaceState(null, "", window.location.pathname);
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Nie udalo sie potwierdzic linku resetowania hasla.";
}

export function UpdatePasswordForm() {
  const router = useRouter();
  const [status, setStatus] = useState<RecoveryState>("checking");
  const [message, setMessage] = useState(
    "Sprawdzamy link resetowania hasla...",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function establishRecoverySession() {
      try {
        const tokenError = getTokenError();

        if (tokenError) {
          throw new Error(tokenError.replace(/\+/g, " "));
        }

        const supabase = createClient();
        const hashParams = getHashParams();
        const searchParams = new URLSearchParams(window.location.search);
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const code = searchParams.get("code");

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            throw error;
          }

          cleanUrl();
        } else if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            throw error;
          }

          cleanUrl();
        }

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (!session) {
          throw new Error(
            "Ten link resetowania hasla wygasl albo zostal juz wykorzystany. Popros administratora o wyslanie nowego linku.",
          );
        }

        if (!isMounted) {
          return;
        }

        setStatus("ready");
        setMessage("Wpisz nowe haslo dla swojego konta OWEME.");
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setStatus("error");
        setMessage(getErrorMessage(error));
      }
    }

    establishRecoverySession();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (password.length < 8) {
      setMessage("Haslo musi miec co najmniej 8 znakow.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Hasla nie sa identyczne.");
      return;
    }

    setIsSubmitting(true);
    setMessage("Zapisujemy nowe haslo...");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        throw error;
      }

      setStatus("success");
      setMessage("Haslo zostalo zmienione. Przenosimy Cie do CRM...");

      window.setTimeout(() => {
        router.replace("/crm");
        router.refresh();
      }, 900);
    } catch (error) {
      setStatus("ready");
      setMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (status === "checking") {
    return (
      <div className="mt-8 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
        {message}
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="mt-8 space-y-4">
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {message}
        </div>
        <a
          href="/login"
          className="flex h-12 w-full items-center justify-center rounded-lg bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800"
        >
          Wroc do logowania
        </a>
      </div>
    );
  }

  return (
    <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-neutral-700"
        >
          Nowe haslo
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          disabled={status === "success" || isSubmitting}
          className="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-base text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-neutral-950 focus:ring-4 focus:ring-neutral-950/10 disabled:bg-neutral-100"
          placeholder="Co najmniej 8 znakow"
        />
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-neutral-700"
        >
          Powtorz nowe haslo
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          disabled={status === "success" || isSubmitting}
          className="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-base text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-neutral-950 focus:ring-4 focus:ring-neutral-950/10 disabled:bg-neutral-100"
          placeholder="Powtorz haslo"
        />
      </div>

      {message ? (
        <p
          className={
            status === "success"
              ? "rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
              : "rounded-lg border border-[rgba(27,111,212,0.22)] bg-[var(--ember-bg)] px-4 py-3 text-sm text-[var(--ember-lo)]"
          }
        >
          {message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === "success" || isSubmitting}
        className="flex h-12 w-full items-center justify-center rounded-lg bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-400"
      >
        {isSubmitting ? "Zapisywanie..." : "Ustaw nowe haslo"}
      </button>
    </form>
  );
}
