import { expect, test } from "@playwright/test";
import { loginAsPlayer } from "../setup/test-accounts";

test.describe("프로필 카드 에디터", () => {
  test("비로그인 사용자도 에디터 첫 화면은 볼 수 있다", async ({ page }) => {
    await page.goto("/editor");
    await expect(page).toHaveURL(/\/editor/);
    await expect(page.getByRole("button", { name: "카드 저장하기" })).toBeVisible();
  });

  test("로그인 상태에서 에디터를 열고 저장 버튼을 볼 수 있다", async ({ page }) => {
    await loginAsPlayer(page, "/editor");
    await expect(page.getByRole("button", { name: "미리보기" })).toBeVisible();
    await expect(page.getByRole("button", { name: "카드 저장하기" })).toBeVisible();
  });
});
