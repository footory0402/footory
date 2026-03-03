import KakaoLoginButton from "@/components/auth/KakaoLoginButton";

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6">
      {/* 로고 */}
      <div className="mb-12 text-center">
        <h1 className="font-brand text-4xl font-bold tracking-wider text-accent">
          FOOTORY
        </h1>
        <p className="mt-2 text-sm text-text-2">
          유스 축구 선수 프로필 플랫폼
        </p>
      </div>

      {/* 로그인 버튼 */}
      <div className="w-full max-w-[320px]">
        <KakaoLoginButton />
      </div>

      {/* 푸터 */}
      <p className="mt-8 text-xs text-text-3">
        로그인 시 이용약관 및 개인정보처리방침에 동의합니다
      </p>
    </div>
  );
}
