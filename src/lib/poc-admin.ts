import "server-only";

interface AdminIdentity {
  id?: string | null;
  email?: string | null;
}

function parseEnvList(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function getPocAdminEmails(): string[] {
  return parseEnvList(process.env.POC_ADMIN_EMAILS).map((email) => email.toLowerCase());
}

export function getPocAdminUserIds(): string[] {
  return parseEnvList(process.env.POC_ADMIN_USER_IDS);
}

export function isPocAdminUser(identity: AdminIdentity | null | undefined): boolean {
  if (!identity) return false;

  const email = identity.email?.toLowerCase() ?? null;
  const userId = identity.id ?? null;

  if (email && getPocAdminEmails().includes(email)) return true;
  if (userId && getPocAdminUserIds().includes(userId)) return true;

  return false;
}
