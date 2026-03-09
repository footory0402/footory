import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const AUTH_ROUTES = ["/login", "/onboarding", "/signup"];
const PUBLIC_PREFIXES = ["/p/", "/t/", "/auth/", "/api/"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip auth check entirely for public routes
  const isPublic =
    AUTH_ROUTES.some((r) => pathname.startsWith(r)) ||
    PUBLIC_PREFIXES.some((r) => pathname.startsWith(r));

  if (isPublic) {
    return NextResponse.next({ request });
  }

  // Only create Supabase client for protected routes
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
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
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: claimsData,
    error: claimsError,
  } = await supabase.auth.getClaims();

  // Not logged in → redirect to login
  if (claimsError || !claimsData?.claims?.sub) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|webmanifest)$).*)",
  ],
};
