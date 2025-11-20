import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TopNavBar } from "@/widgets/top-navbar";
import { RestaurantCard } from "@/entities/restaurant";
import type { Restaurant } from "@/entities/restaurant/types";
import { getBookmarkRestaurants } from "@/entities/restaurant/api/bookmarkRestaurants";
import { mapBookmarkResponseToRestaurant } from "@/entities/restaurant/model/mappers";

/**
 * 즐겨찾기 페이지
 * - 사용자가 즐겨찾기한 식당 목록 표시
 * - 페이지네이션 지원
 * - 인증 필요 (액세스 토큰)
 */
export default function FavoritesPage() {
  const navigate = useNavigate();

  // 로그인 여부 확인 (localStorage의 accessToken)
  const accessToken = localStorage.getItem("accessToken");
  const isLoggedIn = !!accessToken; // 토큰이 있으면 로그인 상태

  // 즐겨찾기 목록 상태
  const [favorites, setFavorites] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalElements, setTotalElements] = useState(0);

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // 즐겨찾기 API 호출
  useEffect(() => {
    // 로그인하지 않은 경우 API 호출 안 함
    if (!isLoggedIn) {
      console.log("⭐ [즐겨찾기] 로그인 필요 - API 호출 스킵");
      return;
    }

    // 더 이상 로드할 데이터가 없으면 중단
    if (!hasMore && currentPage > 0) {
      console.log("⭐ [즐겨찾기] 더 이상 로드할 데이터 없음");
      return;
    }

    console.log("⭐ [즐겨찾기] API 호출 트리거:", {
      currentPage,
      hasMore,
    });

    let isCancelled = false;

    const fetchFavorites = async () => {
      console.log("⭐ [즐겨찾기] API 호출 시작 - 페이지:", currentPage);

      // 첫 페이지면 일반 로딩, 추가 로드면 isLoadingMore
      if (currentPage === 0) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      setError(null);

      try {
        // 공통 httpClient + buildQueryString 사용하는 API 모듈 호출
        const page = await getBookmarkRestaurants({
          page: currentPage,
          size: 10,
        });

        console.log("⭐ [즐겨찾기] API 응답 데이터:", page);

        if (isCancelled) {
          console.log("⭐ [즐겨찾기] 요청이 취소됨 - 상태 업데이트 스킵");
          return;
        }

        const mappedResults = page.content.map(
          mapBookmarkResponseToRestaurant
        );

        console.log("⭐ [즐겨찾기] 변환된 결과:", mappedResults);

        // 상태 업데이트
        if (currentPage === 0) {
          // 첫 페이지: 기존 결과 교체
          setFavorites(mappedResults);
        } else {
          // 추가 페이지: 기존 결과에 추가
          setFavorites((prev) => [...prev, ...mappedResults]);
        }

        setTotalElements(page.totalElements);
        setHasMore(!page.last);

        console.log("⭐ [즐겨찾기] 상태 업데이트 완료:", {
          currentPage,
          loadedCount: mappedResults.length,
          totalResults:
            currentPage === 0
              ? mappedResults.length
              : favorites.length + mappedResults.length,
          totalElements: page.totalElements,
          isLastPage: page.last,
          hasMore: !page.last,
        });
      } catch (err) {
        if (isCancelled) {
          console.log("⭐ [즐겨찾기] 요청이 취소됨 - 에러 처리 스킵");
          return;
        }

        console.error("⭐ [즐겨찾기] API 오류 발생:", err);

        // 지금은 공통 API 레이어에서 한 번 걸러온다고 보고, 메시지는 심플하게
        let errorMessage = "즐겨찾기 목록을 불러오는 중 오류가 발생했습니다";

        if (err instanceof Error && err.message) {
          // 필요하면 여기서 에러 메시지 매핑 더 세밀하게 가능
          errorMessage = err.message;
        }

        setError(errorMessage);
        console.error("⭐ [즐겨찾기] 최종 에러 메시지:", errorMessage);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
          setIsLoadingMore(false);
          console.log("⭐ [즐겨찾기] 로딩 종료");
        }
      }
    };

    fetchFavorites();

    // 클린업: 컴포넌트 언마운트 혹은 의존성 변경 시
    return () => {
      isCancelled = true;
      console.log("⭐ [즐겨찾기] 클린업 실행 - 요청 취소 플래그");
    };
  }, [currentPage, isLoggedIn]);

  /**
   * 다음 페이지 로드 핸들러 (버튼 클릭)
   */
  const handleLoadMore = () => {
    if (isLoading || isLoadingMore || !hasMore) {
      console.log("⭐ [더보기] 로드 불가:", { isLoading, isLoadingMore, hasMore });
      return;
    }

    console.log("⭐ [더보기] 다음 페이지 로드:", currentPage + 1);
    setCurrentPage((prev) => prev + 1);
  };

  /**
   * 다시 시도 핸들러
   * - 에러 상태 초기화 후 재시도
   */
  const handleRetry = () => {
    setError(null);
    setCurrentPage(0);
    setFavorites([]);
    setHasMore(true);
  };

  /**
   * 검색 버튼 클릭 핸들러
   */
  const handleSearchClick = () => {
    navigate("/search/start");
  };

  return (
    <>
      {/* 상단 네비바 - label 타입 */}
      <TopNavBar
        variant="label"
        label="즐겨찾기"
        onSearchClick={handleSearchClick}
      />

      {/* 메인 콘텐츠 영역 */}
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
                  즐겨찾기 기능은 로그인이 필요합니다
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
            {/* 즐겨찾기 헤더 - 상단 고정 */}
            <div className="sticky top-[57px] bg-white p-4 border-b z-40">
              <p className="text-sm text-gray-600">
                즐겨찾기한 식당 <span className="font-semibold">{totalElements}건</span>
              </p>
            </div>

            {/* 즐겨찾기 목록 */}
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
                  <p className="text-red-600 mb-3">{error}</p>
                  <button
                    onClick={handleRetry}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
                  >
                    다시 시도
                  </button>
                </div>
              )}

              {/* 즐겨찾기 결과 */}
              {!isLoading && !error && (
                <>
                  {favorites.length > 0 ? (
                    <>
                      {console.log("⭐ [렌더링] 결과 표시 중:", favorites.length, "개")}
                      {favorites.map((restaurant, index) => (
                        <RestaurantCard
                          key={`${restaurant.restaurant_id}-${index}`}
                          restaurant={restaurant}
                          onClick={() =>
                            navigate(`/restaurants/${restaurant.restaurant_id}`)
                          }
                        />
                      ))}

                      {/* 더보기 버튼 */}
                      {hasMore && (
                        <div className="py-8 flex justify-center">
                          {isLoadingMore ? (
                            <div className="flex items-center gap-2 text-gray-500">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                              <span>더 불러오는 중...</span>
                            </div>
                          ) : (
                            <button
                              onClick={handleLoadMore}
                              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                            >
                              더보기 ({favorites.length}/{totalElements})
                            </button>
                          )}
                        </div>
                      )}

                      {/* 마지막 페이지 메시지 */}
                      {!hasMore && favorites.length > 0 && (
                        <div className="py-8 text-center text-gray-500 text-sm">
                          모든 즐겨찾기를 불러왔습니다 ({totalElements}개)
                        </div>
                      )}
                    </>
                  ) : (
                    // 즐겨찾기가 없을 때
                    <>
                      {console.log("⭐ [렌더링] 결과 없음")}
                      <div className="text-center py-20">
                        <p className="text-gray-500 text-lg mb-2">
                          즐겨찾기한 식당이 없습니다
                        </p>
                        <p className="text-gray-400 text-sm">
                          마음에 드는 식당을 즐겨찾기해보세요
                        </p>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
