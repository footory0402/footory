import { test, expect } from "@playwright/test";

test.describe("Phase A - 온보딩", () => {
  test("역할 선택 카드 3종과 다음 버튼 상태", async ({ page }) => {
    await page.goto("/onboarding");

    await expect(page.getByText("어떤 역할로 사용하시나요?")).toBeVisible();
    await expect(page.getByRole("button", { name: /선수/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /부모\/보호자/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /코치\/스카우터/ })).toBeVisible();

    const nextButton = page.getByRole("button", { name: "다음" });
    await expect(nextButton).toBeDisabled();

    await page.getByRole("button", { name: /선수/ }).click();
    await expect(nextButton).toBeEnabled();
  });

  test("선수 온보딩 진입", async ({ page }) => {
    await page.goto("/onboarding");
    await page.getByRole("button", { name: /선수/ }).click();
    await page.getByRole("button", { name: "다음" }).click();

    await expect(page.getByRole("heading", { name: "기본 정보" })).toBeVisible();
    await expect(page.getByText("선수 프로필을 만들어볼게요")).toBeVisible();
  });

  test("부모/코치 온보딩 진입", async ({ page }) => {
    await page.goto("/onboarding");
    await page.getByRole("button", { name: /부모\/보호자/ }).click();
    await page.getByRole("button", { name: "다음" }).click();
    await expect(page.getByRole("heading", { name: "보호자 정보" })).toBeVisible();

    await page.goto("/onboarding");
    await page.getByRole("button", { name: /코치\/스카우터/ }).click();
    await page.getByRole("button", { name: "다음" }).click();
    await expect(page.getByRole("heading", { name: "코치/스카우터 정보" })).toBeVisible();
  });
});
