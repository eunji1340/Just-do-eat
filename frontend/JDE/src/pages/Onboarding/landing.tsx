// src/pages/Onboarding/landing.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function OnboardingLanding() {
  const nav = useNavigate();
  const [showSignupModal, setShowSignupModal] = useState(false);

  const handleSignupClick = () => {
    setShowSignupModal(true);
  };

  const handleConfirmSignup = () => {
    setShowSignupModal(false);
    nav("/signup");
  };

  const handleTestClick = () => {
    setShowSignupModal(false);
    nav("/onboarding/test");
  };

  return (
    <>
      <div className="flex flex-col items-center justify-center fixed inset-0 p-5 gap-6 max-w-xl mx-auto bg-[var(--color-bg)] overflow-y-auto">
        {/* 캐릭터 이미지 */}
        <div className="flex-shrink-0 mb-2">
          <img
            src="/cute_man.png"
            alt="JDE 캐릭터"
            className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
          />
        </div>

        {/* 서비스 소개 */}
        <div className="text-center space-y-3">
          <div className="mb-2 flex justify-center">
            <img
              src="/logo1_primary.png"
              alt="JUST DO EAT"
              className="h-12 sm:h-16 object-contain"
            />
          </div>
          <p className="text-lg font-semibold sm:text-xl text-[var(--color-fg)] leading-relaxed px-4">
            <br />
            나만의 음식 취향을 발견하고
            <br />
            맞춤형 맛집을 추천받아보세요!
          </p>
        </div>

        {/* 버튼 그룹 */}
        <div className="flex flex-col gap-3 w-full max-w-md mt-4">
          <button
            onClick={() => nav("/onboarding/test")}
            className="py-4 px-8 text-lg rounded-xl border-none bg-[var(--color-primary)] text-[var(--color-primary-fg)] cursor-pointer font-bold hover:opacity-90 transition-all transform hover:scale-105 shadow-lg"
          >
            테스트 시작하기
          </button>

          <button
            onClick={handleSignupClick}
            className="py-4 px-8 text-lg rounded-xl border-2 border-[var(--color-primary)] bg-[var(--color-surface)] text-[var(--color-fg)] cursor-pointer font-bold hover:bg-[var(--color-bg)] transition-all transform hover:scale-105"
          >
            회원가입
          </button>

          <button
            onClick={() => nav("/login")}
            className="py-4 px-8 text-base rounded-xl border-2 border-[var(--color-muted-foreground)] bg-[var(--color-bg)] font-bold text-[var(--color-fg)] cursor-pointer hover:bg-[var(--color-surface)] transition-all transform hover:scale-105"
          >
            로그인
          </button>
        </div>
      </div>

      {/* 회원가입 확인 모달 */}
      {showSignupModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowSignupModal(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-[360px] rounded-2xl bg-white p-6 shadow-xl text-center"
          >
            <h2 className="text-lg font-bold text-neutral-900 mb-4">
              지금 바로 가입하시겠어요?
            </h2>

            <p className="text-sm text-red-500 mb-6">
              취향을 알려주시면 더 정확한
              <br /> 맛집 추천을 해드릴 수 있어요!
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleTestClick}
                className="flex-1 py-3 px-4 rounded-xl border-2 border-[var(--color-primary)] bg-white text-[var(--color-primary)] font-semibold hover:bg-[var(--color-primary)]/5 transition-colors"
              >
                테스트하기
              </button>
              <button
                onClick={handleConfirmSignup}
                className="flex-1 py-3 px-4 rounded-xl border-none bg-[var(--color-primary)] text-[var(--color-primary-fg)] font-semibold hover:opacity-90 transition-colors"
              >
                회원가입하기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
