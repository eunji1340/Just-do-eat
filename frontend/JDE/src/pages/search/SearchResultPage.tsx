import { useState, useEffect } from "react";
import { TopNavBar } from "@/widgets/top-navbar";
import { RestaurantCard } from "@/entities/restaurant";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useRestaurantSearch } from "@/features/restaurant-search/model/useRestaurantSearch";

export default function SearchResultPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // URL에서 검색어 추출
  const queryFromUrl = searchParams.get("q") || "";

  // 네비바 입력창 제어용
  const [searchQuery, setSearchQuery] = useState(queryFromUrl);

  // 🔥 useRestaurantSearch 훅 적용 (내 변수명으로 맵핑)
  const {
    results,                // 원래 results
    total: totalElements,   // 원래 totalElements
    loading: isLoading,     // 원래 isLoading
    error,
    hasMore,
    loadMore                // handleLoadMore 대체
  } = useRestaurantSearch(queryFromUrl);

  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // 검색어 바뀌면 검색창 반영
  useEffect(() => {
    setSearchQuery(queryFromUrl);
  }, [queryFromUrl]);

  // “더보기” 클릭 시 LoadingMore 스타일 유지
  const handleLoadMore = async () => {
    if (isLoading || isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    await loadMore();
    setIsLoadingMore(false);
  };

  // 검색 실행
  const handleSearch = () => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  // 뒤로가기
  const handleBack = () => navigate(-1);

  // 에러 다시 시도
  const handleRetry = () => {
    navigate(`/search?q=${encodeURIComponent(queryFromUrl)}`, { replace: true });
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

      {/* 메인 콘텐츠 */}
      <div className="bg-body min-h-screen">
        {/* 검색 결과 헤더 - sticky */}
        <div className="sticky top-[57px] bg-white p-4 border-b z-40">
          <p className="text-sm text-gray-600">
            {queryFromUrl ? (
              <>
                <span className="font-semibold text-primary">
                  '{queryFromUrl}'
                </span>{" "}
                검색 결과{" "}
              </>
            ) : (
              <>전체 식당 목록 </>
            )}
            <span className="font-semibold">{totalElements}건</span>
          </p>
        </div>

        {/* 리스트 */}
        <div className="p-4 space-y-3">

          {/* 로딩 */}
          {isLoading && (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          )}

          {/* 에러 */}
          {error && !isLoading && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 mb-3">{error}</p>
              <div className="flex gap-2">
                <button
                  onClick={handleRetry}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
                >
                  다시 시도
                </button>
                <button
                  onClick={handleBack}
                  className="px-4 py-2 bg-white border border-red-300 text-red-700 rounded-lg text-sm hover:bg-red-50 transition-colors"
                >
                  돌아가기
                </button>
              </div>
            </div>
          )}

          {/* 결과 */}
          {!isLoading && !error && (
            <>
              {results.length > 0 ? (
                <>
                  {results.map((restaurant, idx) => (
                    <RestaurantCard
                      key={`${restaurant.restaurant_id}-${idx}`}
                      restaurant={restaurant}
                      onClick={() =>
                        navigate(`/restaurants/${restaurant.restaurant_id}`)
                      }
                    />
                  ))}

                  {/* 더보기 */}
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
                          더보기 ({results.length}/{totalElements})
                        </button>
                      )}
                    </div>
                  )}

                  {/* 마지막 페이지 */}
                  {!hasMore && results.length > 0 && (
                    <div className="py-8 text-center text-gray-500 text-sm">
                      모든 검색 결과를 불러왔습니다 ({totalElements}개)
                    </div>
                  )}
                </>
              ) : (
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
