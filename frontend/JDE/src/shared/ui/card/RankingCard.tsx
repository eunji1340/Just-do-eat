// src/shared/ui/card/RankingCard.tsx
// 목적: 상권 인기식당 Top10 카드 컴포넌트

import * as React from "react";
import { ImageOff, Medal } from "lucide-react";
import { cn } from "@/shared/lib/utils";

/**
 * 순위에 따른 배지 스타일 결정
 */
const getRankBadgeStyle = (rank: number) => {
  switch (rank) {
    case 1:
      return {
        bgColor: "bg-[var(--color-rank-gold)]",
        textColor: "text-white",
        showMedal: true,
      };
    case 2:
      return {
        bgColor: "bg-[var(--color-rank-silver)]",
        textColor: "text-gray-800",
        showMedal: true,
      };
    case 3:
      return {
        bgColor: "bg-[var(--color-rank-bronze)]",
        textColor: "text-white",
        showMedal: true,
      };
    default:
      return {
        bgColor: "bg-[var(--color-rank-default)]",
        textColor: "text-white",
        showMedal: false,
      };
  }
};

interface RankingCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'id'> {
  /** 식당 ID */
  id: string | number;
  /** 순위 (1~10) */
  rank: number;
  /** 식당명 */
  restaurantName: string;
  /** 음식 카테고리 */
  category: string;
  /** 식당 이미지 URL (선택적) */
  imageUrl?: string;
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
    const [imageError, setImageError] = React.useState(false);
    const showPlaceholder = !imageUrl || imageError;
    const badgeStyle = getRankBadgeStyle(rank);

    return (
      <div
        ref={ref}
        className={cn(
          // 크기
          "w-40",
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
        <div className="relative w-40 h-40">
          {/* 식당 이미지 또는 Placeholder */}
          {showPlaceholder ? (
            <div className="w-40 h-40 bg-muted rounded-lg flex items-center justify-center">
              <ImageOff className="w-12 h-12 text-muted-foreground" strokeWidth={1.5} />
            </div>
          ) : (
            <img
              src={imageUrl}
              alt={restaurantName}
              className="w-40 h-40 object-cover rounded-lg"
              onError={() => setImageError(true)}
            />
          )}

          {/* 순위 배지 (좌상단) */}
          <div
            className={cn(
              "absolute top-2 left-2 text-xs font-bold px-2 py-1 rounded-md shadow-md flex items-center gap-1",
              badgeStyle.bgColor,
              badgeStyle.textColor
            )}
          >
            {badgeStyle.showMedal && <Medal className="w-3.5 h-3.5" strokeWidth={2.5} />}
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
