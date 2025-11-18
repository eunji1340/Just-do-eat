import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { ChevronRight, LogOut, Pencil } from "lucide-react";
import { TopNavBar } from "@/widgets/top-navbar";
import { useUserMe } from "@/features/user/model/useUserMe";
import { useUserStore } from "@/entities/user/model/user-store";
import { useLogout } from "@/features/auth/model/useLogout";
import customAxios from "@/shared/api/http";

export default function MyPage() {
  const navigate = useNavigate();
  const { userData, isLoading } = useUserMe();
  const { mukbtiResult, setUser } = useUserStore();
  const { logout } = useLogout();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);
  const imageErrorRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (userData) {
      setUser({
        userId: userData.userId,
        name: userData.name,
        imageUrl: userData.imageUrl,
        ageGroup: userData.ageGroup,
        gender: userData.gender,
        role: userData.role,
      });
      setCurrentImageUrl(userData.imageUrl);
      // 이미지 URL이 변경되면 에러 상태 초기화
      if (userData.imageUrl) {
        imageErrorRef.current.delete(userData.imageUrl);
      }
    }
  }, [userData, setUser]);

  // 모달 열릴 때 body 스크롤 잠금 및 ESC 키 처리
  useEffect(() => {
    if (showLogoutModal) {
      document.body.style.overflow = "hidden";
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setShowLogoutModal(false);
        }
      };
      window.addEventListener("keydown", handleEscape);
      return () => {
        document.body.style.overflow = "unset";
        window.removeEventListener("keydown", handleEscape);
      };
    }
  }, [showLogoutModal]);

  const handleSearchClick = () => {
    navigate("/search/start");
  };

  const handleProfileChange = () => {
    fileInputRef.current?.click();
  };

  const handleImageSelect = async (file: File | null) => {
    // 이미지 제거
    if (file === null) {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
      setPreviewUrl(null);
      previewUrlRef.current = null;
      return;
    }

    // 로컬 미리보기 세팅
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }
    const blobUrl = URL.createObjectURL(file);
    setPreviewUrl(blobUrl);
    previewUrlRef.current = blobUrl;

    // 업로드 시작
    setIsUploading(true);

    try {
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
        presignResponse?.data?.status !== "OK" ||
        !presignResponse?.data?.data
      ) {
        throw new Error("Presigned URL 발급에 실패했습니다.");
      }

      const { uploadUrl, publicUrl, headers } = presignResponse.data.data;

      // 2. S3에 파일 업로드
      try {
        const uploadResponse = await fetch(uploadUrl, {
          method: "PUT",
          headers: {
            "Content-Type": file.type,
            ...(headers || {}),
          },
          body: file,
        });

        if (!uploadResponse.ok) {
          // CORS 오류인 경우 특별 처리
          if (uploadResponse.status === 0 || uploadResponse.status === 403) {
            throw new Error(
              "S3 업로드 중 CORS 오류가 발생했습니다. 백엔드에서 S3 CORS 설정을 확인해주세요."
            );
          }
          throw new Error(
            `이미지 업로드에 실패했습니다. (${uploadResponse.status})`
          );
        }
      } catch (fetchError) {
        // CORS 오류 또는 네트워크 오류
        if (
          fetchError instanceof TypeError &&
          fetchError.message.includes("fetch")
        ) {
          throw new Error(
            "S3 업로드 중 네트워크 오류가 발생했습니다. 백엔드에서 S3 CORS 설정을 확인해주세요."
          );
        }
        throw fetchError;
      }

      // 3. PATCH /users/me/image로 이미지 URL 저장
      await customAxios({
        method: "PATCH",
        url: "/users/me/image",
        data: {
          imageUrl: publicUrl,
        },
        meta: { authRequired: true },
      });

      // 4. 이미지 URL 업데이트
      if (isMountedRef.current) {
        // 로컬 상태 업데이트
        setCurrentImageUrl(publicUrl);
        // 새 이미지 URL의 에러 상태 초기화
        if (publicUrl) {
          imageErrorRef.current.delete(publicUrl);
        }

        // 미리보기를 실제 URL로 변경
        if (previewUrlRef.current) {
          URL.revokeObjectURL(previewUrlRef.current);
        }
        setPreviewUrl(publicUrl);
        previewUrlRef.current = null;
      }
    } catch (error) {
      console.error("프로필 이미지 업로드 실패:", error);
      if (isMountedRef.current) {
        alert(
          error instanceof Error
            ? error.message
            : "프로필 이미지 업로드에 실패했습니다."
        );
        // 실패 시 미리보기 제거
        if (previewUrlRef.current) {
          URL.revokeObjectURL(previewUrlRef.current);
        }
        setPreviewUrl(null);
        previewUrlRef.current = null;
      }
    } finally {
      if (isMountedRef.current) {
        setIsUploading(false);
        // 파일 input 초기화
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    }
  };

  // 컴포넌트 언마운트 시 미리보기 URL 정리
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (previewUrlRef.current) {
        try {
          URL.revokeObjectURL(previewUrlRef.current);
        } catch (error) {
          // 이미 정리된 URL인 경우 무시
          console.warn("URL revoke 실패 (이미 정리됨):", error);
        }
      }
      previewUrlRef.current = null;
    };
  }, []);

  const handleViewTestResult = () => {
    navigate("/onboarding/result");
  };

  const handleRetakeTest = () => {
    navigate("/onboarding/test");
  };

  const handleTermsOfService = () => {
    console.log("서비스 이용약관");
  };

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = () => {
    logout();
    setShowLogoutModal(false);
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
  };

  return (
    <>
      <TopNavBar
        variant="label"
        label="마이"
        onSearchClick={handleSearchClick}
      />

      {/* 메인 콘텐츠 */}
      <div className="px-5 py-6 space-y-6 bg-gradient-to-b from-orange-50/30 to-white min-h-screen">
        {/* 프로필 섹션 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-orange-100">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
                <div className="text-gray-400 text-sm">로딩 중...</div>
              </div>
            </div>
          ) : userData ? (
            <div className="flex flex-col items-center text-center">
              {/* 프로필 이미지 */}
              <div className="relative mb-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleImageSelect(e.target.files?.[0] ?? null)
                  }
                  className="hidden"
                  disabled={isUploading}
                />
                <button
                  onClick={handleProfileChange}
                  disabled={isUploading}
                  className="relative group disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="프로필 변경"
                >
                  <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center overflow-hidden text-white text-2xl font-bold shadow-md ring-2 ring-white transition-all relative">
                    {isUploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-10">
                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                    {(() => {
                      // 미리보기 URL이 있으면 우선 표시
                      if (previewUrl) {
                        return (
                          <img
                            key={`preview-${previewUrl}`}
                            src={previewUrl}
                            alt={userData.name}
                            className="w-full h-full object-cover"
                          />
                        );
                      }

                      // 실제 이미지 URL이 있고 에러가 없으면 표시
                      const imageUrl = currentImageUrl || userData.imageUrl;
                      if (imageUrl && !imageErrorRef.current.has(imageUrl)) {
                        return (
                          <img
                            key={`img-${imageUrl}`}
                            src={imageUrl}
                            alt={userData.name}
                            className="w-full h-full object-cover"
                            onError={() => {
                              if (isMountedRef.current && imageUrl) {
                                imageErrorRef.current.add(imageUrl);
                              }
                            }}
                          />
                        );
                      }

                      // 이미지가 없거나 에러가 있으면 초성 표시
                      return (
                        <span key="initial" className="select-none">
                          {userData.name.slice(0, 1)}
                        </span>
                      );
                    })()}
                  </div>
                  {/* 수정 아이콘 */}
                  {!isUploading && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-neutral-50 flex items-center justify-center border-1 border-primary shadow-md transition-colors">
                      <Pencil
                        className="w-3 h-3 text-primary"
                        strokeWidth={2.5}
                      />
                    </div>
                  )}
                </button>
              </div>

              {/* 사용자 정보 */}
              <h2 className="text-xl font-semibold text-neutral mb-2">
                {userData.name} 님, 반가워요~
              </h2>

              {mukbtiResult ? (
                <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl px-4 py-3 border border-orange-200">
                  <p className="text-base font-bold text-orange-600 mb-1">
                    {mukbtiResult.code}
                  </p>
                  <p className="text-xs text-gray-700 font-medium">
                    {mukbtiResult.label}
                  </p>
                </div>
              ) : (
                <div className="mb-4 bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
                  <p className="text-xs text-gray-500">
                    취향 테스트를 완료해주세요
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-400">
                사용자 정보를 불러올 수 없습니다.
              </div>
            </div>
          )}
        </div>

        {/* 식당 취향 섹션 */}
        <div className="space-y-3">
          <h3 className="text-base font-bold text-gray-700 px-2">식당 취향</h3>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
            <button
              onClick={handleViewTestResult}
              className="w-full px-6 py-5 flex items-center justify-between hover:bg-orange-50 transition-all group"
            >
              <span className="text-gray-900 font-medium group-hover:text-orange-600 transition-colors">
                취향 테스트 결과 보기
              </span>
              <ChevronRight
                className="w-5 h-5 text-gray-400 group-hover:text-orange-500 group-hover:translate-x-1 transition-all"
                strokeWidth={2.5}
              />
            </button>
            <div className="border-t border-gray-100" />
            <button
              onClick={handleRetakeTest}
              className="w-full px-6 py-5 flex items-center justify-between hover:bg-orange-50 transition-all group"
            >
              <span className="text-gray-900 font-medium group-hover:text-orange-600 transition-colors">
                취향 테스트 다시 하기
              </span>
              <ChevronRight
                className="w-5 h-5 text-gray-400 group-hover:text-orange-500 group-hover:translate-x-1 transition-all"
                strokeWidth={2.5}
              />
            </button>
          </div>
        </div>

        {/* 기타 섹션 */}
        <div className="space-y-3">
          <h3 className="text-base font-bold text-gray-700 px-2">기타</h3>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
            <button
              onClick={handleTermsOfService}
              className="w-full px-6 py-5 flex items-center justify-between hover:bg-gray-50 transition-all group"
            >
              <span className="text-gray-900 font-medium group-hover:text-gray-700 transition-colors">
                서비스 이용약관
              </span>
              <ChevronRight
                className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all"
                strokeWidth={2.5}
              />
            </button>
            <div className="border-t border-gray-100" />
            <button
              onClick={handleLogoutClick}
              className="w-full px-6 py-5 flex items-center justify-between hover:bg-red-50 transition-all group"
            >
              <span className="text-red-600 font-medium group-hover:text-red-700 transition-colors">
                로그아웃
              </span>
              <LogOut
                className="w-5 h-5 text-red-600 group-hover:text-red-700 group-hover:translate-x-1 transition-all"
                strokeWidth={2.5}
              />
            </button>
          </div>
        </div>
      </div>

      {/* 로그아웃 확인 모달 */}
      {showLogoutModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleLogoutCancel();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-[360px] rounded-2xl bg-white p-6 shadow-xl"
          >
            <h2 className="text-lg font-bold text-neutral-900 mb-2 text-center">
              로그아웃 하시겠어요?
            </h2>
            <p className="text-sm text-neutral-600 mb-6 text-center">
              다시 로그인하시면 계속 이용하실 수 있어요
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleLogoutCancel}
                className="flex-1 py-3 px-4 rounded-xl border-2 border-neutral-300 bg-white text-neutral-700 font-semibold hover:bg-neutral-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleLogoutConfirm}
                className="flex-1 py-3 px-4 rounded-xl border-none bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
