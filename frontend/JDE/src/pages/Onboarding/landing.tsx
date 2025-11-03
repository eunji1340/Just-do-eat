// src/pages/Onboarding/landing.tsx
import { useNavigate } from 'react-router-dom';

export default function OnboardingLanding() {
  const nav = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-5 gap-8 max-w-lg mx-auto bg-[var(--color-bg)]">
      {/* 서비스 소개 */}
      <div className="text-center">
        <h1 className="text-4xl mb-4 font-bold">🍽️ 먹BTI</h1>
        <p className="text-lg text-gray-600 leading-relaxed">
          나만의 음식 취향을 발견하고<br />
          맞춤형 맛집을 추천받아보세요!
        </p>
      </div>

      {/* 버튼 그룹 */}
      <div className="flex flex-col gap-3 w-full max-w-md">
        <button
          onClick={() => nav('/login')}
          className="py-4 px-8 text-lg rounded-xl border-none bg-neutral-900 text-white cursor-pointer font-bold hover:bg-neutral-800 transition-colors"
        >
          로그인
        </button>

        <button
          onClick={() => nav('/signup')}
          className="py-4 px-8 text-lg rounded-xl border-2 border-neutral-900 bg-white text-neutral-900 cursor-pointer font-bold hover:bg-gray-50 transition-colors"
        >
          회원가입
        </button>

        <button
          onClick={() => nav('/onboarding/test')}
          className="py-4 px-8 text-base rounded-xl border border-gray-300 bg-gray-100 text-gray-600 cursor-pointer hover:bg-gray-200 transition-colors"
        >
          비회원으로 테스트하기
        </button>
      </div>

      <p className="text-sm text-gray-500 text-center">
        비회원은 테스트만 가능하며,<br />
        결과 저장 및 맞춤 추천을 받으려면 회원가입이 필요합니다.
      </p>
    </div>
  );
}

