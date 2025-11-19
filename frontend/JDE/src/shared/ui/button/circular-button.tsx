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
    hover:
      "hover:bg-gradient-to-br hover:from-error hover:via-red-500 hover:to-red-700 hover:shadow-2xl hover:shadow-error/60",
    active:
      "active:shadow-[inset_0_4px_8px_rgba(0,0,0,0.3)] active:from-red-700 active:to-error",
    focus:
      "focus-visible:ring-4 focus-visible:ring-error/30 focus-visible:shadow-2xl",
  },
  confirm: {
    text: "text-success", // 성공 색상
    hover:
      "hover:bg-gradient-to-br hover:from-success hover:via-green-500 hover:to-green-700 hover:shadow-2xl hover:shadow-success/60",
    active:
      "active:shadow-[inset_0_4px_8px_rgba(0,0,0,0.3)] active:from-green-700 active:to-success",
    focus:
      "focus-visible:ring-4 focus-visible:ring-success/30 focus-visible:shadow-2xl",
  },
  next: {
    text: "text-yellow-500", // 노란색 (보류)
    hover:
      "hover:bg-gradient-to-br hover:from-yellow-300 hover:via-yellow-400 hover:to-yellow-600 hover:shadow-2xl hover:shadow-yellow-400/70",
    active:
      "active:shadow-[inset_0_4px_8px_rgba(0,0,0,0.3)] active:from-yellow-600 active:to-yellow-400",
    focus:
      "focus-visible:ring-4 focus-visible:ring-yellow-400/30 focus-visible:shadow-2xl",
  },
  bookmark: {
    text: "text-orange-500", // 주황색 (즐겨찾기)
    hover:
      "hover:bg-gradient-to-br hover:from-orange-400 hover:via-orange-500 hover:to-orange-700 hover:shadow-2xl hover:shadow-orange-500/70",
    active:
      "active:shadow-[inset_0_4px_8px_rgba(0,0,0,0.3)] active:from-orange-700 active:to-orange-500",
    focus:
      "focus-visible:ring-4 focus-visible:ring-orange-500/30 focus-visible:shadow-2xl",
  },
  info: {
    text: "text-info", // 정보 색상
    hover:
      "hover:bg-gradient-to-br hover:from-info hover:via-blue-500 hover:to-blue-700 hover:shadow-2xl hover:shadow-info/60",
    active:
      "active:shadow-[inset_0_4px_8px_rgba(0,0,0,0.3)] active:from-blue-700 active:to-info",
    focus:
      "focus-visible:ring-4 focus-visible:ring-info/30 focus-visible:shadow-2xl",
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
        // group 클래스 추가 (자식 요소의 group-hover 작동을 위함)
        "group",

        // 기본 스타일
        "rounded-full shadow-lg bg-white transition-all duration-300 border border-neutral-300",
        "hover:text-white active:text-white focus:text-white",
        "disabled:bg-white",

        // 3D 입체 효과 강화
        "hover:-translate-y-2 hover:scale-105", // hover: 위로 8px + 5% 확대
        "active:translate-y-2 active:scale-95", // active: 아래로 8px + 5% 축소
        "hover:border-transparent", // hover 시 테두리 제거

        // 기본 아이콘 색상 (Tailwind 클래스)
        config.text,

        // hover 시 그라데이션 + 그림자
        config.hover,

        // active 시 눌린 효과 (inset shadow + 반대 그라데이션)
        config.active,

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
          "[&_svg]:w-5 [&_svg]:h-5",
          // hover/focus 시 크기 증가 (주요 타입만)
          isPrimary && [
            "group-hover:[&_svg]:scale-250 group-hover:[&_svg]:scale-250",
            "group-focus-visible:[&_svg]:scale-250 group-focus-visible:[&_svg]:scale-250",
            "group-active:[&_svg]:scale-250 group-active:[&_svg]:scale-250",
          ],
          // disabled 시 작게
          "group-disabled:[&_svg]:w-4 group-disabled:[&_svg]:h-4"
        )}
      >
        {icon}
      </span>
    </Button>
  );
});

CircularButton.displayName = "CircularButton";
