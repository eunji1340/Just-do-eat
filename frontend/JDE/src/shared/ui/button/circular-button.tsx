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

// 타입별 색상 정의
const typeConfig = {
  dislike: {
    color: "#EF4444", // red-500
    hover: "hover:bg-[#EF4444]",
    focus: "focus-visible:shadow-[0_0_0_8px_rgba(239,68,68,0.3)]",
  },
  confirm: {
    color: "#22C55E", // green-500
    hover: "hover:bg-[#22C55E]",
    focus: "focus-visible:shadow-[0_0_0_8px_rgba(34,197,94,0.3)]",
  },
  next: {
    color: "#EAB308", // yellow-500
    hover: "hover:bg-[#EAB308]",
    focus: "focus-visible:shadow-[0_0_0_8px_rgba(234,179,8,0.3)]",
  },
  bookmark: {
    color: "#FF8904", // 브랜드 컬러
    hover: "hover:bg-[#FF8904]",
    focus: "focus-visible:shadow-[0_0_0_8px_rgba(255,137,4,0.3)]",
  },
  info: {
    color: "#3B82F6", // blue-500
    hover: "hover:bg-[#3B82F6]",
    focus: "focus-visible:shadow-[0_0_0_8px_rgba(59,130,246,0.3)]",
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

        // hover/active 시 배경 색상 (모든 타입 동일)
        config.hover,

        // focus 상태 (모든 타입 동일)
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
      style={
        {
          // 기본 아이콘 색상
          color: config.color,
          // focus 시 아이콘 색상 유지
        } as React.CSSProperties
      }
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
