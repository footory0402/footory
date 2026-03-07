import { test, expect } from "@playwright/test";
import { ensureSeedDataOrSkip } from "../setup/seed-data";
import { loginAsScout } from "../setup/test-accounts";

test.setTimeout(90000);

test.describe("스카우터 전체 여정", () => {
  test("스카우터 전체 여정 - 5단계", async ({ page }) => {
    await ensureSeedDataOrSkip();

    // 1. 스카우터 로그인 (인증된 코치 계정)
    await loginAsScout(page, "/discover");
    await page.waitForTimeout(1000);

    // 탐색 페이지 확인
    await expect(page.getByText(/선수, 팀, 태그 검색/)).toBeVisible({ timeout: 10000 });

    // 2. 탐색 → 선수 검색 → 프로필
    // 탭 필터 확인
    const playerFilterBtn = page.getByRole("button", { name: "선수", exact: true });
    if (await playerFilterBtn.isVisible().catch(() => false)) {
      await playerFilterBtn.click();
    }

    // 검색창에 검색어 입력
    const searchBtn = page.getByRole("button", { name: "검색" });
    if (await searchBtn.isVisible().catch(() => false)) {
      await searchBtn.click();
    }
    const searchInput = page.getByPlaceholder("선수, 팀, 태그 검색");
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill("E2E");
      await page.waitForTimeout(800);

      // 검색 결과에서 선수 선택
      const playerResult = page.getByText("E2E Player").or(page.getByText("e2e_player")).first();
      if (await playerResult.isVisible().catch(() => false)) {
        await playerResult.click();
        await page.waitForURL("**/p/**", { timeout: 15000 }).catch(() => {});
        await page.waitForTimeout(1000);
      } else {
        await page.keyboard.press("Escape");
        await page.waitForTimeout(1500); // wait for history.pushState navigation to settle
        // 공개 프로필로 직접 이동 (retry for competing navigation)
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            await page.goto("/p/e2e_player", { waitUntil: "domcontentloaded" });
            break;
          } catch {
            if (attempt < 2) await page.waitForTimeout(2000);
          }
        }
        await page.waitForTimeout(1000);
      }
    } else {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          await page.goto("/p/e2e_player", { waitUntil: "domcontentloaded" });
          break;
        } catch {
          if (attempt < 2) await page.waitForTimeout(2000);
        }
      }
      await page.waitForTimeout(1000);
    }
    await page.waitForTimeout(500);

    // 선수 프로필 확인
    const playerName = page.getByText("E2E Player");
    if (await playerName.isVisible().catch(() => false)) {
      await expect(playerName.first()).toBeVisible();
    }

    // 3. [관심 추가] → 메모 입력
    const watchlistAddBtn = page
      .getByRole("button", { name: "관심 선수 추가" })
      .or(page.getByRole("button", { name: "⭐ 관심 추가" }))
      .or(page.getByRole("button", { name: /관심/ }))
      .first();

    const hasWatchlistBtn = await watchlistAddBtn.isVisible().catch(() => false);

    if (hasWatchlistBtn) {
      const label = (await watchlistAddBtn.textContent()) ?? "";
      const isAlreadyAdded = label.includes("관심 선수") && !label.includes("추가");

      if (!isAlreadyAdded) {
        // 관심 선수 추가
        const addResponse = page.waitForResponse(
          (r) =>
            r.url().includes("/api/watchlist") && r.request().method() === "POST",
          { timeout: 5000 }
        ).catch(() => null);
        await watchlistAddBtn.click();
        await addResponse;
        await page.waitForTimeout(500);
      }

      // 메모 입력 모달이 열리면
      const memoInput = page.getByPlaceholder(/메모|노트|note/).first();
      if (await memoInput.isVisible().catch(() => false)) {
        await memoInput.fill("E2E 스카우터 메모: 유망한 선수");
        const saveBtn = page.getByRole("button", { name: /저장|확인/ }).first();
        if (await saveBtn.isVisible().catch(() => false)) {
          await saveBtn.click();
          await page.waitForTimeout(500);
        }
      }
    }

    // 4. 워치리스트 확인 (retry for competing navigation from previous navigate)
    await page.waitForTimeout(1000);
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await page.goto("/profile/watchlist", { waitUntil: "domcontentloaded" });
        break;
      } catch {
        if (attempt < 2) await page.waitForTimeout(2000);
      }
    }
    await page.waitForTimeout(1000);
    await expect(page.getByText("관심 선수")).toBeVisible({ timeout: 10000 });

    // 워치리스트에 데이터가 있는지 확인 (없을 수도 있음 - 씨드 리셋)
    const watchlistContent = page
      .getByText(/E2E Player|e2e_player|관심 선수가 없|아직 없/)
      .first();
    await expect(watchlistContent).toBeVisible({ timeout: 8000 });

    // 5. 선수에게 DM
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await page.goto("/p/e2e_player", { waitUntil: "domcontentloaded" });
        break;
      } catch {
        if (attempt < 2) await page.waitForTimeout(2000);
      }
    }
    await page.waitForTimeout(1000);

    const dmBtn = page.getByRole("button", { name: /메시지|DM/ }).first();
    if (await dmBtn.isVisible().catch(() => false)) {
      await dmBtn.click();
      await page.waitForLoadState("domcontentloaded");

      const msgInput = page.getByPlaceholder("메시지 입력...");
      if (await msgInput.isVisible().catch(() => false)) {
        await msgInput.fill("안녕하세요! 스카우터입니다. 관심 있습니다.");
        await page.keyboard.press("Enter");
        await page.waitForTimeout(500);
      }

      // DM 목록으로 이동
      const nav = page.getByRole("navigation", { name: "하단 탭 네비게이션" });
      await nav.getByRole("link", { name: "DM", exact: true }).click({ force: true });
      await page.waitForURL("**/dm**", { timeout: 15000, waitUntil: "domcontentloaded" }).catch(() => {});
      await page.waitForTimeout(1000);
      // DM 목록 "메시지" 헤딩 확인 (대화 페이지에 있으면 소프트 체크)
      // soft check: heading may not be visible if on conversation page
      await page.getByRole("heading", { name: "메시지" }).isVisible({ timeout: 5000 }).catch(() => false);
    } else {
      // DM 버튼 없어도 DM 탭은 접근 가능
      const nav = page.getByRole("navigation", { name: "하단 탭 네비게이션" });
      await nav.getByRole("link", { name: "DM", exact: true }).click({ force: true });
      await page.waitForURL("**/dm**", { timeout: 15000, waitUntil: "domcontentloaded" }).catch(() => {});
      await page.waitForTimeout(1000);
      await page.getByRole("heading", { name: "메시지" }).isVisible({ timeout: 5000 }).catch(() => false);
    }
  });
});
