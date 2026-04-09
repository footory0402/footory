import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SettingsPageClient from "@/components/profile/SettingsPageClient";

export interface ContactSettings {
  email: string | null;
  show_email: boolean;
  show_phone: boolean;
}

export interface LinkedParent {
  linkId: string;
  parentId: string;
  name: string;
  handle: string;
  avatarUrl: string | null;
  linkedAt: string;
}

function getProviderLabel(appMetadata: Record<string, unknown> | undefined) {
  const providers = new Set<string>();
  if (typeof appMetadata?.provider === "string") {
    providers.add(appMetadata.provider);
  }
  if (Array.isArray(appMetadata?.providers)) {
    for (const value of appMetadata.providers) {
      if (typeof value === "string") {
        providers.add(value);
      }
    }
  }

  if (providers.has("email")) {
    return "이메일 로그인 계정";
  }

  if (providers.has("kakao")) {
    return "카카오 연동 이메일";
  }

  return "로그인 이메일";
}

async function fetchLinkedParents(userId: string): Promise<LinkedParent[]> {
  const supabase = await createClient();
  const { data: links, error } = await supabase
    .from("parent_links")
    .select("id, parent_id, created_at, profiles!parent_links_parent_id_fkey(id, handle, name, avatar_url)")
    .eq("child_id", userId);

  if (error || !links) {
    return [];
  }

  return links.map((link) => {
    const parent = link.profiles as unknown as {
      id: string;
      handle: string;
      name: string;
      avatar_url: string | null;
    };

    return {
      linkId: link.id,
      parentId: parent.id,
      handle: parent.handle,
      name: parent.name,
      avatarUrl: parent.avatar_url,
      linkedAt: link.created_at,
    };
  });
}

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, public_email, show_email, show_phone")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? null;
  const settings: ContactSettings = {
    email: user.email ?? profile?.public_email ?? null,
    show_email: profile?.show_email ?? false,
    show_phone: profile?.show_phone ?? false,
  };
  const linkedParents = role === "player" ? await fetchLinkedParents(user.id) : [];

  return (
    <SettingsPageClient
      userId={user.id}
      initialSettings={settings}
      initialRole={role}
      providerLabel={getProviderLabel(user.app_metadata)}
      initialLinkedParents={linkedParents}
    />
  );
}
