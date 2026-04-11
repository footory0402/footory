import { createClient } from "@/lib/supabase/client";

const POST_LOGOUT_REAUTH_KEY = "footory-post-logout-reauth";

function getAuthRedirectUrl(path = "/auth/callback") {
  return `${window.location.origin}${path}`;
}

function getBrowserStorage() {
  if (typeof window === "undefined") return null;
  return {
    local: window.localStorage,
    session: window.sessionStorage,
  };
}

export function markPostLogoutReauth() {
  const storage = getBrowserStorage();
  if (!storage) return;
  storage.session.setItem(POST_LOGOUT_REAUTH_KEY, "1");
}

export function consumePostLogoutReauth() {
  const storage = getBrowserStorage();
  if (!storage) return false;
  const shouldReauth = storage.session.getItem(POST_LOGOUT_REAUTH_KEY) === "1";
  storage.session.removeItem(POST_LOGOUT_REAUTH_KEY);
  return shouldReauth;
}

export function clearAuthBrowserState() {
  const storage = getBrowserStorage();
  if (!storage) return;

  const preservedLogoutFlag = storage.session.getItem(POST_LOGOUT_REAUTH_KEY);

  Object.keys(storage.local).forEach((key) => {
    if (key.startsWith("sb-")) storage.local.removeItem(key);
  });
  Object.keys(storage.session).forEach((key) => {
    if (key.startsWith("sb-")) storage.session.removeItem(key);
  });

  if (preservedLogoutFlag) {
    storage.session.setItem(POST_LOGOUT_REAUTH_KEY, preservedLogoutFlag);
  }
}

export async function signInWithKakao(next?: string) {
  const supabase = createClient();
  const redirectTo = next
    ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
    : getAuthRedirectUrl();
  const queryParams = consumePostLogoutReauth() ? { prompt: "login" } : undefined;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "kakao",
    options: { redirectTo, queryParams },
  });
  if (error) throw error;
}

export async function signUpWithEmail(email: string, password: string, next?: string) {
  const supabase = createClient();
  const emailRedirectTo = next
    ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
    : getAuthRedirectUrl();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo },
  });
  if (error) throw error;
  return data;
}

export async function resendSignupConfirmation(email: string, next?: string) {
  const supabase = createClient();
  const emailRedirectTo = next
    ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
    : getAuthRedirectUrl();
  const { data, error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo },
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
  markPostLogoutReauth();
  // signOut can fail if refresh token is already invalid — ignore the error
  await supabase.auth.signOut().catch(() => {});
  clearAuthBrowserState();
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
