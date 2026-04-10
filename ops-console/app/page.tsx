import { headers } from "next/headers";
import { notFound } from "next/navigation";
import FootoryCompanyClient from "@/components/company/FootoryCompanyClient";
import { isLocalHostname } from "@/lib/local-only";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");

  if (!isLocalHostname(host)) {
    notFound();
  }

  return <FootoryCompanyClient />;
}
