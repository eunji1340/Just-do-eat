// src/widgets/feedback-banner/ui/BannerLayout.tsx
// 목적: 피드백 배너 공통 레이아웃

import { Restaurant } from "@/entities/restaurant/types";
import MapPinIcon from "@/shared/ui/icons/MapPinIcon";
import CountBadge from "@/shared/ui/badge/CountBadge";

interface BannerLayoutProps {
  /** 식당 정보 */
  restaurant: Restaurant;
  /** 남은 질문 개수 */
  remainingCount: number;
  /** 자식 컴포넌트 (질문 Step 컴포넌트) */
  children: React.ReactNode;
}

/**
 * 피드백 배너 공통 레이아웃
 *
 * 레이아웃:
 * ┌────────────────────────────────────────┐
 * │ 📍 {식당 이름}           남은 질문 {N} │
 * │                                        │
 * │ {children} - 질문 컴포넌트              │
 * └────────────────────────────────────────┘
 */
export default function BannerLayout({
  restaurant,
  remainingCount,
  children,
}: BannerLayoutProps) {
  return (
    <div className="mx-3 my-4 rounded-lg bg-white shadow-md border border-gray-100 overflow-hidden">
      {/* 헤더: 식당 이름 + 남은 질문 개수 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        {/* 왼쪽: 식당 이름 */}
        <div className="flex items-center gap-2">
          <MapPinIcon size={16} />
          <span className="font-semibold text-gray-900 text-sm">
            {restaurant.name}
          </span>
        </div>

        {/* 오른쪽: 남은 질문 개수 */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500">남은 질문</span>
          <CountBadge count={remainingCount} size="sm" />
        </div>
      </div>

      {/* 본문: 질문 컴포넌트 */}
      <div className="px-4 py-4">
        {children}
      </div>
    </div>
  );
}
