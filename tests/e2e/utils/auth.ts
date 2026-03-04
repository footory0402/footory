import { test, type Page } from "@playwright/test";

/**
 * Protected routes redirect to /login when there is no authenticated session.
 * Mark the test as skipped in that case so local runs remain deterministic.
 */
export async function gotoProtectedOrSkip(page: Page, path: string) {
  await page.goto(path);
  test.skip(
    page.url().includes("/login"),
    `Requires authenticated session for ${path}`
  );
}
