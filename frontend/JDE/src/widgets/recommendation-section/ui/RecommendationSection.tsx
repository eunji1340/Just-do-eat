// src/widgets/recommendation-section/ui/RecommendationSection.tsx
// 목적: 메인 페이지 추천 식당 섹션 (Top10 + 음식 종류별)

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  TrendingUp,
  UtensilsCrossed,
  Soup,
  Fish,
  Wine,
  Pizza,
  Coffee,
  Salad,
  Drumstick,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { RankingCard, CategoryCard } from "@/shared/ui/card";
import { HorizontalScrollContainer } from "@/shared/ui/scroll-container";
import { categoryMockData } from "../model/mockData";

// ============================================
// 타입 정의
// ============================================

/**
 * 인기 식당 API 응답 타입
 */
type PopularRestaurantResponse = {
  restaurant_id: number;
  kakao_id: number;
  name: string;
  address: string;
  category1: string;
  category2: string;
  category3: string | null;
  kakao_rating: number;
  kakao_review_cnt: number;
  price_range: "LOW" | "MEDIUM" | "HIGH" | "PREMIUM";
  image: string | null;
  bookmarked: boolean | null;
};

/**
 * UI용 랭킹 카드 타입
 */
type RankingCardData = {
  id: number;
  rank: number;
  restaurantName: string;
  category: string;
  imageUrl?: string;
  location?: string;
};

// ============================================
// 유틸리티 함수
// ============================================

/**
 * API 응답을 UI용 랭킹 카드 타입으로 변환
 * @param api - 인기 식당 API 응답 데이터
 * @param rank - 순위 (1~10)
 * @returns RankingCardData 타입 객체
 */
function mapPopularResponseToRankingCard(
  api: PopularRestaurantResponse,
  rank: number
): RankingCardData {
  return {
    id: api.restaurant_id,
    rank,
    restaurantName: api.name,
    // 카테고리: 가장 구체적인 것 선택 (category3 > category2 > category1)
    category: api.category2 || api.category1 || "기타",
    // 이미지: null이면 undefined로 변환 (placeholder 표시)
    imageUrl: api.image || undefined,
    // 주소에서 구 이름 추출 (예: "서울 강남구 테헤란로..." → "강남구")
    location: api.address.split(" ")[1] || "",
  };
}

/**
 * 카테고리별 아이콘 매핑
 */
const categoryIconMap: Record<string, LucideIcon> = {
  한식: Soup,
  중식: UtensilsCrossed,
  일식: Fish,
  양식: Wine,
  분식: Salad,
  치킨: Drumstick,
  패스트푸드: Pizza,
  디저트: Coffee,
  샐러드: Salad,
  "아시아/퓨전": Fish,
  "뷔페/패밀리": UtensilsCrossed,
  술집: Wine,
};

interface RecommendationSectionProps {
  /** 선택된 상권 이름 */
  districtName?: string;
}

/**
 * 추천 식당 리스트 섹션
 * - 상권 인기식당 Top10 (API 연결)
 * - 음식 종류별 Best
 */
export default function RecommendationSection({
  districtName = "역삼역",
}: RecommendationSectionProps) {
  const navigate = useNavigate();

  // 인기 식당 상태
  const [popularRestaurants, setPopularRestaurants] = useState<
    RankingCardData[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 인기 식당 API 호출
  useEffect(() => {
    const abortController = new AbortController();
    let isCancelled = false;

    const fetchPopularRestaurants = async () => {
      console.log("🔥 [인기식당] API 호출 시작");
      setIsLoading(true);
      setError(null);

      try {
        // ===== API 호출 =====
        const baseURL =
          import.meta.env.VITE_API_BASE_URL || "https://justdoeat.ai.kr/api/";
        const fullUrl = `${baseURL}main/restaurants/popular`;
        console.log("🔥 [인기식당] 요청 URL:", fullUrl);

        const response = await axios.get<PopularRestaurantResponse[]>(fullUrl, {
          signal: abortController.signal,
          timeout: 30000,
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        });

        // console.log("🔥 [인기식당] API 응답:", response.data);
        // console.log("🔥 [인기식당] 응답 타입:", typeof response.data);
        // console.log("🔥 [인기식당] 배열 여부:", Array.isArray(response.data));

        // 요청이 취소된 경우 상태 업데이트 안 함
        if (isCancelled) {
          // console.log("🔥 [인기식당] 요청이 취소됨");
          return;
        }

        // ===== 배열 검증 =====
        if (!Array.isArray(response.data)) {
          console.error(
            // "🔥 [인기식당] API 응답이 배열이 아닙니다:",
            response.data
          );
          throw new Error("잘못된 응답 형식입니다. 배열이 아닙니다.");
        }

        // console.log("🔥 [인기식당] 결과 개수:", response.data.length);

        // ===== API 응답을 UI 타입으로 변환 (순위 부여) =====
        const mappedResults = response.data.map((restaurant, index) =>
          mapPopularResponseToRankingCard(restaurant, index + 1)
        );

        // console.log("🔥 [인기식당] 변환된 결과:", mappedResults);
        setPopularRestaurants(mappedResults);
      } catch (err) {
        // 요청이 취소된 경우 에러 처리 안 함
        if (isCancelled) {
          // console.log("🔥 [인기식당] 요청이 취소됨 - 에러 처리 스킵");
          return;
        }

        console.error("🔥 [인기식당] API 오류:", err);

        let errorMessage = "인기 식당을 불러오는 중 오류가 발생했습니다";

        if (axios.isAxiosError(err)) {
          if (err.code === "ERR_NETWORK") {
            errorMessage = "네트워크 연결을 확인해주세요";
          } else if (
            err.code === "ECONNABORTED" ||
            err.message.includes("timeout")
          ) {
            errorMessage = "요청 시간이 초과되었습니다";
          } else if (err.response) {
            const status = err.response.status;
            if (status === 404) {
              errorMessage = "인기 식당 API를 찾을 수 없습니다 (404)";
            } else if (status === 500) {
              errorMessage = "서버 오류가 발생했습니다 (500)";
            }
          }
        }

        setError(errorMessage);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchPopularRestaurants();

    // 클린업
    return () => {
      isCancelled = true;
      abortController.abort();
      console.log("🔥 [인기식당] 클린업 실행");
    };
  }, []); // 컴포넌트 마운트 시 한 번만 호출

  /**
   * 카테고리 클릭 핸들러
   * 피드 페이지로 이동하며 카테고리명(한글)을 쿼리 파라미터로 전달
   */
  const handleCategoryClick = (categoryName: string) => {
    console.log("🍽️ [카테고리 클릭]", categoryName);
    navigate(`/feed?category=${encodeURIComponent(categoryName)}&mock=true`);
  };

  /**
   * 식당 클릭 핸들러
   * 식당 상세 페이지로 이동
   */
  const handleRestaurantClick = (restaurantId: string | number) => {
    navigate(`/restaurants/${restaurantId}`);
  };

  return (
    <div className="bg-surface space-y-12 px-6 pt-6 pb-8">
      {/* 1. 상권 인기식당 Top10 */}
      <section>
        {/* 섹션 헤더 */}
        <div className="flex items-center gap-3 mb-3">
          <TrendingUp className="w-6 h-6 text-primary" />
          <h2 className="text-lg font-bold">{districtName} 인기 식당 Top10</h2>
        </div>

        {/* 로딩 상태 */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        )}

        {/* 에러 상태 */}
        {error && !isLoading && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* 가로 스크롤 카드 리스트 */}
        {!isLoading && !error && (
          <HorizontalScrollContainer>
            {popularRestaurants.length > 0 ? (
              popularRestaurants.map((restaurant) => (
                <RankingCard
                  key={restaurant.id}
                  {...restaurant}
                  onClick={() => handleRestaurantClick(restaurant.id)}
                />
              ))
            ) : (
              <div className="w-full text-center py-8 text-gray-500">
                인기 식당 정보가 없습니다
              </div>
            )}
          </HorizontalScrollContainer>
        )}
      </section>

      {/* 2. 음식 종류별 Best */}
      <section>
        {/* 섹션 헤더 */}
        <div className="flex items-center gap-3 mb-3">
          <UtensilsCrossed className="w-6 h-6 text-primary" />
          <h2 className="text-lg font-bold">골라먹는 {districtName} 맛집</h2>
        </div>

        {/* 그리드 레이아웃 - 배민 스타일 카테고리 선택 */}
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-y-4 justify-items-center">
          {categoryMockData.map((category) => (
            <CategoryCard
              key={category.id}
              id={category.id}
              categoryName={category.categoryName}
              icon={categoryIconMap[category.categoryName]}
              onClick={() => handleCategoryClick(category.categoryName)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
