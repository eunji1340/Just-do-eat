// src/pages/Onboarding/landing.tsx
import { useNavigate } from 'react-router-dom';

export default function OnboardingLanding() {
  const nav = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-5 gap-8 max-w-xl mx-auto bg-[var(--color-bg)]">
      {/* 서비스 소개 */}
      <div className="text-center">
        <h1 className="text-4xl mb-4 font-bold text-[var(--color-fg)]">🍽️ 먹BTI</h1>
        <p className="text-lg text-[var(--color-muted)] leading-relaxed">
          나만의 음식 취향을 발견하고<br />
          맞춤형 맛집을 추천받아보세요!
        </p>
      </div>

      {/* 버튼 그룹 */}
      <div className="flex flex-col gap-3 w-full max-w-md">
        <button
          onClick={() => nav('/login')}
          className="py-4 px-8 text-lg rounded-xl border-none bg-[var(--color-primary)] text-[var(--color-primary-fg)] cursor-pointer font-bold hover:opacity-90 transition-colors"
        >
          로그인
        </button>

        <button
          onClick={() => nav('/signup')}
          className="py-4 px-8 text-lg rounded-xl border-2 border-[var(--color-primary)] bg-[var(--color-bg)] text-[var(--color-fg)] cursor-pointer font-bold hover:bg-[var(--color-surface)] transition-colors"
        >
          회원가입
        </button>

        <button
          onClick={() => nav('/onboarding/test')}
          className="py-4 px-8 text-base rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] cursor-pointer hover:bg-[var(--color-border)] transition-colors"
        >
          비회원으로 테스트하기
        </button>
      </div>

      <p className="text-sm text-[var(--color-muted)] text-center">
        비회원은 테스트만 가능하며,<br />
        결과 저장 및 맞춤 추천을 받으려면 회원가입이 필요합니다.
      </p>
    </div>
  );
}

