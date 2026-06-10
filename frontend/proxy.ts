import createMiddleware from "next-intl/middleware";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

const PUBLIC_ROUTES = ["/", "/login", "/signup"];

function stripLocale(pathname: string): string {
  for (const locale of routing.locales) {
    if (pathname.startsWith(`/${locale}/`)) {
      return pathname.slice(`/${locale}`.length);
    }
    if (pathname === `/${locale}`) {
      return "/";
    }
  }
  return pathname;
}

function getLocale(pathname: string): string {
  for (const locale of routing.locales) {
    if (pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`) {
      return locale;
    }
  }
  return routing.defaultLocale;
}

export async function proxy(request: NextRequest) {
  // Run next-intl middleware first for locale routing
  const intlResponse = intlMiddleware(request);

  // If next-intl issued a redirect, return it immediately
  if (intlResponse.status >= 300 && intlResponse.status < 400) {
    return intlResponse;
  }

  // Auth logic — preserve intlResponse headers (contains locale info for next-intl)
  let supabaseResponse = NextResponse.next({
    request,
    headers: intlResponse.headers,
  });

  const supabase = createServerClient(
    process.env.SUPABASE_URL_INTERNAL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
            headers: intlResponse.headers,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const locale = getLocale(pathname);
  const pathWithoutLocale = stripLocale(pathname);
  const isPublic = PUBLIC_ROUTES.includes(pathWithoutLocale);

  if (!user && !isPublic) {
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
  }

  if (user && (pathWithoutLocale === "/login" || pathWithoutLocale === "/signup")) {
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
