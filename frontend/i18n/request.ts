import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { headers } from "next/headers";
import { routing } from "./routing";

function detectLocaleFromPathname(pathname: string): string | undefined {
  for (const locale of routing.locales) {
    if (pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`) {
      return locale;
    }
  }
  return undefined;
}

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !hasLocale(routing.locales, locale)) {
    const h = await headers();
    // next-intl middleware sets this header; Next.js may prefix it when forwarding
    const intlLocale =
      h.get("x-next-intl-locale") ||
      h.get("x-middleware-request-x-next-intl-locale");
    if (intlLocale && hasLocale(routing.locales, intlLocale)) {
      locale = intlLocale;
    } else {
      // Fallback: try to detect from path headers
      const pathname =
        h.get("x-invoke-path") ||
        h.get("x-nextjs-page") ||
        h.get("x-matched-path") ||
        "/";
      locale = detectLocaleFromPathname(pathname) || routing.defaultLocale;
    }
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
