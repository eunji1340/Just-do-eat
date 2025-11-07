// src/shared/ui/card/RankingCard.tsx
// 목적: 상권 인기식당 Top10 카드 컴포넌트

import * as React from "react";
import { cn } from "@/shared/lib/utils";

interface RankingCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 식당 ID */
  id: string | number;
  /** 순위 (1~10) */
  rank: number;
  /** 식당명 */
  restaurantName: string;
  /** 음식 카테고리 */
  category: string;
  /** 식당 이미지 URL */
  imageUrl: string;
  /** 상권 정보 (선택) */
  location?: string;
}

/**
 * 상권 인기식당 Top10 카드
 * - 순위 배지 + 식당 이미지 + 식당명 + 카테고리
 * - 클릭 시 식당 상세 페이지로 이동
 */
export const RankingCard = React.forwardRef<HTMLDivElement, RankingCardProps>(
  (
    {
      id,
      rank,
      restaurantName,
      category,
      imageUrl,
      location,
      className,
      onClick,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          // 크기
          "w-[144px]",
          // 커서
          "cursor-pointer",
          // 트랜지션
          "transition-transform hover:scale-105",
          // 플렉스
          "flex flex-col",
          // 간격
          "gap-2",
          className
        )}
        onClick={onClick}
        {...props}
      >
        {/* 이미지 + 순위 배지 */}
        <div className="relative w-full aspect-square">
          {/* 식당 이미지 */}
          <img
            src={imageUrl}
            alt={restaurantName}
            className="w-full h-full object-cover rounded-lg"
          />

          {/* 순위 배지 (좌상단) */}
          <div className="absolute top-2 left-2 bg-primary text-white text-xs font-bold px-2 py-1 rounded-md shadow-md">
            {rank}등
          </div>
        </div>

        {/* 식당 정보 (중앙 정렬) */}
        <div className="flex flex-col items-center text-center gap-0.5">
          {/* 식당명 */}
          <p className="text-lg font-semibold text-card-foreground line-clamp-1">
            {restaurantName}
          </p>

          {/* 카테고리 */}
          <p className="text-xs font-light text-muted-foreground">
            {category}
          </p>
        </div>
      </div>
    );
  }
);

RankingCard.displayName = "RankingCard";
