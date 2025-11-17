import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { TopNavBar } from "@/widgets/top-navbar";
import { RestaurantCard } from "@/entities/restaurant";

// ============================================
// 타입 정의
// ============================================

/**
 * 즐겨찾기 API 응답 - 메뉴 정보
 */
type BookmarkMenuResponse = {
  name: string;
  price: number;
  is_recommend: boolean;
  is_ai_mate: boolean;
};

/**
 * 즐겨찾기 API 응답 - 식당 정보
 */
type BookmarkRestaurantResponse = {
  restaurant_id: number;
  name: string;
  category1: string;
  category2: string;
  category3: string;
  menu: BookmarkMenuResponse[];
  saved_count: number;
  image: string[];
};

/**
 * 페이징 응답 구조 (백엔드 응답 형식)
 */
type PageResponse<T> = {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  totalElements: number;
  totalPages: number;
  last: boolean;
  size: number;
  number: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  numberOfElements: number;
  first: boolean;
  empty: boolean;
};

/**
 * UI용 MenuItem 타입
 */
type MenuItem = {
  name: string;
  price: number;
};

/**
 * UI용 Restaurant 타입
 */
type Restaurant = {
  restaurant_id: number;
  name: string;
  address: string;
  phone: string;
  summary: string;
  image: string[];
  category: string;
  rating: number;
  price_range: string;
  website_url: string;
  menu: MenuItem[];
  distance_m: number;
  is_open: boolean;
};

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 쿼리 파라미터 문자열 생성
 * - undefined, null, 빈 문자열 자동 제거
 */
function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    // undefined, null, 빈 문자열 제거
    if (value === undefined || value === null || value === "") {
      return;
    }

    // 배열 처리
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null && item !== "") {
          searchParams.append(key, String(item));
        }
      });
      return;
    }

    // 숫자, 불리언, 문자열
    searchParams.append(key, String(value));
  });

  return searchParams.toString();
}

/**
 * 즐겨찾기 API 응답을 UI용 Restaurant 타입으로 변환
 * @param api - 즐겨찾기 API 응답 데이터
 * @returns Restaurant 타입 객체
 */
function mapBookmarkResponseToRestaurant(
  api: BookmarkRestaurantResponse
): Restaurant {
  return {
    restaurant_id: api.restaurant_id,
    name: api.name,
    address: "", // API에 없는 필드 - 기본값
    phone: "", // API에 없는 필드 - 기본값
    summary: "", // API에 없는 필드 - 기본값

    // 이미지: 이미 배열 형태
    image: api.image || [],

    // 카테고리: 가장 구체적인 것 선택 (category3 > category2 > category1)
    category: api.category3 || api.category2 || api.category1 || "기타",

    // 평점 (API에 없음)
    rating: 0,

    // 가격대 (API에 없음)
    price_range: "₩₩",

    // API에 없는 필드 - 기본값
    website_url: "",
    menu: api.menu.map((m) => ({ name: m.name, price: m.price })),
    distance_m: 0,
    is_open: true,
  };
}

// ============================================
// 메인 컴포넌트
// ============================================

/**
 * 즐겨찾기 페이지
 * - 사용자가 즐겨찾기한 식당 목록 표시
 * - 페이지네이션 지원
 * - 인증 필요 (액세스 토큰)
 */
export default function FavoritesPage() {
  const navigate = useNavigate();

  // 로그인 여부 확인 (임시 토큰 또는 localStorage의 accessToken)
  const tempAccessToken =
    "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIiwiaWF0IjoxNzYzMzU2OTYxLCJleHAiOjE3NjMzNjA1NjF9.qgYeoPksV3ao9ZbAvJbFzX4L14uKHxqc3UrmWjd3q28";
  const accessToken = localStorage.getItem("accessToken") || tempAccessToken;
  const isLoggedIn = !!accessToken; // 토큰이 있으면 로그인 상태

  // 즐겨찾기 목록 상태
  const [favorites, setFavorites] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalElements, setTotalElements] = useState(0);

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // 즐겨찾기 API 호출
  useEffect(() => {
    // 로그인하지 않은 경우 API 호출 안 함
    if (!isLoggedIn) {
      console.log("⭐ [즐겨찾기] 로그인 필요 - API 호출 스킵");
      return;
    }

    console.log("⭐ [즐겨찾기] API 호출 트리거:", {
      currentPage,
      hasMore,
    });

    // 더 이상 로드할 데이터가 없으면 중단
    if (!hasMore && currentPage > 0) {
      console.log("⭐ [즐겨찾기] 더 이상 로드할 데이터 없음");
      return;
    }

    // AbortController로 요청 취소 관리
    const abortController = new AbortController();
    let isCancelled = false;

    // 타임아웃 타이머 설정 (30초)
    const timeoutId = setTimeout(() => {
      if (!isCancelled) {
        setError(
          "요청 시간이 초과되었습니다. 네트워크 상태를 확인하거나 잠시 후 다시 시도해주세요."
        );
        setIsLoading(false);
        console.error("⭐ [즐겨찾기] 타임아웃 (30초)");
      }
    }, 30000);

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
        // ===== 1. API 엔드포인트 설정 (하드코딩) =====
        const baseURL = "http://k13a701.p.ssafy.io/api";
        console.log("⭐ [즐겨찾기] 베이스 URL:", baseURL);

        // ===== 2. 쿼리 파라미터 생성 =====
        const queryString = buildQueryString({
          page: currentPage,
          size: 10, // 페이지 크기
        });
        console.log("⭐ [즐겨찾기] 쿼리 문자열:", queryString);

        // ===== 3. axios로 직접 API 호출 =====
        const fullUrl = `${baseURL}/restaurants/bookmarks?${queryString}`;
        console.log("⭐ [즐겨찾기] 요청 URL:", fullUrl);

        const response = await axios.get<
          PageResponse<BookmarkRestaurantResponse>
        >(fullUrl, {
          signal: abortController.signal, // 요청 취소 시그널 추가
          timeout: 30000, // 30초 타임아웃
          withCredentials: true, // 쿠키 전송
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        });

        // 타임아웃 타이머 취소
        clearTimeout(timeoutId);

        console.log("⭐ [즐겨찾기] API 응답 상태:", response.status);
        console.log("⭐ [즐겨찾기] API 응답 데이터:", response.data);
        console.log(
          "⭐ [즐겨찾기] 결과 개수:",
          response.data.content?.length
        );

        // 요청이 취소된 경우 상태 업데이트 안 함
        if (isCancelled) {
          console.log("⭐ [즐겨찾기] 요청이 취소됨 - 상태 업데이트 스킵");
          return;
        }

        // ===== 4. API 응답을 Restaurant 타입으로 변환 =====
        console.log("⭐ [즐겨찾기] 원본 API 응답 content:", response.data.content);

        const mappedResults = response.data.content.map(
          mapBookmarkResponseToRestaurant
        );
        console.log("⭐ [즐겨찾기] 변환된 결과:", mappedResults);

        // ===== 5. 상태 업데이트 =====
        if (currentPage === 0) {
          // 첫 페이지: 기존 결과 교체
          setFavorites(mappedResults);
        } else {
          // 추가 페이지: 기존 결과에 추가
          setFavorites((prev) => [...prev, ...mappedResults]);
        }

        setTotalElements(response.data.totalElements);

        // 마지막 페이지 확인
        const isLastPage = response.data.last;
        setHasMore(!isLastPage);

        console.log("⭐ [즐겨찾기] 상태 업데이트 완료:", {
          currentPage,
          loadedCount: mappedResults.length,
          totalResults:
            currentPage === 0
              ? mappedResults.length
              : favorites.length + mappedResults.length,
          totalElements: response.data.totalElements,
          isLastPage,
          hasMore: !isLastPage,
        });
      } catch (err) {
        // 타임아웃 타이머 취소
        clearTimeout(timeoutId);

        // 요청이 취소된 경우 에러 처리 안 함
        if (isCancelled) {
          console.log("⭐ [즐겨찾기] 요청이 취소됨 - 에러 처리 스킵");
          return;
        }

        // ===== 에러 처리 =====
        console.error("⭐ [즐겨찾기] API 오류 발생:", err);

        let errorMessage = "즐겨찾기 목록을 불러오는 중 오류가 발생했습니다";

        if (axios.isAxiosError(err)) {
          console.error("⭐ [즐겨찾기] Axios 에러 상세:", {
            message: err.message,
            code: err.code,
            status: err.response?.status,
            statusText: err.response?.statusText,
            responseData: err.response?.data,
          });

          // 네트워크 에러
          if (err.code === "ERR_NETWORK") {
            errorMessage = "네트워크 연결을 확인해주세요";
          }
          // 타임아웃
          else if (err.code === "ECONNABORTED" || err.message.includes("timeout")) {
            errorMessage = "요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요";
          }
          // HTTP 에러
          else if (err.response) {
            const status = err.response.status;
            if (status === 401) {
              errorMessage = "로그인이 필요합니다";
            } else if (status === 404) {
              errorMessage = "즐겨찾기 API를 찾을 수 없습니다 (404)";
            } else if (status === 500) {
              errorMessage = "서버 오류가 발생했습니다 (500)";
            } else {
              errorMessage = `서버 오류 (${status}): ${err.response.statusText}`;
            }
          }
        } else if (err instanceof Error) {
          errorMessage = err.message;
        }

        setError(errorMessage);
        console.error("⭐ [즐겨찾기] 최종 에러 메시지:", errorMessage);
      } finally {
        // 요청이 취소되지 않은 경우만 로딩 종료
        if (!isCancelled) {
          setIsLoading(false);
          setIsLoadingMore(false);
          console.log("⭐ [즐겨찾기] 로딩 종료");
        }
      }
    };

    fetchFavorites();

    // 클린업: 컴포넌트 언마운트 또는 재검색 시 이전 요청 취소
    return () => {
      isCancelled = true;
      abortController.abort();
      clearTimeout(timeoutId);
      console.log("⭐ [즐겨찾기] 클린업 실행 - 요청 취소");
    };
  }, [currentPage]); // currentPage 변경 시에도 호출

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
