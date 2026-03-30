"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ProfileSkeleton from "@/components/player/ProfileSkeleton";

export default function ProfilePage() {
  const router = useRouter();

  useEffect(() => {
    async function redirectToPublicProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("handle")
        .eq("id", user.id)
        .single();
      if (data?.handle) {
        router.replace(`/p/${data.handle}`);
      } else {
        router.replace("/onboarding");
      }
    }
    redirectToPublicProfile();
  }, [router]);

  return <ProfileSkeleton />;
}
