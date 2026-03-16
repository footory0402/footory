import { createClient } from "@/lib/supabase/client";

function getAuthRedirectUrl(path = "/auth/callback") {
  return `${window.location.origin}${path}`;
}

export async function signInWithKakao() {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "kakao",
    options: {
      redirectTo: getAuthRedirectUrl(),
    },
  });
  if (error) throw error;
}

export async function signUpWithEmail(email: string, password: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: getAuthRedirectUrl(),
    },
  });
  if (error) throw error;
  return data;
}

export async function resendSignupConfirmation(email: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: getAuthRedirectUrl(),
    },
  });
  if (error) throw error;
  return data;
}

export async function signInWithEmail(email: string, password: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function resetPassword(email: string) {
  const supabase = createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getAuthRedirectUrl("/auth/reset-password"),
  });
  if (error) throw error;
}

export async function updatePassword(newPassword: string) {
  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

export async function signOut() {
  const supabase = createClient();
  // signOut can fail if refresh token is already invalid — ignore the error
  await supabase.auth.signOut().catch(() => {});
  // Replace history to prevent back-button returning to authenticated pages
  window.location.replace("/login");
}

/**
 * bfcache 무효화: 로그아웃 후 뒤로가기로 돌아오면 강제 새로고침
 * 앱 최상위 레이아웃에서 호출
 */
export function setupBfCacheGuard() {
  if (typeof window === "undefined") return;
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
      // bfcache에서 복원됨 → 세션 확인 후 리로드
      window.location.reload();
    }
  });
}
