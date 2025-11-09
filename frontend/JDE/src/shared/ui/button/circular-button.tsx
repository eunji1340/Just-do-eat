import * as React from "react";
import { Button } from "@/shared/ui/shadcn/button";
import { cn } from "@/shared/lib/utils";

type CircularButtonType = "dislike" | "confirm" | "next" | "bookmark" | "info";

interface CircularButtonProps
  extends Omit<React.ComponentProps<"button">, "type"> {
  /** 버튼 타입 */
  type: CircularButtonType;
  /** 아이콘 요소 */
  icon: React.ReactNode;
}

// 타입별 색상 정의 (global.css의 @theme 색상 사용)
const typeConfig = {
  dislike: {
    text: "text-error", // 에러 색상
    hover: "hover:bg-error",
    focus: "focus-visible:ring-4 focus-visible:ring-error/30",
  },
  confirm: {
    text: "text-success", // 성공 색상
    hover: "hover:bg-success",
    focus: "focus-visible:ring-4 focus-visible:ring-success/30",
  },
  next: {
    text: "text-warning", // 경고 색상
    hover: "hover:bg-warning",
    focus: "focus-visible:ring-4 focus-visible:ring-warning/30",
  },
  bookmark: {
    text: "text-primary", // 브랜드 주요 색상
    hover: "hover:bg-primary",
    focus: "focus-visible:ring-4 focus-visible:ring-primary/30",
  },
  info: {
    text: "text-info", // 정보 색상
    hover: "hover:bg-info",
    focus: "focus-visible:ring-4 focus-visible:ring-info/30",
  },
};

// 주요 타입 (크기 변화 있음)
const primaryTypes: CircularButtonType[] = ["dislike", "confirm", "next"];

export const CircularButton = React.forwardRef<
  HTMLButtonElement,
  CircularButtonProps
>(({ type, icon, disabled, className, ...props }, ref) => {
  const config = typeConfig[type];
  const isPrimary = primaryTypes.includes(type);

  return (
    <Button
      ref={ref}
      disabled={disabled}
      size={isPrimary ? "icon" : "icon-sm"}
      className={cn(
        // 기본 스타일
        "rounded-full shadow-lg bg-white transition-all duration-300",
        "hover:text-white active:text-white",
        "disabled:bg-white",

        // 기본 아이콘 색상 (Tailwind 클래스)
        config.text,

        // hover/active 시 배경 색상
        config.hover,

        // focus 상태
        "focus-visible:bg-white",
        "focus-visible:outline-none",
        config.focus,

        // 크기 변화 애니메이션 (주요 타입만)
        isPrimary && [
          "hover:size-24 active:size-24", // hover/click 시 96px
          "focus-visible:size-24", // focus 시 96px
          "disabled:size-9", // disabled 시 36px
        ],

        className
      )}
      {...props}
    >
      {/* 아이콘 크기 자동 조절 */}
      <span
        className={cn(
          "transition-all duration-300",
          // 기본 크기
          "[&_svg]:size-5",
          // hover/focus 시 크기 증가 (주요 타입만)
          isPrimary &&
            "group-hover:[&_svg]:size-8 group-focus-visible:[&_svg]:size-8 group-active:[&_svg]:size-8",
          // disabled 시 작게
          "group-disabled:[&_svg]:size-4"
        )}
      >
        {icon}
      </span>
    </Button>
  );
});

CircularButton.displayName = "CircularButton";
