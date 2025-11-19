import React from "react";
import { useNavigate } from "react-router-dom";
import type { AxiosError } from "axios";
import { TopNavBar } from "@/widgets/top-navbar";
import { useUserStore } from "../../entities/user/model/user-store";
import AuthLayout from "@/widgets/auth/AuthLayout";
import SignupForm from "@/features/auth/ui/SignupForm";
import { useSignup } from "@/features/auth/model/useSignup";
import { getUserMe } from "@/features/user/api/getUserMe";

export default function SignupPage() {
  const nav = useNavigate();
  const { resetOnboarding } = useUserStore();
  const {
    formData,
    previewUrl,
    handleChange,
    handleImageSelect,
    submitting,
    error,
    handleSubmit: submit,
    setNameCheckResult,
  } = useSignup();

  const handleSubmit = async (e: React.FormEvent) => {
    const result = await submit(e);
    if (result.success && result.accessToken) {
      // 이미지 업로드가 완료된 후 users/me를 호출하여 새로운 유효한 S3 URL 받아오기
      try {
        const userData = await getUserMe();

        if (userData) {
          const { setUser } = useUserStore.getState();
          setUser({
            userId: userData.userId,
            name: userData.name,
            imageUrl: userData.imageUrl,
            ageGroup: userData.ageGroup,
            gender: userData.gender,
            role: userData.role,
          });
        }
      } catch (error) {
        const axiosError = error as AxiosError<{ message?: string }>;
        console.error("사용자 정보 불러오기 실패:", axiosError);
        // 사용자 정보 불러오기 실패는 무시하고 메인 페이지로 이동
      }

      // 온보딩 정보 초기화
      resetOnboarding();

      // 메인 페이지로 이동
      nav("/", { replace: true });
    }
  };

  return (
    <>
      {/* 상단 네비바 */}
      <TopNavBar
        variant="auth"
        label="회원가입"
        onBack={() => nav("/onboarding/landing")}
      />

      <AuthLayout
        footer={
          <div className="pt-6 border-t border-[var(--color-border)] text-center">
            <p className="text-base text-[var(--color-fg)] font-semibold mb-2">
              이미 계정이 있으신가요?{" "}
              <a
                href="/login"
                onClick={(e) => {
                  e.preventDefault();
                  nav("/login");
                }}
                className="text-[var(--color-primary)] font-bold underline hover:opacity-80 transition-opacity"
              >
                로그인하기
              </a>
            </p>
          </div>
        }
      >
        <div className="w-full min-w-0 overflow-visible">
          <SignupForm
            formData={formData}
            previewUrl={previewUrl}
            handleChange={handleChange}
            handleImageSelect={handleImageSelect}
            submitting={submitting}
            error={error}
            handleSubmit={handleSubmit}
            setNameCheckResult={setNameCheckResult}
          />
        </div>
      </AuthLayout>
    </>
  );
}
