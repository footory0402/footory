import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database";

type AuthResult = {
  user: User;
  supabase: SupabaseClient<Database>;
};

/**
 * API 라우트용 인증 검증 유틸.
 * 인증 실패 시 401 NextResponse를 반환하고, 성공 시 user + supabase를 반환한다.
 *
 * @example
 * export async function GET() {
 *   const auth = await requireAuth();
 *   if (auth instanceof NextResponse) return auth;
 *   const { user, supabase } = auth;
 *   // ...
 * }
 */
export async function requireAuth(): Promise<AuthResult | NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return { user, supabase };
}
