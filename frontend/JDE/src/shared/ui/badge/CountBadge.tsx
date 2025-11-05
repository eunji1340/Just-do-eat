// src/shared/ui/badge/CountBadge.tsx
// 목적: 숫자 표시 뱃지 컴포넌트

import { cn } from "@/shared/lib/utils";

interface CountBadgeProps {
  /** 표시할 숫자 */
  count: number;
  /** 뱃지 크기 (기본: md) */
  size?: "sm" | "md" | "lg";
  /** 추가 className */
  className?: string;
}

/**
 * 숫자 표시 뱃지
 * - 남은 질문 개수, 알림 개수 등을 표시할 때 사용
 */
export default function CountBadge({
  count,
  size = "md",
  className,
}: CountBadgeProps) {
  const sizeClasses = {
    sm: "px-1.5 py-0.5 text-xs",
    md: "px-2 py-1 text-sm",
    lg: "px-3 py-1.5 text-base",
  };

  return (
    <span
      className={cn(
        // 기본 스타일
        "inline-flex items-center justify-center rounded-full",
        "bg-[#FF8904] text-white font-medium",
        "shadow-sm",
        // 크기별 스타일
        sizeClasses[size],
        className
      )}
    >
      {count}
    </span>
  );
}
