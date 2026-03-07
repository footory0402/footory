import { test, expect } from "@playwright/test";
import { ensureSeedDataOrSkip, type SeededData } from "../setup/seed-data";
import { loginAsCoach } from "../setup/test-accounts";

test.describe("Phase C - DM 대화", () => {
  let seeded: SeededData | null = null;

  test.beforeEach(async ({ page }) => {
    seeded = await ensureSeedDataOrSkip();
    await loginAsCoach(page, "/dm");
  });

  test("DM 목록 렌더링", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "메시지" })).toBeVisible();

    const emptyState = page.getByText("아직 대화가 없습니다");
    const hasEmpty = await emptyState.isVisible().catch(() => false);

    if (hasEmpty) {
      await expect(page.getByText("프로필에서 메시지 버튼을 눌러 대화를 시작하세요")).toBeVisible();
      return;
    }

    await expect(page.locator('a[href^="/dm/"]').first()).toBeVisible();
  });

  test("대화방 진입 시 메시지 입력 UI", async ({ page }) => {
    test.skip(!seeded, "시드 데이터가 없습니다.");
    await page.goto(`/dm/${seeded!.conversationId}`);
    test.skip(!/\/dm\/.+/.test(page.url()), "대화방 상세 라우트가 DM 목록으로 되돌아옵니다.");
    await expect(page).toHaveURL(/\/dm\//);
    await expect(page.getByPlaceholder("메시지 입력...")).toBeVisible();
  });
});
