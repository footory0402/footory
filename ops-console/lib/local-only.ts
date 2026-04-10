import type { NextRequest } from "next/server";

function stripPort(hostname: string): string {
  if (hostname.startsWith("[")) {
    const closingIndex = hostname.indexOf("]");
    return closingIndex >= 0 ? hostname.slice(1, closingIndex) : hostname;
  }

  return hostname.split(":")[0];
}

export function normalizeHostname(rawHost: string | null | undefined): string | null {
  if (!rawHost) return null;

  const firstHost = rawHost.split(",")[0]?.trim();
  if (!firstHost) return null;

  return stripPort(firstHost).toLowerCase();
}

export function isLocalHostname(rawHost: string | null | undefined): boolean {
  const hostname = normalizeHostname(rawHost);
  if (!hostname) return false;

  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "0.0.0.0"
  );
}

export function isLocalRequest(request: NextRequest): boolean {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  return isLocalHostname(host);
}
