import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { TopNavBar } from "@/widgets/top-navbar";
import {
  RestaurantCard,
  searchRestaurants,
  mapSearchResponseToRestaurant,
  type Restaurant,
} from "@/entities/restaurant";

/**
 * 검색 결과 페이지
 * - URL 쿼리 파라미터에서 검색어 추출 (?q=검색어)
 * - 검색 API 호출 및 결과 표시
 * - RestaurantCard로 결과 리스트 표시
 */
export default function SearchResultPage() {
  const navigate = useNavigate();
  // URL 쿼리 파라미터에서 검색어 추출
  const [searchParams] = useSearchParams();
  const queryFromUrl = searchParams.get("q") || "";

  // 검색어 상태 (네비바 입력창 제어용)
  const [searchQuery, setSearchQuery] = useState(queryFromUrl);

  // 식당 목록 상태
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalElements, setTotalElements] = useState(0);

  // URL 쿼리가 변경되면 검색어 상태 업데이트
  useEffect(() => {
    setSearchQuery(queryFromUrl);
  }, [queryFromUrl]);

  // 검색 API 호출
  useEffect(() => {
    const fetchRestaurants = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // 검색 API 호출
        const response = await searchRestaurants({
          query: queryFromUrl,
          page: 0,
          size: 20, // 충분한 결과 표시
        });

        // API 응답을 프론트엔드 타입으로 변환
        const mapped = response.content.map(mapSearchResponseToRestaurant);

        setRestaurants(mapped);
        setTotalElements(response.totalElements);
      } catch (err) {
        setError(err instanceof Error ? err.message : "검색 중 오류가 발생했습니다");
        console.error("검색 API 오류:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRestaurants();
  }, [queryFromUrl]);

  /**
   * 검색 실행 핸들러
   * - 새로운 검색어로 URL 업데이트
   */
  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  /**
   * 뒤로가기 핸들러
   * - 검색 시작 페이지 또는 이전 페이지로 이동
   */
  const handleBack = () => {
    navigate(-1);
  };

  /**
   * 식당 카드 클릭 핸들러
   * - 식당 상세 페이지로 이동 (향후 구현)
   */
  const handleRestaurantClick = (restaurantId: number) => {
    // TODO: 식당 상세 페이지 라우트 추가 후 구현
    console.log(`Navigate to restaurant detail: ${restaurantId}`);
    // navigate(`/restaurant/${restaurantId}`);
  };

  return (
    <>
      {/* 검색 네비바 */}
      <TopNavBar
        variant="search"
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onSearch={handleSearch}
        onBack={handleBack}
      />

      {/* 메인 콘텐츠 영역 */}
      <div className="bg-body min-h-screen">
        {/* 검색 결과 헤더 - 상단 고정 */}
        <div className="sticky top-[57px] bg-white p-4 border-b z-40">
          <p className="text-sm text-gray-600">
            {queryFromUrl ? (
              <>
                <span className="font-semibold text-primary">'{queryFromUrl}'</span>{" "}
                검색 결과{" "}
              </>
            ) : (
              <>전체 식당 목록 </>
            )}
            <span className="font-semibold">{totalElements}건</span>
          </p>
        </div>

        {/* 검색 결과 리스트 */}
        <div className="p-4 space-y-3">
          {/* 로딩 상태 */}
          {isLoading && (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          )}

          {/* 에러 상태 */}
          {error && !isLoading && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 mb-2">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="text-red-700 underline text-sm hover:text-red-800"
              >
                다시 시도
              </button>
            </div>
          )}

          {/* 검색 결과 */}
          {!isLoading && !error && (
            <>
              {restaurants.length > 0 ? (
                restaurants.map((restaurant) => (
                  <RestaurantCard
                    key={restaurant.restaurant_id}
                    restaurant={restaurant}
                    onClick={() => handleRestaurantClick(restaurant.restaurant_id)}
                  />
                ))
              ) : (
                // 검색 결과가 없을 때
                <div className="text-center py-20">
                  <p className="text-gray-500 text-lg mb-2">
                    검색 결과가 없습니다
                  </p>
                  <p className="text-gray-400 text-sm">
                    다른 검색어로 시도해보세요
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
