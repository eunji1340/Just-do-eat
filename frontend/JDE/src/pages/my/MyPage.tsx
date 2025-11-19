import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { ChevronRight, LogOut, Pencil, Trash2 } from "lucide-react";
import { TopNavBar } from "@/widgets/top-navbar";
import { useUserMe } from "@/features/user/model/useUserMe";
import { useUserStore } from "@/entities/user/model/user-store";
import { useLogout } from "@/features/auth/model/useLogout";
import customAxios from "@/shared/api/http";
import { deleteUser } from "@/features/user/api/deleteUser";

export default function MyPage() {
  const navigate = useNavigate();

  // 로그인 여부 확인 (localStorage의 accessToken)
  const accessToken = localStorage.getItem("accessToken");
  const isLoggedIn = !!accessToken; // 토큰이 있으면 로그인 상태

  const { userData, isLoading, refetch } = useUserMe();
  const { mukbtiResult, setUser } = useUserStore();
  const { logout } = useLogout();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);
  const imageErrorRef = useRef<Set<string>>(new Set());
  const refetchAttemptedRef = useRef<Set<string>>(new Set());

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
      // 이미지 URL이 변경되면 에러 상태 및 refetch 시도 상태 초기화
      if (userData.imageUrl) {
        imageErrorRef.current.delete(userData.imageUrl);
        refetchAttemptedRef.current.delete(userData.imageUrl);
      }
    }
  }, [userData, setUser]);

  // 모달 열릴 때 body 스크롤 잠금 및 ESC 키 처리
  useEffect(() => {
    if (showLogoutModal || showDeleteModal) {
      document.body.style.overflow = "hidden";
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setShowLogoutModal(false);
          setShowDeleteModal(false);
        }
      };
      window.addEventListener("keydown", handleEscape);
      return () => {
        document.body.style.overflow = "unset";
        window.removeEventListener("keydown", handleEscape);
      };
    }
  }, [showLogoutModal, showDeleteModal]);

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

      // 디버깅: presigned URL과 headers 확인
      console.log("[MyPage] Presigned URL:", uploadUrl);
      console.log("[MyPage] Headers from backend:", headers);
      console.log("[MyPage] File type:", file.type);

      // 2. S3에 파일 업로드
      try {
        // S3 presigned URL은 이미 서명에 필요한 모든 정보를 포함하고 있으므로
        // 백엔드에서 받은 headers를 사용하되, Content-Type은 파일 타입으로 설정
        const requestHeaders: Record<string, string> = {
          "Content-Type": file.type || "image/png",
        };

        // 백엔드에서 받은 headers가 있으면 추가 (하지만 Content-Type은 파일 타입 우선)
        if (headers && typeof headers === "object") {
          Object.entries(headers).forEach(([key, value]) => {
            if (key.toLowerCase() !== "content-type" && value) {
              requestHeaders[key] = String(value);
            }
          });
        }

        console.log("[MyPage] Request headers:", requestHeaders);
        console.log(
          "[MyPage] Upload URL (first 100 chars):",
          uploadUrl.substring(0, 100)
        );

        const uploadResponse = await fetch(uploadUrl, {
          method: "PUT",
          headers: requestHeaders,
          body: file,
        });

        console.log("[MyPage] Upload response status:", uploadResponse.status);
        console.log(
          "[MyPage] Upload response headers:",
          Object.fromEntries(uploadResponse.headers.entries())
        );

        if (!uploadResponse.ok) {
          // 403 에러는 CORS 설정 문제 또는 권한 문제
          if (uploadResponse.status === 403) {
            throw new Error(
              "S3 업로드가 거부되었습니다 (403). Network 탭에서 preflight 요청이 403으로 실패하는 것을 확인했습니다.\n\n백엔드 개발자에게 S3 버킷의 CORS 설정을 요청해주세요:\n1. S3 버킷 → Permissions → CORS에 다음 설정 추가:\n   - AllowedOrigins: http://localhost:5173, 프로덕션 도메인\n   - AllowedMethods: PUT, GET, HEAD, OPTIONS\n   - AllowedHeaders: Content-Type, *\n   - ExposeHeaders: ETag\n2. 버킷 정책에서 PUT 권한 확인"
            );
          }
          // CORS 오류인 경우 특별 처리
          if (uploadResponse.status === 0) {
            throw new Error(
              "S3 업로드 중 CORS 오류가 발생했습니다. 백엔드에서 S3 CORS 설정을 확인해주세요."
            );
          }
          throw new Error(
            `이미지 업로드에 실패했습니다. (${uploadResponse.status})`
          );
        }
      } catch (fetchError: any) {
        // 상세한 에러 로깅
        console.error("[MyPage] S3 업로드 에러 상세:", {
          error: fetchError,
          message: fetchError?.message,
          name: fetchError?.name,
          stack: fetchError?.stack,
        });

        // CORS 오류 감지 (preflight 실패 포함)
        const isCorsError =
          fetchError instanceof TypeError &&
          (fetchError.message.includes("fetch") ||
            fetchError.message.includes("CORS") ||
            fetchError.message.includes("Failed to fetch") ||
            fetchError.message.includes("blocked by CORS policy") ||
            fetchError.message.includes("Access-Control-Allow-Origin"));

        if (isCorsError) {
          throw new Error(
            "S3 업로드 중 CORS 오류가 발생했습니다. 백엔드 개발자에게 S3 버킷의 CORS 설정을 요청해주세요.\n\n필요한 CORS 설정:\n- AllowedOrigins: http://localhost:5173 (개발), 프로덕션 도메인\n- AllowedMethods: PUT, GET, HEAD, OPTIONS\n- AllowedHeaders: Content-Type, *\n- ExposeHeaders: ETag"
          );
        }
        // 네트워크 오류
        if (fetchError instanceof TypeError) {
          throw new Error(
            `S3 업로드 중 네트워크 오류가 발생했습니다: ${fetchError.message}`
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

      // 4. users/me를 다시 호출하여 새로운 유효한 S3 URL 받아오기
      const updatedUserData = await refetch();

      // 5. 이미지 URL 업데이트
      if (isMountedRef.current) {
        // 백엔드에서 받은 새로운 유효한 URL 사용
        const newImageUrl = updatedUserData?.imageUrl || publicUrl;
        setCurrentImageUrl(newImageUrl);
        // 새 이미지 URL의 에러 상태 초기화
        if (newImageUrl) {
          imageErrorRef.current.delete(newImageUrl);
        }

        // 미리보기를 실제 URL로 변경
        if (previewUrlRef.current) {
          URL.revokeObjectURL(previewUrlRef.current);
        }
        setPreviewUrl(newImageUrl);
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

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };

  const handleDeleteConfirm = async () => {
    if (isDeleting) return;

    setIsDeleting(true);
    try {
      await deleteUser();
      // 회원 탈퇴 성공 후 로그아웃 처리
      logout();
      setShowDeleteModal(false);
    } catch (error) {
      console.error("회원 탈퇴 실패:", error);
      alert(
        error instanceof Error ? error.message : "회원 탈퇴에 실패했습니다."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <TopNavBar
        variant="label"
        label="마이"
        onSearchClick={handleSearchClick}
      />

      {/* 메인 콘텐츠 */}
      <div className="bg-body min-h-screen">
        {/* 비로그인 사용자 안내 화면 */}
        {!isLoggedIn ? (
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] px-6">
            <div className="text-center space-y-6">
              {/* 안내 문구 */}
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">
                  로그인 후 이용해 주세요
                </h2>
                <p className="text-gray-600">
                  마이페이지는 로그인이 필요합니다
                </p>
              </div>

              {/* 버튼 영역 */}
              <div className="space-y-3 w-full max-w-sm">
                <button
                  onClick={() => navigate("/login")}
                  className="w-full px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                >
                  로그인
                </button>
                <button
                  onClick={() => navigate("/signup")}
                  className="w-full px-6 py-3 bg-white text-primary border-2 border-primary rounded-lg font-semibold hover:bg-primary/5 transition-colors"
                >
                  회원가입
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
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
                            onError={async () => {
                              if (isMountedRef.current && imageUrl) {
                                // 즉시 에러 상태에 추가하여 초성이 바로 보이도록
                                imageErrorRef.current.add(imageUrl);

                                // refetch는 한 번만 시도 (무한 루프 방지)
                                if (
                                  !refetchAttemptedRef.current.has(imageUrl)
                                ) {
                                  refetchAttemptedRef.current.add(imageUrl);

                                  // 백그라운드에서 최신 URL 받아오기 시도
                                  try {
                                    const updatedUserData = await refetch();
                                    if (
                                      updatedUserData?.imageUrl &&
                                      updatedUserData.imageUrl !== imageUrl
                                    ) {
                                      // 새로운 URL이 있으면 업데이트
                                      setCurrentImageUrl(
                                        updatedUserData.imageUrl
                                      );
                                      imageErrorRef.current.delete(
                                        updatedUserData.imageUrl
                                      );
                                      refetchAttemptedRef.current.delete(
                                        updatedUserData.imageUrl
                                      );
                                    }
                                  } catch (error) {
                                    console.error(
                                      "이미지 URL 갱신 실패:",
                                      error
                                    );
                                  }
                                }
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
            <div className="border-t border-gray-100" />
            <button
              onClick={handleDeleteClick}
              className="w-full px-6 py-5 flex items-center justify-between hover:bg-red-50 transition-all group"
            >
              <span className="text-red-600 font-medium group-hover:text-red-700 transition-colors">
                회원 탈퇴
              </span>
              <Trash2
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

      {/* 회원 탈퇴 확인 모달 */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleDeleteCancel();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-[360px] rounded-2xl bg-white p-6 shadow-xl"
          >
            {/* 경고 아이콘 추가 */}             {" "}
            <svg
              className="w-8 h-8 text-red-600 mx-auto mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
                             {" "}
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
                           {" "}
            </svg>
            <h2 className="text-lg font-bold text-neutral-900 mb-2 text-center">
              정말 탈퇴하시겠어요?
            </h2>
            <p className="text-sm text-neutral-600 mb-6 text-center">
              탈퇴하시면 모든 정보가 삭제되며
              <br />
              복구할 수 없어요
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteCancel}
                disabled={isDeleting}
                className="flex-1 py-3 px-4 rounded-xl border-2 border-neutral-300 bg-white text-neutral-700 font-semibold hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                취소
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex-1 py-3 px-4 rounded-xl border-none bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDeleting && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                {isDeleting ? "처리 중..." : "탈퇴하기"}
              </button>
            </div>
          </div>
        </div>
      )}
          </>
        )}
      </div>
    </>
  );
}
