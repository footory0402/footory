import { test, expect } from "@playwright/test";
import { gotoProtectedOrSkip } from "../utils/auth";

test.describe("Phase A - 팀 최소 기능", () => {
  test.beforeEach(async ({ page }) => {
    await gotoProtectedOrSkip(page, "/team");
  });

  test("팀 페이지 기본 상태 렌더링", async ({ page }) => {
    const emptyState = page.getByText("아직 팀이 없어요");
    const listState = page.getByText("내 팀");

    const isEmpty = await emptyState.isVisible().catch(() => false);
    if (isEmpty) {
      await expect(page.getByRole("button", { name: "팀 만들기" })).toBeVisible();
      await expect(page.getByRole("button", { name: "초대코드 입력" })).toBeVisible();
      return;
    }

    await expect(listState).toBeVisible();
  });

  test("팀 만들기/가입 시트 열기", async ({ page }) => {
    const createButton = page
      .getByRole("button", { name: "팀 만들기" })
      .or(page.getByRole("button", { name: /\+ 만들기/ }));

    await createButton.first().click();
    const createHeading = page.getByRole("heading", { name: "팀 만들기" });
    await expect(createHeading).toBeVisible();

    await page.mouse.click(12, 12);
    await expect(createHeading).toBeHidden();

    const joinButton = page
      .getByRole("button", { name: "초대코드 입력" })
      .or(page.getByRole("button", { name: "가입" }));

    await joinButton.first().click();
    await expect(page.getByRole("heading", { name: "팀 가입하기" })).toBeVisible();
  });
});
