import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// next 파라미터 유효성 검사 — 오픈 리다이렉트 방지
function safeNext(value: string | null): string {
  if (!value) return "/";
  // 상대 경로만 허용 (절대 URL 차단)
  if (!value.startsWith("/") || value.includes("://")) return "/";
  return value;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && session?.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", session.user.id)
        .maybeSingle();

      if (!profile) {
        const onboardingUrl = next !== "/"
          ? `${origin}/onboarding?next=${encodeURIComponent(next)}`
          : `${origin}/onboarding`;
        return NextResponse.redirect(onboardingUrl);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Handle token_hash for email confirmation / recovery
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as "signup" | "recovery" | "email",
    });

    if (!error) {
      if (type === "recovery") {
        return NextResponse.redirect(`${origin}/auth/reset-password`);
      }
      const onboardingUrl = next !== "/"
        ? `${origin}/onboarding?next=${encodeURIComponent(next)}`
        : `${origin}/onboarding`;
      return NextResponse.redirect(onboardingUrl);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
