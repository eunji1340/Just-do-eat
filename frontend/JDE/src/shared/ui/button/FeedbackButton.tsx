// src/shared/ui/button/FeedbackButton.tsx
// 목적: 피드백용 버튼 컴포넌트

import * as React from "react";
import { Button } from "@/shared/ui/shadcn/button";
import { cn } from "@/shared/lib/utils";

interface FeedbackButtonProps
  extends React.ComponentProps<typeof Button> {
  /** 버튼 variant (기본: primary) */
  variant?: "primary" | "secondary" | "positive" | "negative";
  /** 버튼 크기 (기본: md) */
  size?: "sm" | "md" | "lg";
  /** 전체 너비 사용 여부 */
  fullWidth?: boolean;
}

// variant별 스타일 정의
const variantConfig = {
  primary: {
    bg: "bg-[#FF8904]",
    hover: "hover:bg-[#E67A03]",
    active: "active:bg-[#CC6B03]",
    text: "text-white",
  },
  secondary: {
    bg: "bg-gray-100",
    hover: "hover:bg-gray-200",
    active: "active:bg-gray-300",
    text: "text-gray-800",
  },
  positive: {
    bg: "bg-green-500",
    hover: "hover:bg-green-600",
    active: "active:bg-green-700",
    text: "text-white",
  },
  negative: {
    bg: "bg-red-500",
    hover: "hover:bg-red-600",
    active: "active:bg-red-700",
    text: "text-white",
  },
};

// 크기별 스타일 정의
const sizeConfig = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-6 py-3 text-lg",
};

/**
 * 피드백용 버튼 컴포넌트
 * - 피드백 질문의 응답 버튼으로 사용
 * - variant: primary(브랜드), secondary(중립), positive(긍정), negative(부정)
 */
export const FeedbackButton = React.forwardRef<
  HTMLButtonElement,
  FeedbackButtonProps
>(
  (
    {
      variant = "primary",
      size = "md",
      fullWidth = false,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const config = variantConfig[variant];

    return (
      <Button
        ref={ref}
        disabled={disabled}
        className={cn(
          // 기본 스타일
          "rounded-lg font-medium shadow-sm",
          "transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8904] focus-visible:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          // variant별 색상
          config.bg,
          config.hover,
          config.active,
          config.text,
          // 크기
          sizeConfig[size],
          // 전체 너비
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

FeedbackButton.displayName = "FeedbackButton";
