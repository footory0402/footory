import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isPocAdminUser } from "@/lib/poc-admin";
import VideoLabClient from "@/components/admin/VideoLabClient";

export const dynamic = "force-dynamic";

export default async function VideoLabPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (!isPocAdminUser(user)) {
    redirect("/");
  }

  return <VideoLabClient adminEmail={user.email ?? "admin"} />;
}
