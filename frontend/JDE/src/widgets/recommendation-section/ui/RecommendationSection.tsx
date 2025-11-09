// src/widgets/recommendation-section/ui/RecommendationSection.tsx
// 목적: 메인 페이지 추천 식당 섹션 (Top10 + 음식 종류별)

import { useNavigate } from "react-router-dom";
import {
  TrendingUp,
  UtensilsCrossed,
  Soup,
  Fish,
  Wine,
  Pizza,
  Coffee,
  Beef,
  Salad,
  Drumstick,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { RankingCard, CategoryCard } from "@/shared/ui/card";
import { HorizontalScrollContainer } from "@/shared/ui/scroll-container";
import { rankingMockData, categoryMockData } from "../model/mockData";

/**
 * 카테고리별 아이콘 매핑
 */
const categoryIconMap: Record<string, LucideIcon> = {
  korean: Soup,        // 한식
  chinese: UtensilsCrossed,  // 중식
  japanese: Fish,      // 일식
  western: Wine,       // 양식
  snack: Salad,        // 분식
  chicken: Drumstick,  // 치킨
  pizza: Pizza,        // 피자
  cafe: Coffee,        // 카페
  meat: Beef,          // 고기
  seafood: Fish,       // 해산물
};

interface RecommendationSectionProps {
  /** 선택된 상권 이름 */
  districtName?: string;
}

/**
 * 추천 식당 리스트 섹션
 * - 상권 인기식당 Top10
 * - 음식 종류별 Best
 */
export default function RecommendationSection({ districtName = "역삼역" }: RecommendationSectionProps) {
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
        location: "역삼역", // TODO: 실제 선택된 상권으로 변경
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
    <div className="bg-surface space-y-12 px-6 pt-6 pb-8">
      {/* 1. 상권 인기식당 Top10 */}
      <section>
        {/* 섹션 헤더 */}
        <div className="flex items-center gap-3 mb-5">
          <TrendingUp className="w-8 h-8 text-primary" />
          <h2 className="text-2xl font-extrabold">{districtName} 인기 식당 Top10</h2>
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
        <div className="flex items-center gap-3 mb-5">
          <UtensilsCrossed className="w-8 h-8 text-primary" />
          <h2 className="text-2xl font-extrabold">골라먹는 {districtName}  맛집</h2>
        </div>

        {/* 그리드 레이아웃 - 배민 스타일 카테고리 선택 */}
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-y-4 justify-items-center">
          {categoryMockData.map((category) => (
            <CategoryCard
              key={category.id}
              id={category.id}
              categoryName={category.categoryName}
              icon={categoryIconMap[category.id]}
              onClick={() =>
                handleCategoryClick(category.id, category.categoryName)
              }
            />
          ))}
        </div>
      </section>
    </div>
  );
}
