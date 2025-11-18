import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Search, Bell, ChevronRight, LogOut, Pencil } from "lucide-react";
import { useUserMe } from "@/features/user/model/useUserMe";
import { useUserStore } from "@/entities/user/model/user-store";
import { useLogout } from "@/features/auth/model/useLogout";

export default function MyPage() {
  const navigate = useNavigate();
  const { userData, isLoading } = useUserMe();
  const { mukbtiResult, setUser } = useUserStore();
  const { logout } = useLogout();

  // 사용자 정보를 스토어에 업데이트
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
    }
  }, [userData, setUser]);

  const handleSearchClick = () => {
    navigate("/search/start");
  };

  const handleNotificationClick = () => {
    // TODO: 알림 페이지로 이동
    console.log("알림 클릭");
  };

  const handleNicknameSetting = () => {
    // TODO: 닉네임 설정 모달/페이지
    console.log("닉네임 설정");
  };

  const handleViewTestResult = () => {
    // TODO: 취향 테스트 결과 보기
    navigate("/onboarding/result");
  };

  const handleRetakeTest = () => {
    // TODO: 취향 테스트 다시 하기
    navigate("/onboarding/test");
  };

  const handleTermsOfService = () => {
    // TODO: 서비스 이용약관 페이지
    console.log("서비스 이용약관");
  };

  const handleLogout = () => {
    if (confirm("로그아웃 하시겠습니까?")) {
      logout();
    }
  };

  return (
    <>
      {/* 상단 네비바 - 커스텀 헤더 */}
      <header className="py-2 px-5 flex items-center bg-white border-b border-gray-200 sticky top-0 z-50">
        <h1 className="text-xl font-semibold text-gray-900">마이</h1>

        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={handleSearchClick}
            aria-label="검색"
            className="text-gray-700 hover:text-gray-900 transition-colors"
          >
            <Search className="w-6 h-6" strokeWidth={2} />
          </button>
          <button
            onClick={handleNotificationClick}
            aria-label="알림"
            className="text-gray-700 hover:text-gray-900 transition-colors"
          >
            <Bell className="w-6 h-6" strokeWidth={2} />
          </button>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <div className="px-5 py-6 space-y-6 bg-gray-50 min-h-screen">
        {/* 프로필 섹션 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-400">로딩 중...</div>
            </div>
          ) : userData ? (
            <div className="flex items-start gap-4">
              {/* 프로필 이미지 */}
              <div className="w-20 h-20 rounded-full bg-orange-400 flex-shrink-0 flex items-center justify-center overflow-hidden">
                {userData.imageUrl ? (
                  <img
                    src={userData.imageUrl}
                    alt={userData.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-orange-400" />
                )}
              </div>

              {/* 사용자 정보 */}
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  {userData.name} 님, 반가워요~
                </h2>
                {mukbtiResult && (
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">{mukbtiResult.code}</p>
                    <p className="text-sm text-gray-600">
                      {mukbtiResult.label}
                    </p>
                  </div>
                )}
                {!mukbtiResult && (
                  <p className="text-sm text-gray-400">
                    취향 테스트를 완료해주세요
                  </p>
                )}
              </div>

              {/* 닉네임 설정 버튼 */}
              <button
                onClick={handleNicknameSetting}
                className="flex items-center gap-1 px-3 py-1.5 border border-orange-500 rounded-lg text-orange-500 text-sm font-medium hover:bg-orange-50 transition-colors flex-shrink-0"
              >
                <Pencil className="w-4 h-4" strokeWidth={2} />
                <span>닉네임 설정</span>
              </button>
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
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-500 px-1">식당 취향</h3>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <button
              onClick={handleViewTestResult}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <span className="text-gray-900">취향 테스트 결과 보기</span>
              <ChevronRight className="w-5 h-5 text-gray-400" strokeWidth={2} />
            </button>
            <div className="border-t border-gray-100" />
            <button
              onClick={handleRetakeTest}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <span className="text-gray-900">취향 테스트 다시 하기</span>
              <ChevronRight className="w-5 h-5 text-gray-400" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* 기타 섹션 */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-500 px-1">기타</h3>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <button
              onClick={handleTermsOfService}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <span className="text-gray-900">서비스 이용약관</span>
              <ChevronRight className="w-5 h-5 text-gray-400" strokeWidth={2} />
            </button>
            <div className="border-t border-gray-100" />
            <button
              onClick={handleLogout}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-red-600"
            >
              <span>로그아웃</span>
              <LogOut className="w-5 h-5" strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
