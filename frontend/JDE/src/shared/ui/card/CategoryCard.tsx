// src/shared/ui/card/CategoryCard.tsx
// 목적: 음식 종류별 카테고리 카드 컴포넌트

import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface CategoryCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 카테고리 ID */
  id: string;
  /** 카테고리명 (예: "한식", "중식") */
  categoryName: string;
  /** 카테고리 아이콘 (선택적) */
  icon?: LucideIcon;
  /** 카테고리 대표 이미지 URL (선택적) */
  imageUrl?: string;
}

/**
 * 음식 종류별 카테고리 카드
 * - 원형 아이콘/이미지 + 카테고리명
 * - 클릭 시 스와이프 피드로 이동 (해당 카테고리 필터)
 */
export const CategoryCard = React.forwardRef<HTMLDivElement, CategoryCardProps>(
  ({ id, categoryName, icon: Icon, imageUrl, className, onClick, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // 플렉스
          "flex flex-col items-center",
          // 간격
          "gap-2.5",
          // 커서
          "cursor-pointer",
          // 트랜지션
          "transition-transform hover:scale-105",
          className
        )}
        onClick={onClick}
        {...props}
      >
        {/* 원형 아이콘/이미지 */}
        <div className="p-3 rounded-full overflow-hidden bg-muted shadow-md flex items-center justify-center">
          {Icon ? (
            <Icon className="w-12 h-12 text-[var(--color-primary)]" strokeWidth={2} />
          ) : imageUrl ? (
            <img
              src={imageUrl}
              alt={categoryName}
              className="w-12 h-12 object-cover"
            />
          ) : null}
        </div>

        {/* 카테고리명 */}
        <p className="text-sm font-medium text-card-foreground text-center">
          {categoryName}
        </p>
      </div>
    );
  }
);

CategoryCard.displayName = "CategoryCard";
