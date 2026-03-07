import { type Page } from "@playwright/test";
import { ensureSeedDataOrSkip } from "../setup/seed-data";
import { loginAsPlayer } from "../setup/test-accounts";

/**
 * Protected-route smoke tests use a deterministic seeded player session
 * so they run in local environments without pre-saved auth state.
 */
export async function gotoProtectedOrSkip(page: Page, path: string) {
  await ensureSeedDataOrSkip();
  await loginAsPlayer(page, path);
}
