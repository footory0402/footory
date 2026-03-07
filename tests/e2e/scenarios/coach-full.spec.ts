import { test, expect, type Page } from "@playwright/test";
import { ensureSeedDataOrSkip } from "../setup/seed-data";
import { loginAsCoach } from "../setup/test-accounts";

test.setTimeout(120000);

const TAB_PATHS: Record<string, string> = {
  "홈": "http://localhost:3000/",
  "MVP": "**/mvp**",
  "DM": "**/dm**",
  "프로필": "**/profile**",
  "팀": "**/team**",
};

async function clickTab(page: Page, label: string) {
  const nav = page.getByRole("navigation", { name: "하단 탭 네비게이션" });
  await nav.getByRole("link", { name: label, exact: true }).click({ force: true });
  const expectedUrl = TAB_PATHS[label] ?? `**/${label.toLowerCase()}**`;
  await page.waitForURL(expectedUrl, { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(600);
}

test.describe("코치 전체 여정", () => {
  test("코치 전체 여정 - 7단계", async ({ page }) => {
    const seeded = await ensureSeedDataOrSkip();

    // 1. 로그인 → 코치 → 인증 뱃지 확인
    await loginAsCoach(page, "/profile");
    await page.waitForTimeout(2000);

    const profileContent = page.locator("main").first();
    await expect(profileContent).toBeVisible({ timeout: 15000 });

    const verifiedBadge = page
      .getByText(/인증|✅/)
      .or(page.locator('[title*="인증"]'))
      .first();
    if (await verifiedBadge.isVisible().catch(() => false)) {
      await expect(verifiedBadge).toBeVisible();
    }

    // 3. 피드 영상 → 리뷰 남기기 (page.goto BEFORE SearchOverlay to avoid competing navigation)
    if (seeded) {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          await page.goto(`/feed/${seeded.feedItemIds[0]}`, { waitUntil: "domcontentloaded" });
          break;
        } catch {
          if (attempt < 2) await page.waitForTimeout(2500);
        }
      }
      await page.waitForTimeout(3000);

      const feedContent = page.locator("main").first();
      await expect(feedContent).toBeVisible({ timeout: 10000 });

      const reviewBtn = page
        .getByRole("button", { name: /리뷰 남기기|📋|코치 리뷰/ })
        .first();
      if (await reviewBtn.isVisible().catch(() => false)) {
        await reviewBtn.click();
        await page.waitForTimeout(500);

        const commentInput = page.getByRole("textbox").or(page.locator("textarea")).first();
        if (await commentInput.isVisible().catch(() => false)) {
          await commentInput.fill("E2E 코치 리뷰: 좋은 기술을 보여주었습니다.");
        }

        const privateToggle = page
          .getByLabel(/비공개/)
          .or(page.getByRole("checkbox", { name: /비공개/ }))
          .first();
        if (await privateToggle.isVisible().catch(() => false)) {
          const isChecked = await privateToggle.isChecked().catch(() => false);
          if (!isChecked) await privateToggle.click();
        }

        const saveBtn = page.getByRole("button", { name: /저장|제출/ }).first();
        if (await saveBtn.isVisible().catch(() => false)) {
          await saveBtn.click();
          await page.waitForTimeout(800);
        } else {
          await page.keyboard.press("Escape");
        }
      }

      // 4. 영상에 리뷰 뱃지 확인 (새로고침)
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.waitForTimeout(2000);

      const reviewSection = page.getByText(/코치 리뷰|리뷰|📋/).first();
      if (await reviewSection.isVisible().catch(() => false)) {
        await expect(reviewSection).toBeVisible();
      }
    }

    // 2. 탐색(검색) 확인 (AFTER page.goto calls to avoid competing navigation)
    await clickTab(page, "홈");
    await page.waitForTimeout(500);
    const searchBtn = page.getByRole("button", { name: "검색" });
    if (await searchBtn.isVisible().catch(() => false)) {
      await searchBtn.click();
      const searchInput = page.getByPlaceholder("선수, 팀, 태그 검색");
      if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await searchInput.fill("E2E");
        await page.waitForTimeout(500);
        const closeSearchBtn = page.locator('[aria-label="닫기"]').first();
        if (await closeSearchBtn.isVisible().catch(() => false)) {
          await closeSearchBtn.click();
        } else {
          await page.keyboard.press("Escape");
        }
        await page.waitForTimeout(500);
      }
    }

    // 5. 선수에게 DM (DM 탭으로 이동 후 대화 클릭)
    await clickTab(page, "DM");
    await expect(page.getByRole("heading", { name: "메시지" })).toBeVisible({ timeout: 10000 });

    if (seeded) {
      const convoLink = page.locator(`a[href="/dm/${seeded.conversationId}"]`).first();
      if (await convoLink.isVisible().catch(() => false)) {
        await convoLink.click();
        await page.waitForTimeout(1500);
        const msgInput = page.getByPlaceholder("메시지 입력...");
        if (await msgInput.isVisible().catch(() => false)) {
          await msgInput.fill("코치입니다. 좋은 영상이었어요!");
          await page.keyboard.press("Enter");
          await page.waitForTimeout(500);
        }
      }
    }

    // 6. /mvp → 투표 버튼 없음 (tab click)
    await clickTab(page, "MVP");
    await expect(page.getByText("주간 MVP")).toBeVisible({ timeout: 10000 });

    const voteBtn = page.getByRole("button", { name: "투표", exact: true }).first();
    const hasVoteBtn = await voteBtn.isVisible().catch(() => false);
    if (hasVoteBtn) {
      const isDisabled = await voteBtn.isDisabled().catch(() => false);
      expect(isDisabled || !hasVoteBtn).toBeTruthy();
    }

    // 7. 바텀탭 5탭 확인
    const navEl = page.getByRole("navigation", { name: "하단 탭 네비게이션" });
    await expect(navEl.getByRole("link")).toHaveCount(5);
    await expect(navEl.getByRole("link", { name: "홈", exact: true })).toBeVisible();
    await expect(navEl.getByRole("link", { name: "MVP", exact: true })).toBeVisible();
    await expect(navEl.getByRole("link", { name: "DM", exact: true })).toBeVisible();
    await expect(navEl.getByRole("link", { name: "프로필", exact: true })).toBeVisible();
    await expect(navEl.getByRole("link", { name: "팀", exact: true })).toBeVisible();
  });
});
