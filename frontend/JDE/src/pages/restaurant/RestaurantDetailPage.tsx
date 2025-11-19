import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { TopNavBar } from "@/widgets/top-navbar";
import { useRestaurantDetail } from "./api/useRestaurantDetail";
import RestaurantHeader from "./ui/RestaurantHeader";
import RestaurantBasicInfo from "./ui/RestaurantBasicInfo";
import RestaurantMenu from "./ui/RestaurantMenu";
import RestaurantLocation from "./ui/RestaurantLocation";
import FloatingActionButtons from "@/features/restaurant/ui/FloatingActionButtons";

// ============================================
// 메인 컴포넌트
// ============================================

/**
 * 식당 상세 페이지
 * - 식당 정보, 메뉴, 영업시간 등 표시
 * - 비회원 접근 가능
 */
export default function RestaurantDetailPage() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // 피드에서 진입했는지 확인
  const fromFeed = location.state?.fromFeed || false;

  // 커스텀 훅으로 식당 상세 정보 조회
  const { restaurant, isLoading, error } = useRestaurantDetail(restaurantId);

  // 슬라이드 애니메이션 상태
  const [isVisible, setIsVisible] = useState(false);

  // 마운트 후 슬라이드 업 애니메이션 트리거
  useEffect(() => {
    // 약간의 지연 후 애니메이션 시작 (DOM 렌더링 보장)
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 10);

    return () => clearTimeout(timer);
  }, []);

  /**
   * 공유 버튼 클릭 핸들러
   */
  const handleShare = async () => {
    if (!restaurant) return;

    const shareData = {
      title: restaurant.name,
      text: `${restaurant.name} - ${restaurant.kakao_summary.title}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        console.log("🍴 [공유] 성공");
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert("링크가 복사되었습니다!");
      }
    } catch (err) {
      console.error("🍴 [공유] 실패:", err);
    }
  };

  /**
   * 네비게이션 핸들러들
   */
  const handleSearchClick = () => navigate("/search/start");
  const handleBack = () => navigate(-1);
  const handleHomeClick = () => navigate("/");

  return (
    <div className="min-h-screen flex justify-center bg-body">
      {/* 상단 네비바 - fixed (스크롤해도 상단 고정) */}
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-center bg-transparent pointer-events-none">
        <div className="w-full min-w-[320px] sm:max-w-[640px] pointer-events-auto">
          <TopNavBar
            variant="simple"
            onBack={handleBack}
            onHomeClick={handleHomeClick}
            onSearchClick={handleSearchClick}
          />
        </div>
      </div>

      {/* 메인 콘텐츠 컨테이너 - AppLayout과 동일한 제한 */}
      <div
        className={`relative w-full min-w-[320px] sm:max-w-[640px] shadow-sm min-h-screen transition-transform duration-500 ease-out ${
          isVisible ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* 메인 콘텐츠 영역 */}
        <div className="relative min-h-screen">
          {/* 로딩 상태 */}
          {isLoading && (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          )}

          {/* 에러 상태 */}
          {error && !isLoading && (
            <div className="p-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
                <p className="text-red-600 mb-3">{error}</p>
                <button
                  onClick={handleBack}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
                >
                  돌아가기
                </button>
              </div>
            </div>
          )}

          {/* 식당 정보 */}
          {!isLoading && !error && restaurant && (
            <div className="space-y-3 pb-8">
              <div className="relative -mt-8 bg-white rounded-t-lg z-10">
                <RestaurantHeader
                  restaurant={restaurant}
                  onShare={handleShare}
                />
                <hr className="mx-5 border-neutral-300" />
                <RestaurantBasicInfo restaurant={restaurant} />
              </div>
              <RestaurantMenu menu={restaurant.menu} />
              <RestaurantLocation restaurant={restaurant} />
            </div>
          )}
        </div>
      </div>

      {/* 우하단 플로팅 버튼 (식당 정보가 로드된 경우에만 표시) - fixed이므로 메인 컨텐츠 밖에 배치 */}
      {!isLoading && !error && restaurant && (
        <FloatingActionButtons
          restaurantId={restaurant.restaurant_id}
          showBackToFeed={fromFeed}
          isVisible={isVisible}
        />
      )}
    </div>
  );
}
