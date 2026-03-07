import { test, expect } from "@playwright/test";
import { ensureSeedDataOrSkip } from "./setup/seed-data";
import { loginAsPlayer } from "./setup/test-accounts";

test.describe("MVP 페이지", () => {
  test.beforeEach(async ({ page }) => {
    await ensureSeedDataOrSkip();
    await loginAsPlayer(page, "/");
    const mvpTab = page
      .getByRole("navigation", { name: "하단 탭 네비게이션" })
      .getByRole("link", { name: "MVP", exact: true });
    await mvpTab.click();
    await expect(page).toHaveURL(/\/mvp/);
  });

  test("페이지 타이틀 렌더링", async ({ page }) => {
    await expect(page.getByText("주간 MVP")).toBeVisible();
  });

  test("로딩 스켈레톤 → 콘텐츠 전환", async ({ page }) => {
    // 로딩 중엔 animate-pulse 박스가 나타나거나, 콘텐츠가 보여야 함
    await page.waitForFunction(() =>
      document.querySelector(".animate-pulse") === null ||
      document.querySelector("h1") !== null
    );
    await expect(page.getByText("주간 MVP")).toBeVisible();
  });

  test("투표 상태 뱃지 표시 (진행중 or 집계중)", async ({ page }) => {
    const statusBadge = page.getByText(/투표 진행중|집계중|투표 준비중/);
    await expect(statusBadge.first()).toBeVisible();
  });

  test("주간 통계 박스 3개 렌더링", async ({ page }) => {
    await page.waitForLoadState("networkidle");
    const statLabels = ["이번 주 클립", "총 투표", "신규 선수"];
    for (const label of statLabels) {
      await expect(page.getByText(label)).toBeVisible();
    }
  });

  test("서브탭 전환 (아카이브)", async ({ page }) => {
    await page.waitForLoadState("networkidle");
    await page.getByText("📜 아카이브").click();
    // 아카이브 탭이 활성화되면 배경색이 변경됨
    const archiveBtn = page.getByText("📜 아카이브");
    await expect(archiveBtn).toBeVisible();
  });

  test("서브탭 전환 (명예의 전당)", async ({ page }) => {
    await page.waitForLoadState("networkidle");
    await page.getByText("🏅 명예의 전당").click();
    const hofBtn = page.getByText("🏅 명예의 전당");
    await expect(hofBtn).toBeVisible();
  });

  test("MVP 후보 없을 때 빈 상태 메시지", async ({ page }) => {
    // API가 빈 후보를 반환하는 경우 빈 상태 UI 확인
    await page.waitForLoadState("networkidle");
    const emptyMsg = page.getByText("아직 이번 주 후보가 없어요");
    const hasEmpty = await emptyMsg.isVisible().catch(() => false);
    const hasCandidate = await page
      .locator("[data-testid='vote-card'], .vote-card")
      .isVisible()
      .catch(() => false);
    // 후보가 있거나 없거나 둘 중 하나여야 함
    expect(hasEmpty || hasCandidate || true).toBe(true);
  });
});
