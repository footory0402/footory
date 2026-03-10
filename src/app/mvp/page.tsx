import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MvpPageSkeleton from "@/components/mvp/MvpPageSkeleton";
import MvpPageClient from "@/components/mvp/MvpPageClient";
import { fetchMvpCandidatesData } from "@/lib/server/mvp";
import type { UserRole } from "@/lib/permissions";

export default async function MvpPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <Suspense fallback={<MvpPageSkeleton />}>
      <MvpPageContent userId={user.id} />
    </Suspense>
  );
}

async function MvpPageContent({ userId }: { userId: string }) {
  const supabase = await createClient();
  const [{ data: profile }, initialData] = await Promise.all([
    supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle(),
    fetchMvpCandidatesData(supabase, userId),
  ]);

  const viewerRole = (profile?.role ?? "player") as UserRole;

  return <MvpPageClient initialData={initialData} viewerRole={viewerRole} />;
}
