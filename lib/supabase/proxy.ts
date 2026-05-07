import { createServerClient } from "@supabase/ssr";
import { UserRole } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";

import { resolveBootstrapAdminUser } from "@/lib/auth-bootstrap";
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

function createLoginRedirect(request: NextRequest, reason?: string) {
  const redirectUrl = request.nextUrl.clone();
  const nextPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;

  redirectUrl.pathname = "/login";
  redirectUrl.search = "";
  redirectUrl.searchParams.set("next", nextPath);

  if (reason) {
    redirectUrl.searchParams.set("reason", reason);
  }

  return NextResponse.redirect(redirectUrl);
}

function createForbiddenRedirect(request: NextRequest) {
  return NextResponse.redirect(new URL("/crm", request.url));
}

async function getAppAccess(authUserId: string, email: string | undefined) {
  if (!hasPrismaDatabaseUrl()) {
    return {
      checked: false,
      role: null,
      inactive: false,
    } as const;
  }

  let appUser = await prisma.user.findFirst({
    where: {
      OR: [
        { authUserId },
        ...(email ? [{ email: email.toLowerCase() }] : []),
      ],
    },
    select: {
      id: true,
      authUserId: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
    },
  });

  appUser = await resolveBootstrapAdminUser(
    {
      id: authUserId,
      email,
      user_metadata: {},
    },
    appUser,
  );

  return {
    checked: true,
    role: appUser?.isActive ? appUser.role : null,
    inactive: appUser ? !appUser.isActive : false,
  } as const;
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

  const protectedPath = isProtectedPath(request.nextUrl.pathname);

  if (protectedPath && (error || !claims?.sub)) {
    return createLoginRedirect(request);
  }

  if (protectedPath && claims?.sub) {
    const access = await getAppAccess(claims.sub, claims.email);

    if (access.checked && !access.role) {
      return createLoginRedirect(
        request,
        access.inactive ? "inactive-user" : "app-user-required",
      );
    }

    if (isAdminPath(request.nextUrl.pathname) && access.role !== UserRole.ADMIN) {
      return createForbiddenRedirect(request);
    }
  }

  return response;
}
