"use client";

import { useEffect } from "react";
import { useProfileContext } from "@/providers/ProfileProvider";

/**
 * 서버에서 가져온 프로필 데이터를 ProfileProvider에 주입.
 * ProfileProvider의 /api/profile 호출을 제거하여 클라이언트 네트워크 요청 1개 + DB 쿼리 2개 절약.
 */
export default function ProfileHydrator({ data }: { data: Record<string, unknown> }) {
  const { hydrateProfile } = useProfileContext();

  useEffect(() => {
    hydrateProfile(data);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
