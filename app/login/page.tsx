import Link from "next/link";

import { LoginForm } from "./login-form";

type LoginPageProps = {
  searchParams: Promise<{
    next?: string | string[] | undefined;
  }>;
};

function getSafeRedirectPath(value: string | string[] | undefined) {
  const nextPath = Array.isArray(value) ? value[0] : value;

  if (
    !nextPath ||
    !nextPath.startsWith("/") ||
    nextPath.startsWith("//") ||
    nextPath.startsWith("/login")
  ) {
    return "/crm";
  }

  return nextPath;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const redirectTo = getSafeRedirectPath(params.next);

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-10 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl items-center justify-center">
        <div className="grid w-full gap-10 lg:grid-cols-[1fr_440px] lg:items-center">
          <section className="max-w-2xl">
            <Link
              href="/"
              className="inline-flex text-sm font-medium text-neutral-300 transition hover:text-white"
            >
              OWEME
            </Link>
            <h1 className="mt-8 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Zaloguj się do panelu OWEME.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-neutral-300">
              Jeden bezpieczny punkt wejścia do CRM i panelu administracyjnego.
              Role, zaproszenia i pełny layout dodamy w kolejnym etapie.
            </p>
          </section>

          <section className="rounded-lg border border-white/10 bg-white p-6 text-neutral-950 shadow-2xl shadow-black/30 sm:p-8">
            <div>
              <p className="text-sm font-medium text-neutral-500">Logowanie</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Wejdź do aplikacji
              </h2>
            </div>

            <LoginForm redirectTo={redirectTo} />
          </section>
        </div>
      </div>
    </main>
  );
}
