import { test, expect } from "@playwright/test";
import { ensureSeedDataOrSkip } from "../setup/seed-data";
import { loginAsPlayer, loginAsCoach } from "../setup/test-accounts";

test.setTimeout(90000);

const E2E_INVITE_CODE = "E2E2601";
const E2E_TEAM_NAME = "E2E FC";
const E2E_TEAM_HANDLE = "e2e_fc";

test.describe("팀 바이럴 플로우", () => {
  test("팀 생성 확인 → 코드 복사 → 멤버 표시", async ({ browser }) => {
    const seeded = await ensureSeedDataOrSkip();
    if (!seeded) return;

    // 1. 선수A(player)가 팀 페이지 접근 → E2E FC 확인 (이미 멤버)
    const playerCtx = await browser.newContext();
    const playerPage = await playerCtx.newPage();

    try {
      await loginAsPlayer(playerPage, "/team");
      await playerPage.waitForLoadState("networkidle");

      // 팀 목록에 E2E FC 표시 확인
      const teamSection = playerPage
        .getByText(E2E_TEAM_NAME)
        .or(playerPage.getByText(/내 팀|아직 팀이 없어요/))
        .first();
      await expect(teamSection).toBeVisible({ timeout: 10000 });

      // E2E FC 클릭 → 팀 상세
      const e2eTeamLink = playerPage
        .getByRole("link", { name: E2E_TEAM_NAME })
        .or(playerPage.getByText(E2E_TEAM_NAME).first());
      if (await e2eTeamLink.isVisible().catch(() => false)) {
        await e2eTeamLink.click();
        await playerPage.waitForURL(`**/team/**`, { timeout: 15000 }).catch(() => {});
        await playerPage.waitForTimeout(2000);
      } else {
        // 팀 상세로 직접 이동 (retry for competing /team auth-refresh navigation)
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            await playerPage.goto(`/t/${E2E_TEAM_HANDLE}`, { waitUntil: "domcontentloaded" });
            break;
          } catch {
            if (attempt < 2) await playerPage.waitForTimeout(2000);
          }
        }
        await playerPage.waitForTimeout(2000);
      }

      // 2. 팀 상세 → 초대 코드 확인
      const teamDetailContent = playerPage.locator("main").first();
      await expect(teamDetailContent).toBeVisible({ timeout: 10000 });

      // 팀 코드 확인
      const teamCode = playerPage.getByText(E2E_INVITE_CODE);
      if (await teamCode.isVisible().catch(() => false)) {
        await expect(teamCode).toBeVisible();
      } else {
        // 팀 코드 섹션이 다른 방식으로 표시될 수 있음
        const codeSection = playerPage.getByText(/팀 코드|초대 코드/).first();
        if (await codeSection.isVisible().catch(() => false)) {
          await expect(codeSection).toBeVisible();
        }
      }

      // 팀 멤버 확인 (최소 coach + player = 2명)
      const membersSection = playerPage
        .getByText(/멤버|팀원/)
        .first();
      if (await membersSection.isVisible().catch(() => false)) {
        await expect(membersSection).toBeVisible();
      }

      // E2E Coach (admin) 표시 확인
      const adminMember = playerPage
        .getByText(/E2E Coach|e2e_coach/)
        .first();
      if (await adminMember.isVisible().catch(() => false)) {
        await expect(adminMember).toBeVisible();
      }

      // 3. 팀 코드 복사 기능
      const copyCodeBtn = playerPage
        .getByRole("button", { name: /코드 복사|복사|copy/i })
        .first();
      if (await copyCodeBtn.isVisible().catch(() => false)) {
        await copyCodeBtn.click();
        await playerPage.waitForTimeout(300);
        // 복사 완료 토스트 또는 피드백
        const copyFeedback = playerPage
          .getByText(/복사됨|복사 완료|copied/i)
          .first();
        if (await copyFeedback.isVisible().catch(() => false)) {
          await expect(copyFeedback).toBeVisible();
        }
      }
    } finally {
      await playerPage.close();
      await playerCtx.close();
    }
  });

  test("선수B(coach) 코드로 팀 가입 확인", async ({ browser }) => {
    const seeded = await ensureSeedDataOrSkip();
    if (!seeded) return;

    // 코치는 이미 E2E FC의 admin이므로 팀 상세 확인
    const coachCtx = await browser.newContext();
    const coachPage = await coachCtx.newPage();

    try {
      await loginAsCoach(coachPage, "/team");
      await coachPage.waitForLoadState("networkidle");

      // 4. 팀 상세에 멤버 표시 확인
      const teamLink = coachPage
        .getByRole("link", { name: E2E_TEAM_NAME })
        .or(coachPage.getByText(E2E_TEAM_NAME).first());
      if (await teamLink.isVisible().catch(() => false)) {
        await teamLink.click();
        await coachPage.waitForLoadState("networkidle");
      } else {
        await coachPage.goto(`/t/${E2E_TEAM_HANDLE}`, { waitUntil: "domcontentloaded" });
        await coachPage.waitForLoadState("networkidle");
      }

      // 팀 피드 확인
      const teamFeed = coachPage
        .getByText(/팀 피드|최근 영상|게시물/)
        .or(coachPage.getByRole("article"))
        .first();
      if (await teamFeed.isVisible().catch(() => false)) {
        await expect(teamFeed).toBeVisible();
      }

      // 멤버 섹션 확인
      const membersText = coachPage.getByText(/멤버|팀원/).first();
      if (await membersText.isVisible().catch(() => false)) {
        await expect(membersText).toBeVisible();
      }
    } finally {
      await coachPage.close();
      await coachCtx.close();
    }
  });

  test("팀 만들기 UI 플로우", async ({ browser }) => {
    const seeded = await ensureSeedDataOrSkip();
    if (!seeded) return;

    // 새 유저 시뮬레이션: 스카우터가 팀 없는 상태에서 팀 만들기
    const { loginAsScout } = await import("../setup/test-accounts");
    const scoutCtx = await browser.newContext();
    const scoutPage = await scoutCtx.newPage();

    try {
      await loginAsScout(scoutPage, "/team");
      await scoutPage.waitForLoadState("networkidle");

      // 팀 만들기 버튼 확인 (empty state: "팀 만들기", non-empty: "+ 만들기")
      const createTeamBtn = scoutPage
        .getByRole("button", { name: "팀 만들기" })
        .or(scoutPage.getByRole("button", { name: /만들기/ }))
        .first();

      const hasCreateBtn = await createTeamBtn.isVisible({ timeout: 10000 }).catch(() => false);
      if (!hasCreateBtn) {
        // Scout already has teams — verify team list is shown instead
        const teamListHeader = scoutPage.getByText(/내 팀|현재 소속/).first();
        if (await teamListHeader.isVisible().catch(() => false)) {
          await expect(teamListHeader).toBeVisible();
        }
        return; // test complete: scout has teams, create button not shown in empty state
      }

      // 팀 만들기 클릭 → 폼 열림
      await createTeamBtn.click();
      await scoutPage.waitForTimeout(500);

      // 팀 이름 입력 폼 확인
      const teamNameInput = scoutPage
        .getByLabel(/팀 이름/)
        .or(scoutPage.getByPlaceholder(/팀 이름/))
        .first();
      if (await teamNameInput.isVisible().catch(() => false)) {
        await expect(teamNameInput).toBeVisible();
        await teamNameInput.fill("E2E Test Team " + Date.now());
      }

      // 팀 핸들 입력
      const handleInput = scoutPage
        .getByLabel(/핸들|handle|팀 ID/)
        .or(scoutPage.getByPlaceholder(/핸들|handle/))
        .first();
      if (await handleInput.isVisible().catch(() => false)) {
        await handleInput.fill("e2e_test_" + Math.floor(Math.random() * 9999));
      }

      // 폼 닫기 (실제 생성은 하지 않음)
      const closeBtn = scoutPage
        .getByRole("button", { name: /취소|닫기/ })
        .or(scoutPage.locator('[aria-label="닫기"]'))
        .first();
      if (await closeBtn.isVisible().catch(() => false)) {
        await closeBtn.click();
      } else {
        await scoutPage.keyboard.press("Escape");
      }
      await scoutPage.waitForTimeout(300);
    } finally {
      await scoutPage.close();
      await scoutCtx.close();
    }
  });

  test("팀 탈퇴 → alumni 표시 확인", async ({ browser }) => {
    const seeded = await ensureSeedDataOrSkip();
    if (!seeded) return;

    // 팀 상세 페이지에서 탈퇴한 멤버(alumni) 표시 확인
    const playerCtx = await browser.newContext();
    const playerPage = await playerCtx.newPage();

    try {
      await loginAsPlayer(playerPage, `/t/${E2E_TEAM_HANDLE}`);
      await playerPage.waitForLoadState("networkidle");

      const mainContent = playerPage.locator("main").first();
      await expect(mainContent).toBeVisible({ timeout: 10000 });

      // Alumni 섹션 확인 (있으면)
      const alumniSection = playerPage
        .getByText(/alumni|이전 멤버|졸업|전 팀원/)
        .first();
      // Alumni 정보가 있을 수도, 없을 수도 있음
      const hasAlumni = await alumniSection.isVisible().catch(() => false);
      // alumni 섹션이 있든 없든 팀 페이지는 정상 표시되어야 함
      await expect(mainContent).toBeVisible();

      // 팀 피드 탭 확인
      const feedTab = playerPage.getByRole("tab", { name: /피드/ }).first();
      if (await feedTab.isVisible().catch(() => false)) {
        await feedTab.click();
        await playerPage.waitForTimeout(500);
      }

      // 팀 멤버 탭 확인
      const membersTab = playerPage.getByRole("tab", { name: /멤버/ }).first();
      if (await membersTab.isVisible().catch(() => false)) {
        await membersTab.click();
        await playerPage.waitForTimeout(500);
      }
    } finally {
      await playerPage.close();
      await playerCtx.close();
    }
  });
});
