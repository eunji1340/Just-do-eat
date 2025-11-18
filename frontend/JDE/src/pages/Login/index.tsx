import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import type { AxiosError, AxiosResponse } from "axios";
import { TopNavBar } from "@/widgets/top-navbar";
import AuthLayout from "@/widgets/auth/AuthLayout";
import LoginForm from "@/features/auth/ui/LoginForm";
import { useLogin } from "@/features/auth/model/useLogin";
import { useUserStore } from "@/entities/user/model/user-store";
import customAxios from "@/shared/api/http";

type UserMeResponse = {
  status: string;
  code: string;
  message: string;
  data?: {
    userId: number;
    name: string;
    imageUrl: string;
    role: string;
    ageGroup: string;
    gender: string;
    createdAt: string;
    updatedAt: string;
    regionId: number | null;
    regionName: string | null;
  };
};

export default function LoginPage() {
  const nav = useNavigate();
  const { setUser } = useUserStore();
  const [showSignupModal, setShowSignupModal] = useState(false);
  const {
    formData,
    handleChange,
    submitting,
    error,
    handleSubmit: submit,
  } = useLogin();

  // 스크롤 비활성화
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    const result = await submit(e);
    if (result && result.accessToken) {
      // 로그인 성공 후 사용자 정보 불러오기 (선택적)
      // 실패해도 메인 페이지로 이동
      try {
        const response = await customAxios<AxiosResponse<UserMeResponse>>({
          method: "GET",
          url: "/users/me",
        });

        const userData = response.data?.data;

        if (userData) {
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

      // 회원가입 시 저장된 프로필 이미지가 있으면 업로드
      const pendingImage = localStorage.getItem("pendingProfileImage");
      const pendingImageName = localStorage.getItem("pendingProfileImageName");
      const pendingImageType = localStorage.getItem("pendingProfileImageType");

      if (pendingImage && pendingImageName && pendingImageType) {
        try {
          // base64를 Blob으로 변환
          const base64Data = pendingImage.split(",")[1] || pendingImage;
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: pendingImageType });
          const file = new File([blob], pendingImageName, {
            type: pendingImageType,
          });

          // 1. presigned URL 요청
          const presignResponse = (await customAxios({
            method: "POST",
            url: "/files/profile/presign",
            data: {
              fileName: file.name,
              contentType: file.type,
            },
            meta: { authRequired: true },
          })) as any;

          if (
            presignResponse?.data?.status === "OK" &&
            presignResponse?.data?.data
          ) {
            const { uploadUrl, publicUrl, headers } = presignResponse.data.data;

            // 2. S3에 파일 업로드
            const uploadResponse = await fetch(uploadUrl, {
              method: "PUT",
              headers: {
                "Content-Type": file.type,
                ...(headers || {}),
              },
              body: file,
            });

            if (uploadResponse.ok) {
              // 3. PATCH /users/me/image로 이미지 URL 저장
              await customAxios({
                method: "PATCH",
                url: "/users/me/image",
                data: {
                  imageUrl: publicUrl,
                },
                meta: { authRequired: true },
              });

              // localStorage에서 제거
              localStorage.removeItem("pendingProfileImage");
              localStorage.removeItem("pendingProfileImageName");
              localStorage.removeItem("pendingProfileImageType");
            }
          }
        } catch (imageError) {
          console.error("프로필 이미지 업로드 실패:", imageError);
          // 이미지 업로드 실패해도 로그인은 성공으로 처리
        }
      }

      // 로그인 성공 후 메인 페이지로 리다이렉트
      nav("/", { replace: true });
    }
  };

  return (
    <>
      {/* 상단 네비바 */}
      <TopNavBar
        variant="auth"
        label="로그인"
        onBack={() => nav("/onboarding/landing")}
      />

      <AuthLayout
        footer={
          <div className="mt-6 pt-6 border-t border-[var(--color-border)] text-center">
            <p className="text-base text-[var(--color-fg)] font-semibold mb-2">
              계정이 없으신가요?{" "}
              <a
                href="/signup"
                onClick={(e) => {
                  e.preventDefault();
                  handleSignupClick();
                }}
                className="text-[var(--color-primary)] font-bold underline hover:opacity-80 transition-opacity"
              >
                회원가입하기
              </a>
            </p>
          </div>
        }
      >
        {/* 로고 */}
        <div className="flex justify-center mb-4 mt-8">
          <img
            src="/logo2_primary.png"
            alt="JUST DO EAT"
            className="h-40 sm:h-32 object-contain"
          />
        </div>

        <LoginForm
          formData={formData}
          handleChange={handleChange}
          submitting={submitting}
          error={error}
          handleSubmit={handleSubmit}
        />
      </AuthLayout>

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
