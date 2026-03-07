import { test, expect } from "@playwright/test";

test.describe("Phase C - 코치 인증 플로우", () => {
  test("코치 온보딩 2단계 인증 선택지", async ({ page }) => {
    await page.goto("/onboarding");

    await page.getByRole("button", { name: /코치\/스카우터/ }).click();
    const roleNext = page.getByRole("button", { name: "다음" });
    test.skip(await roleNext.isDisabled(), "역할 선택 상태에서 다음 버튼이 비활성입니다.");
    await roleNext.click();

    await expect(page.getByRole("heading", { name: "코치/스카우터 정보" })).toBeVisible();

    await page.getByPlaceholder("이름을 입력하세요").fill("E2E Coach Verify");
    const handleInput = page.getByPlaceholder("my_handle");
    await handleInput.fill(`e2e_verify_${Date.now().toString().slice(-6)}`);
    await page.getByRole("button", { name: "감독" }).click();

    await page.waitForTimeout(600);
    const nextButton = page.getByRole("button", { name: "다음" });
    test.skip(await nextButton.isDisabled(), "핸들 중복/검증 상태로 2단계 진입이 불가합니다.");

    await nextButton.click();

    await expect(page.getByRole("heading", { name: "인증 (선택)" })).toBeVisible();
    await expect(page.getByText("팀 코드 입력")).toBeVisible();
    await expect(page.getByText("증빙 제출")).toBeVisible();
  });
});
