"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Method = "team_code" | "document" | "referral";

const METHODS: { value: Method; label: string; desc: string }[] = [
  {
    value: "team_code",
    label: "팀 코드 입력",
    desc: "소속 팀의 초대 코드를 입력하면 팀 관리자가 확인합니다",
  },
  {
    value: "document",
    label: "증빙 서류 제출",
    desc: "자격증, 소속 증명서 등을 업로드합니다 (수동 검토)",
  },
  {
    value: "referral",
    label: "인증 코치 추천",
    desc: "이미 인증된 코치의 @핸들을 입력하면 확인 요청이 전송됩니다",
  },
];

export default function VerificationFlow({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const [method, setMethod] = useState<Method | null>(null);
  const [teamCode, setTeamCode] = useState("");
  const [referrerHandle, setReferrerHandle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!method || submitting) return;
    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    try {
      if (method === "team_code") {
        if (!teamCode.trim()) {
          setError("팀 코드를 입력해주세요");
          setSubmitting(false);
          return;
        }
        await supabase.from("coach_verifications").insert({
          profile_id: user.id,
          method: "team_code",
          team_code: teamCode.trim(),
          status: "pending",
        });
      } else if (method === "referral") {
        const handle = referrerHandle.replace("@", "").trim();
        if (!handle) {
          setError("코치 핸들을 입력해주세요");
          setSubmitting(false);
          return;
        }

        const { data: referrer } = await supabase
          .from("profiles")
          .select("id, is_verified")
          .eq("handle", handle)
          .single();

        if (!referrer) {
          setError("해당 핸들의 사용자를 찾을 수 없습니다");
          setSubmitting(false);
          return;
        }

        if (!referrer.is_verified) {
          setError("해당 코치는 아직 인증되지 않았습니다");
          setSubmitting(false);
          return;
        }

        await supabase.from("coach_verifications").insert({
          profile_id: user.id,
          method: "referral",
          referrer_id: referrer.id,
          status: "pending",
        });

        // Send notification to referrer
        await supabase.from("notifications").insert({
          user_id: referrer.id,
          type: "verify_request",
          title: "코치 인증 추천 요청",
          body: `@${user.user_metadata?.handle ?? "사용자"}님이 회원님의 추천을 요청했습니다`,
          reference_id: user.id,
        });
      } else if (method === "document") {
        await supabase.from("coach_verifications").insert({
          profile_id: user.id,
          method: "document",
          status: "pending",
        });
      }

      setDone(true);
    } catch {
      setError("요청 처리 중 오류가 발생했습니다");
    }

    setSubmitting(false);
  };

  if (done) {
    return (
      <div className="flex flex-col items-center py-8">
        <span className="text-4xl">📋</span>
        <p className="mt-3 text-[15px] font-semibold text-text-1">
          인증 요청이 접수되었습니다
        </p>
        <p className="mt-1 text-center text-[13px] text-text-3">
          {method === "team_code"
            ? "팀 관리자 승인 후 인증이 완료됩니다"
            : method === "referral"
              ? "추천 코치 확인 후 즉시 인증됩니다"
              : "서류 검토 후 인증이 완료됩니다 (1~3일 소요)"}
        </p>
        <button
          onClick={() => {
            onSuccess?.();
            onClose();
          }}
          className="mt-5 rounded-xl bg-accent px-8 py-2.5 text-sm font-semibold text-black"
        >
          확인
        </button>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-center text-[16px] font-bold text-text-1">
        코치/스카우터 인증
      </h3>
      <p className="mt-1 text-center text-[13px] text-text-3">
        인증 완료 시 프로필에 인증 뱃지가 표시됩니다
      </p>

      {/* Method Selection */}
      {!method ? (
        <div className="mt-5 space-y-3">
          {METHODS.map((m) => (
            <button
              key={m.value}
              onClick={() => setMethod(m.value)}
              className="w-full rounded-xl border border-border p-4 text-left transition-colors active:bg-card"
            >
              <p className="text-[14px] font-semibold text-text-1">
                {m.label}
              </p>
              <p className="mt-0.5 text-[12px] text-text-3">{m.desc}</p>
            </button>
          ))}
          <button
            onClick={onClose}
            className="w-full py-3 text-center text-[13px] text-text-3"
          >
            취소
          </button>
        </div>
      ) : (
        <div className="mt-5">
          {method === "team_code" && (
            <div>
              <label className="mb-2 block text-[13px] text-text-2">
                팀 초대 코드
              </label>
              <input
                type="text"
                value={teamCode}
                onChange={(e) => setTeamCode(e.target.value)}
                placeholder="코드 입력"
                className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-[14px] text-text-1 placeholder:text-text-3 outline-none focus:border-accent"
                autoFocus
              />
            </div>
          )}

          {method === "referral" && (
            <div>
              <label className="mb-2 block text-[13px] text-text-2">
                인증 코치 @핸들
              </label>
              <input
                type="text"
                value={referrerHandle}
                onChange={(e) => setReferrerHandle(e.target.value)}
                placeholder="@코치핸들"
                className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-[14px] text-text-1 placeholder:text-text-3 outline-none focus:border-accent"
                autoFocus
              />
            </div>
          )}

          {method === "document" && (
            <div className="rounded-xl border border-dashed border-border p-6 text-center">
              <span className="text-2xl">📄</span>
              <p className="mt-2 text-[13px] text-text-3">
                증빙 서류 업로드는 추후 지원 예정입니다
              </p>
              <p className="text-[12px] text-text-3">
                현재는 팀 코드 또는 코치 추천으로 인증해주세요
              </p>
            </div>
          )}

          {error && (
            <p className="mt-2 text-[13px] text-red-400">{error}</p>
          )}

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => {
                setMethod(null);
                setError(null);
              }}
              className="flex-1 rounded-xl bg-surface py-3 text-[14px] font-semibold text-text-2"
            >
              뒤로
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || method === "document"}
              className="flex-1 rounded-xl bg-accent py-3 text-[14px] font-semibold text-black disabled:opacity-40"
            >
              {submitting ? "처리 중..." : "인증 요청"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
