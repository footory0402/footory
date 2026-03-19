import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MEASUREMENTS, MEASUREMENT_BENCHMARKS, getAgeGroup } from "@/lib/constants";

export async function GET(request: NextRequest) {
  try {
    const targetProfileId = request.nextUrl.searchParams.get("profileId");
    const supabase = await createClient();

    let profileId: string;
    if (targetProfileId) {
      // 공개 프로필 — 인증 불필요
      profileId = targetProfileId;
    } else {
      // 내 프로필 — 인증 필요
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      profileId = user.id;
    }

    // 프로필에서 birth_year 조회
    const { data: myProfile } = await supabase
      .from("profiles")
      .select("birth_year")
      .eq("id", profileId)
      .single();

    const ageGroup = getAgeGroup(myProfile?.birth_year ?? null);

    // 내 최근 스탯 조회
    const { data: myStats } = await supabase
      .from("stats")
      .select("stat_type, value")
      .eq("profile_id", profileId)
      .order("recorded_at", { ascending: false });

    if (!myStats || myStats.length === 0) {
      return NextResponse.json({ percentiles: {}, ageAvgs: {}, peerCounts: {}, ageGroup });
    }

    // 종목별 내 대표값 (최근 3회 중앙값)
    const recordsByType = new Map<string, number[]>();
    for (const s of myStats) {
      const arr = recordsByType.get(s.stat_type) ?? [];
      if (arr.length < 3) arr.push(Number(s.value));
      recordsByType.set(s.stat_type, arr);
    }

    function median(arr: number[]): number {
      const sorted = [...arr].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    }

    const latestByType = new Map<string, number>();
    for (const [type, values] of recordsByType.entries()) {
      latestByType.set(type, median(values));
    }

    const percentiles: Record<string, number> = {};
    const peerCounts: Record<string, number> = {};

    // 동나이 선수 ID 목록 (birth_year 기반)
    // AgeGroup 범위 계산: u10(<10), u12(10-11), u15(12-14), u18(15-17), adult(18+)
    const currentYear = new Date().getFullYear();
    const ageRanges: Record<string, { minAge: number; maxAge: number }> = {
      u10:   { minAge: 0,  maxAge: 9  },
      u12:   { minAge: 10, maxAge: 11 },
      u15:   { minAge: 12, maxAge: 14 },
      u18:   { minAge: 15, maxAge: 17 },
      adult: { minAge: 18, maxAge: 99 },
    };
    const range = ageRanges[ageGroup];
    const maxBirthYear = currentYear - range.minAge;
    const minBirthYear = currentYear - range.maxAge;

    // 같은 연령대 선수 ID 목록
    const { data: peerProfiles } = await supabase
      .from("profiles")
      .select("id")
      .gte("birth_year", minBirthYear)
      .lte("birth_year", maxBirthYear);

    const peerIds = (peerProfiles ?? []).map((p) => p.id);

    for (const [statType, myValue] of latestByType.entries()) {
      const measurement = MEASUREMENTS.find((m) => m.id === statType);
      if (!measurement) continue;

      if (peerIds.length <= 1) {
        percentiles[statType] = 50;
        peerCounts[statType] = peerIds.length;
        continue;
      }

      // 같은 연령대 선수들의 해당 종목 기록
      const { data: peerStats } = await supabase
        .from("stats")
        .select("profile_id, value, recorded_at")
        .eq("stat_type", statType)
        .in("profile_id", peerIds)
        .order("recorded_at", { ascending: false });

      if (!peerStats || peerStats.length === 0) {
        percentiles[statType] = 50;
        peerCounts[statType] = 0;
        continue;
      }

      // 선수별 대표값 (최근 3회 중앙값)
      const playerRecords = new Map<string, number[]>();
      for (const row of peerStats) {
        const arr = playerRecords.get(row.profile_id) ?? [];
        if (arr.length < 3) arr.push(Number(row.value));
        playerRecords.set(row.profile_id, arr);
      }

      const peerValues = Array.from(playerRecords.values()).map(median);
      const total = peerValues.length;
      peerCounts[statType] = total;

      if (total <= 1) {
        percentiles[statType] = 50;
        continue;
      }

      let betterCount: number;
      if (measurement.lowerIsBetter) {
        betterCount = peerValues.filter((v) => v > myValue).length;
      } else {
        betterCount = peerValues.filter((v) => v < myValue).length;
      }

      percentiles[statType] = Math.round((betterCount / total) * 100);
    }

    // 연령대별 참고 평균값 (정적 기준값)
    const ageAvgs: Record<string, number> = {};
    for (const m of MEASUREMENTS) {
      const benchmark = MEASUREMENT_BENCHMARKS[m.id]?.[ageGroup];
      if (benchmark) ageAvgs[m.id] = benchmark.avg;
    }

    return NextResponse.json({ percentiles, ageAvgs, peerCounts, ageGroup });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
