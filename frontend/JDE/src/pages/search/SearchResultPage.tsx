import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import axios from "axios";
import { TopNavBar } from "@/widgets/top-navbar";
import { RestaurantCard } from "@/entities/restaurant";

// ============================================
// 타입 정의
// ============================================

/**
 * UI용 식당 타입
 */
type MenuItem = {
  name: string;
  price: number;
};

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

/**
 * API 응답 타입 (백엔드에서 받는 형식)
 * - 실제 API 응답 기반으로 작성
 */
type RestaurantSearchResponse = {
  restaurant_id: number;
  kakao_id: number | null;
  name: string;
  address: string;
  category1: string;
  category2: string;
  category3: string | null; // null 가능
  kakao_rating: number; // 0.0 가능
  kakao_review_cnt: number;
  price_range: "LOW" | "MEDIUM" | "HIGH" | "PREMIUM" | null; // null 가능
  image: string | null; // null 가능
};

/**
 * 페이징 응답 구조 (실제 백엔드 응답 형식)
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

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 쿼리 파라미터 문자열 생성
 * - undefined, null, 빈 문자열 자동 제거
 *
 * @example
 * buildQueryString({ query: "치킨", page: 0, tag: undefined })
 * // => "query=치킨&page=0"
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
 * API 응답을 UI용 Restaurant 타입으로 변환
 * @param api - 검색 API 응답 데이터
 * @returns Restaurant 타입 객체
 */
function mapSearchResponseToRestaurant(
  api: RestaurantSearchResponse
): Restaurant {
  // 가격대 변환: LOW → ₩, MEDIUM → ₩₩, HIGH → ₩₩₩, PREMIUM → ₩₩₩₩
  const priceRangeMap: Record<string, string> = {
    LOW: "₩",
    MEDIUM: "₩₩",
    HIGH: "₩₩₩",
    PREMIUM: "₩₩₩₩",
  };

  return {
    restaurant_id: api.restaurant_id,
    name: api.name,
    address: api.address || "",
    phone: "", // API에 없는 필드 - 기본값
    summary: "", // API에 없는 필드 - 기본값

    // 이미지: 단일 문자열 → 배열로 변환 (null 처리)
    image: api.image ? [api.image] : [],

    // 카테고리: 가장 구체적인 것 선택 (category3 > category2 > category1)
    // category3가 null일 수 있으므로 null 체크
    category: api.category3 || api.category2 || api.category1 || "기타",

    // 평점 (0.0일 수 있음)
    rating: api.kakao_rating,

    // 가격대 변환 (null일 수 있음)
    price_range: api.price_range ? priceRangeMap[api.price_range] || "₩₩" : "₩₩",

    // API에 없는 필드 - 기본값
    website_url: "",
    menu: [], // 검색 결과에는 메뉴 정보 없음
    distance_m: 0, // 검색 결과에는 거리 정보 없음
    is_open: true, // 기본값: 영업 중
  };
}

// ============================================
// 메인 컴포넌트
// ============================================

/**
 * 검색 결과 페이지
 * - URL 쿼리 파라미터에서 검색어 추출 (?q=검색어)
 * - 검색 API 호출 및 결과 표시 (이름, 주소만)
 */
export default function SearchResultPage() {
  const navigate = useNavigate();
  const location = useLocation();
  // URL 쿼리 파라미터에서 검색어 추출
  const [searchParams] = useSearchParams();
  const queryFromUrl = searchParams.get("q") || "";

  // 검색어 상태 (네비바 입력창 제어용)
  const [searchQuery, setSearchQuery] = useState(queryFromUrl);

  // 검색 결과 상태
  const [results, setResults] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalElements, setTotalElements] = useState(0);

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // 상태 변경 감지
  useEffect(() => {
    console.log("📊 [상태] isLoading:", isLoading);
    console.log("📊 [상태] error:", error);
    console.log("📊 [상태] results.length:", results.length);
    console.log("📊 [상태] totalElements:", totalElements);
  }, [isLoading, error, results, totalElements]);

  // URL 쿼리가 변경되면 검색어 상태 업데이트
  useEffect(() => {
    setSearchQuery(queryFromUrl);
  }, [queryFromUrl]);

  // 검색어 변경 시 상태 초기화
  useEffect(() => {
    console.log("🔍 [검색] queryFromUrl 변경됨:", queryFromUrl);
    setResults([]);
    setCurrentPage(0);
    setHasMore(true);
    setError(null);
  }, [queryFromUrl, location.state]);

  // 검색 API 호출
  useEffect(() => {
    console.log("🔍 [검색] API 호출 트리거:", {
      queryFromUrl,
      currentPage,
      hasMore,
    });

    // 검색어가 없으면 API 호출 안 함
    if (!queryFromUrl) {
      console.log("🔍 [검색] 검색어 없음 - API 호출 스킵");
      setResults([]);
      setTotalElements(0);
      setIsLoading(false);
      return;
    }

    // 더 이상 로드할 데이터가 없으면 중단
    if (!hasMore && currentPage > 0) {
      console.log("🔍 [검색] 더 이상 로드할 데이터 없음");
      return;
    }

    // AbortController로 요청 취소 관리
    const abortController = new AbortController();
    let isCancelled = false;

    // 타임아웃 타이머 설정 (30초)
    const timeoutId = setTimeout(() => {
      if (!isCancelled) {
        setError("요청 시간이 초과되었습니다. 네트워크 상태를 확인하거나 잠시 후 다시 시도해주세요.");
        setIsLoading(false);
        console.error("🔍 [검색] 타임아웃 (30초)");
      }
    }, 30000);

    const fetchRestaurants = async () => {
      console.log("🔍 [검색] API 호출 시작 - 페이지:", currentPage);

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
        console.log("🔍 [검색] 베이스 URL:", baseURL);

        // ===== 2. 쿼리 파라미터 생성 =====
        const queryString = buildQueryString({
          query: queryFromUrl,
          page: currentPage,
          size: 20,
        });
        console.log("🔍 [검색] 쿼리 문자열:", queryString);

        // ===== 3. axios로 직접 API 호출 =====
        const fullUrl = `${baseURL}/restaurants?${queryString}`;
        console.log("🔍 [검색] 요청 URL:", fullUrl);

        const response = await axios.get<PageResponse<RestaurantSearchResponse>>(
          fullUrl,
          {
            signal: abortController.signal, // 요청 취소 시그널 추가
            timeout: 30000, // 30초 타임아웃
            withCredentials: true, // 쿠키 전송
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        // 타임아웃 타이머 취소
        clearTimeout(timeoutId);

        console.log("🔍 [검색] API 응답 상태:", response.status);
        console.log("🔍 [검색] API 응답 데이터:", response.data);
        console.log("🔍 [검색] 결과 개수:", response.data.content?.length);

        // 요청이 취소된 경우 상태 업데이트 안 함
        if (isCancelled) {
          console.log("🔍 [검색] 요청이 취소됨 - 상태 업데이트 스킵");
          return;
        }

        // ===== 4. API 응답을 Restaurant 타입으로 변환 =====
        console.log("🔍 [검색] 원본 API 응답 content:", response.data.content);

        const mappedResults = response.data.content.map(mapSearchResponseToRestaurant);
        console.log("🔍 [검색] 변환된 결과:", mappedResults);

        // ===== 5. 상태 업데이트 =====
        if (currentPage === 0) {
          // 첫 페이지: 기존 결과 교체
          setResults(mappedResults);
        } else {
          // 추가 페이지: 기존 결과에 추가
          setResults((prev) => [...prev, ...mappedResults]);
        }

        setTotalElements(response.data.totalElements);

        // 마지막 페이지 확인
        const isLastPage = response.data.last;
        setHasMore(!isLastPage);

        console.log("🔍 [검색] 상태 업데이트 완료:", {
          currentPage,
          loadedCount: mappedResults.length,
          totalResults: currentPage === 0 ? mappedResults.length : results.length + mappedResults.length,
          totalElements: response.data.totalElements,
          isLastPage,
          hasMore: !isLastPage,
        });
      } catch (err) {
        // 타임아웃 타이머 취소
        clearTimeout(timeoutId);

        // 요청이 취소된 경우 에러 처리 안 함
        if (isCancelled) {
          console.log("🔍 [검색] 요청이 취소됨 - 에러 처리 스킵");
          return;
        }

        // ===== 에러 처리 =====
        console.error("🔍 [검색] API 오류 발생:", err);

        let errorMessage = "검색 중 오류가 발생했습니다";

        if (axios.isAxiosError(err)) {
          console.error("🔍 [검색] Axios 에러 상세:", {
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
            if (status === 404) {
              errorMessage = "검색 API를 찾을 수 없습니다 (404)";
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
        console.error("🔍 [검색] 최종 에러 메시지:", errorMessage);
      } finally {
        // 요청이 취소되지 않은 경우만 로딩 종료
        if (!isCancelled) {
          setIsLoading(false);
          setIsLoadingMore(false);
          console.log("🔍 [검색] 로딩 종료");
        }
      }
    };

    fetchRestaurants();

    // 클린업: 컴포넌트 언마운트 또는 재검색 시 이전 요청 취소
    return () => {
      isCancelled = true;
      abortController.abort();
      clearTimeout(timeoutId);
      console.log("🔍 [검색] 클린업 실행 - 요청 취소");
    };
  }, [queryFromUrl, location.state, currentPage]); // currentPage 변경 시에도 호출

  /**
   * 다음 페이지 로드 핸들러 (버튼 클릭)
   */
  const handleLoadMore = () => {
    if (isLoading || isLoadingMore || !hasMore) {
      console.log("🔍 [더보기] 로드 불가:", { isLoading, isLoadingMore, hasMore });
      return;
    }

    console.log("🔍 [더보기] 다음 페이지 로드:", currentPage + 1);
    setCurrentPage((prev) => prev + 1);
  };

  /**
   * 검색 실행 핸들러
   * - 로딩 중 중복 방지
   * - 새로운 검색어로 URL 업데이트
   * - 같은 검색어 재검색 지원 (timestamp로 강제 갱신)
   */
  const handleSearch = () => {
    console.log("🔍 [핸들러] handleSearch 호출됨");
    console.log("🔍 [핸들러] searchQuery:", searchQuery);
    console.log("🔍 [핸들러] queryFromUrl:", queryFromUrl);
    console.log("🔍 [핸들러] isLoading:", isLoading);

    // 검색어가 없으면 실행 안 함
    if (!searchQuery.trim()) {
      console.log("🔍 [핸들러] 검색어 없음 - 실행 안 함");
      return;
    }

    // 로딩 중이면 실행 안 함
    if (isLoading) {
      console.log("🔍 [핸들러] 로딩 중 - 실행 안 함");
      return;
    }

    const trimmedQuery = searchQuery.trim();

    // 같은 검색어 재검색: state에 timestamp 추가하여 강제 갱신
    if (trimmedQuery === queryFromUrl) {
      console.log("🔍 [핸들러] 같은 검색어 재검색 - timestamp로 강제 갱신");
      navigate(`/search?q=${encodeURIComponent(trimmedQuery)}`, {
        replace: true,
        state: { timestamp: Date.now() },
      });
    } else {
      // 다른 검색어: 일반 navigate
      console.log("🔍 [핸들러] 새로운 검색어 - URL 업데이트");
      navigate(`/search?q=${encodeURIComponent(trimmedQuery)}`);
    }
  };

  /**
   * 다시 시도 핸들러
   * - 에러 상태 초기화 후 현재 검색어로 재검색
   */
  const handleRetry = () => {
    setError(null);
    // URL을 다시 설정하여 useEffect 트리거
    navigate(`/search?q=${encodeURIComponent(queryFromUrl)}`, { replace: true });
  };

  /**
   * 뒤로가기 핸들러
   */
  const handleBack = () => {
    navigate(-1);
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

          {/* 검색 결과 */}
          {!isLoading && !error && (
            <>
              {results.length > 0 ? (
                <>
                  {console.log("🔍 [렌더링] 결과 표시 중:", results.length, "개")}
                  {results.map((restaurant, index) => (
                    <RestaurantCard
                      key={`${restaurant.restaurant_id}-${index}`}
                      restaurant={restaurant}
                      onClick={() =>
                        console.log(`클릭: ${restaurant.restaurant_id}`)
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
                          더보기 ({results.length}/{totalElements})
                        </button>
                      )}
                    </div>
                  )}

                  {/* 마지막 페이지 메시지 */}
                  {!hasMore && results.length > 0 && (
                    <div className="py-8 text-center text-gray-500 text-sm">
                      모든 검색 결과를 불러왔습니다 ({totalElements}개)
                    </div>
                  )}
                </>
              ) : (
                // 검색 결과가 없을 때
                <>
                  {console.log("🔍 [렌더링] 결과 없음")}
                  <div className="text-center py-20">
                    <p className="text-gray-500 text-lg mb-2">
                      검색 결과가 없습니다
                    </p>
                    <p className="text-gray-400 text-sm">
                      다른 검색어로 시도해보세요
                    </p>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
