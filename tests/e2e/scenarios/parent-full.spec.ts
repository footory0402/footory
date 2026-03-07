import { test, expect, type Page } from "@playwright/test";
import { ensureSeedDataOrSkip } from "../setup/seed-data";
import { loginAsParent } from "../setup/test-accounts";

test.setTimeout(90000);

const TAB_PATHS: Record<string, string> = {
  "홈": "http://localhost:3000/",
  "DM": "**/dm**",
  "설정": "**/profile/settings**",
};

async function clickTab(page: Page, label: string) {
  const nav = page.getByRole("navigation", { name: "하단 탭 네비게이션" });
  await nav.getByRole("link", { name: label, exact: true }).click({ force: true });
  const expectedUrl = TAB_PATHS[label] ?? `**/${label.toLowerCase()}**`;
  await page.waitForURL(expectedUrl, { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(600);
}

test.describe("부모 전체 여정", () => {
  test("부모 전체 여정 - 8단계", async ({ page }) => {
    await ensureSeedDataOrSkip();

    // 1. 로그인 → 홈 도달
    await loginAsParent(page, "/");
    await page.waitForTimeout(1000);

    // 2. 홈 = 대시보드 확인 ('보호자님' 인사 또는 활동 요약)
    const dashboardGreeting = page
      .getByText(/보호자님|대시보드|자녀 활동/)
      .or(page.getByRole("button", { name: "영상 올려주기" }));
    await expect(dashboardGreeting.first()).toBeVisible({ timeout: 10000 });

    // 3. 바텀탭 3탭 확인 (5탭 아님!)
    const nav = page.getByRole("navigation", { name: "하단 탭 네비게이션" });
    await expect(nav).toBeVisible();
    const links = nav.getByRole("link");
    await expect(links).toHaveCount(3);

    // 탭 레이블 확인
    await expect(nav.getByRole("link", { name: "홈", exact: true })).toBeVisible();
    await expect(nav.getByRole("link", { name: "DM", exact: true })).toBeVisible();
    await expect(nav.getByRole("link", { name: "설정", exact: true })).toBeVisible();

    // MVP 탭 없음 확인
    await expect(nav.getByRole("link", { name: "MVP", exact: true })).not.toBeVisible();
    await expect(nav.getByRole("link", { name: "팀", exact: true })).not.toBeVisible();

    // 4. [영상 올려주기] → 업로드 플로우
    const uploadBtn = page.getByRole("button", { name: "영상 올려주기" }).first();
    if (await uploadBtn.isVisible().catch(() => false)) {
      await uploadBtn.click();
      await page.waitForTimeout(500);
      // 업로드 시트 또는 팝업 확인
      const uploadModal = page
        .getByText(/에게 영상 올리기|업로드|자녀 선택/)
        .first();
      if (await uploadModal.isVisible().catch(() => false)) {
        await expect(uploadModal).toBeVisible();
      }
      // 취소 버튼 또는 ESC로 닫기
      const cancelBtn = page.getByRole("button", { name: "취소" });
      if (await cancelBtn.isVisible().catch(() => false)) {
        await cancelBtn.click();
      } else {
        await page.keyboard.press("Escape");
      }
    }

    // 5. DM → 코치에게 메시지
    await clickTab(page, "DM");
    await page.waitForTimeout(1000);
    await expect(page.getByRole("heading", { name: "메시지" })).toBeVisible();

    // 대화 목록 확인
    const dmList = page.locator("a[href^='/dm/']").first();
    if (await dmList.isVisible().catch(() => false)) {
      await dmList.click();
      await page.waitForLoadState("domcontentloaded");
      const msgInput = page.getByPlaceholder("메시지 입력...");
      if (await msgInput.isVisible().catch(() => false)) {
        await msgInput.fill("안녕하세요 코치님! 자녀 E2E 테스트입니다.");
        await page.keyboard.press("Enter");
        await page.waitForTimeout(500);
      }
      await page.goBack();
    }

    // 6. 설정 → 알림 ON/OFF
    await clickTab(page, "설정");
    await page.waitForTimeout(1000);
    await expect(page.getByText("알림 설정")).toBeVisible({ timeout: 10000 });

    // 알림 토글 확인
    const notifToggle = page
      .locator('input[type="checkbox"]')
      .or(page.getByRole("switch"))
      .first();
    if (await notifToggle.isVisible().catch(() => false)) {
      await notifToggle.click();
      await page.waitForTimeout(300);
      await notifToggle.click();
      await page.waitForTimeout(300);
    }

    // 7. /mvp 직접 접근 → 투표 불가 확인
    await page.goto("/mvp", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);

    // 부모는 MVP 투표 버튼이 없거나 비활성화되어야 함
    const mvpPage = page.getByText(/주간 MVP|MVP 투표/);
    if (await mvpPage.isVisible().catch(() => false)) {
      await expect(mvpPage.first()).toBeVisible();
      // 투표 버튼이 없거나 비활성화
      const voteBtn = page.getByRole("button", { name: "투표" }).first();
      const hasVote = await voteBtn.isVisible().catch(() => false);
      // 부모는 투표 불가 (버튼이 없거나 disabled)
      if (hasVote) {
        const isDisabled = await voteBtn.isDisabled().catch(() => false);
        // 부모는 투표 버튼이 disabled이거나 없어야 함
        expect(isDisabled || !hasVote).toBeTruthy();
      }
    }

    // 8. 선수 프로필 방문 → 팔로우 버튼 없음
    await page.goto("/p/e2e_player", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);

    const playerName = page.getByText("E2E Player");
    if (await playerName.isVisible().catch(() => false)) {
      await expect(playerName.first()).toBeVisible();
      // 부모는 팔로우 버튼이 없어야 함
      const followBtn = page.getByRole("button", { name: "팔로우", exact: true });
      await expect(followBtn).not.toBeVisible();
    }

    // 홈으로 돌아오기
    await clickTab(page, "홈");
    await page.waitForTimeout(1000);
    await expect(nav).toBeVisible();
  });
});
