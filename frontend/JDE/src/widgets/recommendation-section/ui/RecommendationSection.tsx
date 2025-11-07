// src/widgets/recommendation-section/ui/RecommendationSection.tsx
// 목적: 메인 페이지 추천 식당 섹션 (Top10 + 음식 종류별)

import { useNavigate } from "react-router-dom";
import { TrendingUp, UtensilsCrossed } from "lucide-react";
import { RankingCard, CategoryCard } from "@/shared/ui/card";
import { HorizontalScrollContainer } from "@/shared/ui/scroll-container";
import { rankingMockData, categoryMockData } from "../model/mockData";

/**
 * 추천 식당 리스트 섹션
 * - 상권 인기식당 Top10
 * - 음식 종류별 Best
 */
export default function RecommendationSection() {
  const navigate = useNavigate();

  /**
   * 카테고리 클릭 핸들러
   * 스와이프 페이지로 이동하며 필터 정보 전달
   */
  const handleCategoryClick = (categoryId: string, categoryName: string) => {
    navigate("/swipe", {
      state: {
        type: "category",
        categoryId,
        categoryName,
        location: "강남역", // TODO: 실제 선택된 상권으로 변경
      },
    });
  };

  /**
   * 식당 클릭 핸들러
   * 식당 상세 페이지로 이동
   */
  const handleRestaurantClick = (restaurantId: string | number) => {
    navigate(`/restaurant/${restaurantId}`);
  };

  return (
    <div className="space-y-8">
      {/* 1. 상권 인기식당 Top10 */}
      <section>
        {/* 섹션 헤더 */}
        <div className="px-4 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">강남역 인기 식당 Top10</h2>
        </div>

        {/* 가로 스크롤 카드 리스트 */}
        <HorizontalScrollContainer>
          {rankingMockData.map((restaurant) => (
            <RankingCard
              key={restaurant.id}
              {...restaurant}
              onClick={() => handleRestaurantClick(restaurant.id)}
            />
          ))}
        </HorizontalScrollContainer>
      </section>

      {/* 2. 음식 종류별 Best */}
      <section>
        {/* 섹션 헤더 */}
        <div className="px-4 mb-4 flex items-center gap-2">
          <UtensilsCrossed className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">음식 종류별 Best</h2>
        </div>

        {/* 가로 스크롤 카드 리스트 */}
        <HorizontalScrollContainer>
          {categoryMockData.map((category) => (
            <CategoryCard
              key={category.id}
              {...category}
              onClick={() =>
                handleCategoryClick(category.id, category.categoryName)
              }
            />
          ))}
        </HorizontalScrollContainer>
      </section>
    </div>
  );
}
