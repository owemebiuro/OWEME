import { createServerClient } from "@supabase/ssr";
import { UserRole } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";

import { getSupabaseEnv } from "@/lib/supabase/env";
import { hasPrismaDatabaseUrl, prisma } from "@/lib/prisma";
import type { Database } from "@/types/supabase";

const PROTECTED_PATHS = ["/crm", "/admin"] as const;
const ADMIN_PATHS = ["/admin", "/crm/admin"] as const;

function isProtectedPath(pathname: string) {
  return PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

function isAdminPath(pathname: string) {
  return ADMIN_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

function createLoginRedirect(request: NextRequest) {
  const redirectUrl = request.nextUrl.clone();
  const nextPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;

  redirectUrl.pathname = "/login";
  redirectUrl.search = "";
  redirectUrl.searchParams.set("next", nextPath);

  return NextResponse.redirect(redirectUrl);
}

function createForbiddenRedirect(request: NextRequest) {
  return NextResponse.redirect(new URL("/crm", request.url));
}

async function getAppRole(authUserId: string, email: string | undefined) {
  if (!hasPrismaDatabaseUrl()) {
    return null;
  }

  const appUser = await prisma.user.findFirst({
    where: {
      isActive: true,
      OR: [
        { authUserId },
        ...(email ? [{ email: email.toLowerCase() }] : []),
      ],
    },
    select: {
      role: true,
    },
  });

  return appUser?.role ?? null;
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });
  const { url, publishableKey } = getSupabaseEnv();

  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({
          request,
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });

        Object.entries(headers).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      },
    },
  });

  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims as
    | {
        sub?: string;
        email?: string;
      }
    | undefined;

  if (isProtectedPath(request.nextUrl.pathname) && (error || !claims?.sub)) {
    return createLoginRedirect(request);
  }

  if (isAdminPath(request.nextUrl.pathname) && claims?.sub) {
    const role = await getAppRole(claims.sub, claims.email);

    if (role !== UserRole.ADMIN) {
      return createForbiddenRedirect(request);
    }
  }

  return response;
}
