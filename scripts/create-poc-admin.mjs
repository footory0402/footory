import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.POC_ADMIN_EMAIL;
const password = process.env.POC_ADMIN_PASSWORD;
const handle = process.env.POC_ADMIN_HANDLE ?? "poc_admin";
const name = process.env.POC_ADMIN_NAME ?? "POC Admin";

if (!supabaseUrl || !anonKey || !serviceRoleKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY are required."
  );
}

if (!email || !password) {
  throw new Error("POC_ADMIN_EMAIL and POC_ADMIN_PASSWORD are required.");
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const anon = createClient(supabaseUrl, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

let userId = null;

const createResult = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { name, handle },
});

if (createResult.error) {
  if (!/already|registered|exists|duplicate/i.test(createResult.error.message)) {
    throw createResult.error;
  }

  const signIn = await anon.auth.signInWithPassword({ email, password });
  if (signIn.error || !signIn.data.user?.id) {
    throw new Error(
      `Admin user already exists but could not sign in with the configured password: ${signIn.error?.message ?? "unknown error"}`
    );
  }

  userId = signIn.data.user.id;
} else {
  if (!createResult.data.user?.id) throw new Error("Supabase did not return a user id.");
  userId = createResult.data.user.id;
}

const { data: existingProfile, error: profileReadError } = await admin
  .from("profiles")
  .select("id, handle")
  .eq("id", userId)
  .maybeSingle();

if (profileReadError) throw profileReadError;

if (!existingProfile) {
  const { error: insertError } = await admin.from("profiles").insert({
    id: userId,
    role: "scout",
    handle,
    name,
    level: 1,
    xp: 0,
    followers_count: 0,
    following_count: 0,
    views_count: 0,
    mvp_count: 0,
    is_verified: true,
  });

  if (insertError) throw insertError;
}

console.log(JSON.stringify({ email, userId, handle }, null, 2));
