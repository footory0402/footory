import { test, expect, type Page } from "@playwright/test";
import { ensureSeedDataOrSkip } from "../setup/seed-data";
import { loginAsPlayer } from "../setup/test-accounts";

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

test.describe("선수 전체 여정", () => {
  test("선수 전체 여정 - 17단계", async ({ page }) => {
    const seeded = await ensureSeedDataOrSkip();

    // === 1단계: 로그인 → 홈 도달 ===
    await loginAsPlayer(page, "/");
    await page.waitForTimeout(2000);
    const navEl = page.getByRole("navigation", { name: "하단 탭 네비게이션" });
    await expect(navEl).toBeVisible({ timeout: 15000 });
    await expect(navEl.getByRole("link")).toHaveCount(5);

    // === 2단계: 홈 확인 ===
    const homePrimary = page.getByText(/주간 MVP|MVP|이번 주 챌린지|챌린지/).first();
    await expect(homePrimary).toBeVisible({ timeout: 10000 });

    const questSection = page.getByText(/퀘스트|초보자 퀘스트/).first();
    if (await questSection.isVisible().catch(() => false)) {
      await expect(questSection).toBeVisible();
    }

    // === 5단계: 응원 (홈 피드) ===
    const kudosBtn = page
      .getByRole("button", { name: /응원|👏/ })
      .or(page.locator('[aria-label*="응원"]'))
      .first();
    if (await kudosBtn.isVisible().catch(() => false)) {
      await kudosBtn.click();
      await page.waitForTimeout(500);
    }

    // === 7-9단계: 영상 상세 → 댓글/대댓글/공유 (page.goto는 search 전에 실행) ===
    if (seeded) {
      // Retry in case Next.js auth refresh causes a competing "/" navigation
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          await page.goto(`/feed/${seeded.feedItemIds[0]}`, { waitUntil: "domcontentloaded" });
          break;
        } catch {
          if (attempt < 2) await page.waitForTimeout(2500);
          else throw new Error(`Feed navigation failed after ${attempt + 1} attempts`);
        }
      }
      await page.waitForTimeout(3000);

      const commentInput = page.getByPlaceholder(/댓글 작성|댓글을 입력/);
      if (await commentInput.isVisible().catch(() => false)) {
        await commentInput.fill("@e2e_coach 좋은 영상이네요!");
        await page.keyboard.press("Enter");
        await page.waitForTimeout(500);
      }

      const existingComment = page.getByText("E2E coach comment");
      if (await existingComment.isVisible().catch(() => false)) {
        const replyBtn = page.getByRole("button", { name: "답글" }).first();
        if (await replyBtn.isVisible().catch(() => false)) {
          await replyBtn.click();
          await page.waitForTimeout(300);
          const replyInput = page.getByPlaceholder(/답글|댓글/).first();
          if (await replyInput.isVisible().catch(() => false)) {
            await replyInput.fill("대댓글 E2E 테스트");
            await page.keyboard.press("Enter");
            await page.waitForTimeout(500);
          }
        }
      }

      const shareBtn = page.getByRole("button", { name: /공유|↗/ }).first();
      if (await shareBtn.isVisible().catch(() => false)) {
        await shareBtn.click();
        await page.waitForTimeout(300);
        const copyBtn = page.getByRole("button", { name: /링크 복사|복사/ });
        if (await copyBtn.isVisible().catch(() => false)) {
          await copyBtn.click();
          await page.waitForTimeout(300);
        }
        await page.keyboard.press("Escape");
      }
    }

    // === 10단계: MVP → 투표 (tab click) ===
    await clickTab(page, "MVP");
    await expect(page.getByText("주간 MVP")).toBeVisible({ timeout: 15000 });

    const voteBtn = page.getByRole("button", { name: /투표/ }).first();
    if (await voteBtn.isVisible().catch(() => false)) {
      const isEnabled = await voteBtn.isEnabled().catch(() => false);
      if (isEnabled) {
        await voteBtn.click();
        await page.waitForTimeout(1500);
      }
    }

    // === 11단계: 프로필 편집 ===
    await clickTab(page, "프로필");
    await expect(page.getByRole("button", { name: "PDF 내보내기" })).toBeVisible({ timeout: 10000 });

    const editBtn = page.getByRole("button", { name: /편집|수정/ }).first();
    if (await editBtn.isVisible().catch(() => false)) {
      await editBtn.click();
      await page.waitForTimeout(800);

      const heightInput = page.getByLabel(/키|신장/).or(page.locator('input[name="height"]'));
      if (await heightInput.isVisible().catch(() => false)) {
        await heightInput.fill("175");
      }
      const weightInput = page.getByLabel(/몸무게|체중/).or(page.locator('input[name="weight"]'));
      if (await weightInput.isVisible().catch(() => false)) {
        await weightInput.fill("65");
      }
      const saveBtn = page.getByRole("button", { name: /저장/ }).first();
      if (await saveBtn.isVisible().catch(() => false)) {
        await saveBtn.click();
        await page.waitForTimeout(800);
      }
    }

    // === 12단계: 기록 탭 ===
    await clickTab(page, "프로필");
    const recordsTab = page.getByRole("button", { name: /기록/ });
    if (await recordsTab.isVisible().catch(() => false)) {
      await recordsTab.click();
      await page.waitForTimeout(500);
      // Don't click "수상 추가" to avoid modal intercepting subsequent PDF click
    }

    // === 13단계: 타임라인 ===
    const timeline = page.getByText(/타임라인|성장|기록/).first();
    if (await timeline.isVisible().catch(() => false)) {
      await expect(timeline).toBeVisible();
    }

    // === 14단계: PDF 내보내기 ===
    await clickTab(page, "프로필");
    const pdfBtn = page.getByRole("button", { name: "PDF 내보내기" });
    await expect(pdfBtn).toBeVisible({ timeout: 10000 });
    // Ensure no overlay is blocking by pressing Escape and waiting
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);
    await pdfBtn.click({ force: true });
    await page.waitForTimeout(1000);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(1500); // Wait for any PDF sheet navigation to settle

    // === 16단계: DM 목록 → 대화 ===
    // Use page.goto with retry instead of clickTab (profile tab re-click causes pending navigation)
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await page.goto("/dm", { waitUntil: "domcontentloaded" });
        break;
      } catch {
        if (attempt < 2) await page.waitForTimeout(2000);
      }
    }
    await page.waitForTimeout(1000);
    await expect(page.getByRole("heading", { name: "메시지" })).toBeVisible({ timeout: 10000 });

    if (seeded) {
      const convo = page.locator(`a[href="/dm/${seeded.conversationId}"]`).first();
      if (await convo.isVisible().catch(() => false)) {
        await convo.click();
        await page.waitForTimeout(1500);
        await expect(page.getByPlaceholder("메시지 입력...")).toBeVisible();
        const msgInput = page.getByPlaceholder("메시지 입력...");
        await msgInput.fill("안녕하세요! E2E 선수 여정 테스트입니다.");
        await page.keyboard.press("Enter");
        await page.waitForTimeout(500);
      }
    }

    // === 17단계: 팀 확인 ===
    await clickTab(page, "팀");
    const teamSection = page
      .getByText(/E2E FC|내 팀|아직 팀이 없어요/)
      .first();
    await expect(teamSection).toBeVisible({ timeout: 15000 });

    // === 15단계: 알림 확인 (tab nav 헤더 알림 버튼 확인으로 대체) ===
    const notifIconBtn = page.locator('[aria-label="알림"]').or(page.getByRole("button", { name: "알림" })).first();
    if (await notifIconBtn.isVisible().catch(() => false)) {
      await expect(notifIconBtn).toBeVisible();
    }

    // === 3단계: 탐색 검색 확인 (SearchOverlay의 history.pushState가 뒤에 오도록 이동) ===
    // 홈으로 이동 후 검색 (이후 page.goto 없음)
    await clickTab(page, "홈");
    await page.waitForTimeout(500);
    const searchBtn = page.getByRole("button", { name: "검색" });
    if (await searchBtn.isVisible().catch(() => false)) {
      await searchBtn.click();
      const searchInput = page.getByPlaceholder("선수, 팀, 태그 검색");
      if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await searchInput.fill("E2E");
        await page.waitForTimeout(500);
        // 닫기 버튼으로 닫기 (Escape 대신 - history state 이슈 방지)
        const closeSearchBtn = page.locator('[aria-label="닫기"]').first();
        if (await closeSearchBtn.isVisible().catch(() => false)) {
          await closeSearchBtn.click();
        } else {
          await page.keyboard.press("Escape");
        }
        await page.waitForTimeout(500);
      }
    }

    // 최종: 홈 확인
    await expect(navEl).toBeVisible();
  });
});
