// src/pages/restaurant/ui/RestaurantHeader.tsx
// 목적: 식당 이미지 + 기본 정보 (이름, 카테고리, 평점, 요약)

import { Share2, Star } from "lucide-react";
import type { RestaurantDetailResponse } from "../api/useRestaurantDetail";

/**
 * 주소에서 동 이름만 추출
 */
function extractDong(address: string): string {
  const match = address.match(/([가-힣]+동)/);
  return match ? match[1] : "";
}

interface RestaurantHeaderProps {
  restaurant: RestaurantDetailResponse;
  onShare: () => void;
}

/**
 * 식당 헤더 컴포넌트
 * - 식당 이미지
 * - 이름, 카테고리, 별점
 * - 카카오 요약 정보
 */
export default function RestaurantHeader({
  restaurant,
  onShare,
}: RestaurantHeaderProps) {
  return (
    <>
      {/* 식당 이미지 - 네비바 영역까지 전체 */}
      {restaurant.image && restaurant.image.length > 0 && (
        <div className="w-full h-80 bg-gray-200">
          <img
            src={restaurant.image[0]}
            alt={restaurant.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = "";
              e.currentTarget.style.display = "none";
            }}
          />
        </div>
      )}

      {/* 식당 기본 정보 섹션 */}
      <div className="relative -mt-8 bg-white rounded-t-lg p-6 space-y-4 z-10">
        {/* 지역 | 카테고리 */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>{extractDong(restaurant.address) || "역삼동"}</span>
          <span>|</span>
          <span>{restaurant.category2 || restaurant.category1}</span>
        </div>

        {/* 식당 이름 + 공유버튼 */}
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900 flex-1">
            {restaurant.name}
          </h1>
          <button
            onClick={onShare}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="공유"
          >
            <Share2 className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* 카카오 별점 */}
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
          <span className="text-lg font-semibold">
            {restaurant.kakao_rating.toFixed(1)}
          </span>
          <span className="text-sm text-gray-500">
            ({restaurant.kakao_review_cnt}개 리뷰)
          </span>
        </div>

        {/* Summary */}
        {restaurant.kakao_summary && (
          <div className="space-y-1">
            <p className="font-semibold text-gray-900">
              {restaurant.kakao_summary.title}
            </p>
            <p className="text-sm text-gray-600">
              {restaurant.kakao_summary.summary}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
