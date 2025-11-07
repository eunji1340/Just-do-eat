// src/shared/ui/scroll-container/HorizontalScrollContainer.tsx
// 목적: 가로 스크롤 컨테이너 (카드 리스트용)

import * as React from "react";
import { cn } from "@/shared/lib/utils";

interface HorizontalScrollContainerProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** 자식 요소들 */
  children: React.ReactNode;
  /** 좌우 패딩 (기본: px-4) */
  padding?: string;
  /** 아이템 간격 (기본: gap-3) */
  gap?: string;
}

/**
 * 가로 스크롤 컨테이너
 * - 카드 리스트를 가로로 스크롤 가능하게 표시
 * - 스크롤바 숨김 처리
 */
export const HorizontalScrollContainer = React.forwardRef<
  HTMLDivElement,
  HorizontalScrollContainerProps
>(({ children, padding = "px-4", gap = "gap-3", className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        // 가로 스크롤 설정
        "overflow-x-auto overflow-y-hidden",
        // 스크롤바 숨김
        "scrollbar-hide",
        "[&::-webkit-scrollbar]:hidden",
        "[-ms-overflow-style:none]",
        "[scrollbar-width:none]",
        // 스크롤 스냅
        "scroll-smooth",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          // 가로 배치
          "flex flex-nowrap",
          // 간격
          gap,
          // 패딩
          padding
        )}
      >
        {children}
      </div>
    </div>
  );
});

HorizontalScrollContainer.displayName = "HorizontalScrollContainer";
