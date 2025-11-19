// 목적: 둥근 버튼 컴포넌트
// - 버튼 크기는 고정 (아이콘 날아가는 문제 해결)
// - hover 시: 색상, 그림자, 배경 그라데이션만 변경
// - active: 눌린 듯한 shadow 효과
// - 아이콘 위치/스케일 안정화

import * as React from "react";
import { Button } from "@/shared/ui/shadcn/button";
import { cn } from "@/shared/lib/utils";

type CircularButtonType = "dislike" | "confirm" | "next" | "bookmark" | "info";

interface CircularButtonProps
  extends Omit<React.ComponentProps<"button">, "type"> {
  type: CircularButtonType;
  icon: React.ReactNode;
}

// 타입별 색상 & hover 효과 정의
const typeConfig = {
  dislike: {
    text: "text-error",
    hover:
      "hover:bg-gradient-to-br hover:from-error hover:via-red-500 hover:to-red-700 hover:text-white",
    active: "active:shadow-inner active:shadow-black/25",
  },
  confirm: {
    text: "text-success",
    hover:
      "hover:bg-gradient-to-br hover:from-success hover:via-green-500 hover:to-green-700 hover:text-white",
    active: "active:shadow-inner active:shadow-black/25",
  },
  next: {
    text: "text-yellow-500",
    hover:
      "hover:bg-gradient-to-br hover:from-yellow-300 hover:via-yellow-400 hover:to-yellow-600 hover:text-white",
    active: "active:shadow-inner active:shadow-black/25",
  },
  bookmark: {
    text: "text-orange-500",
    hover:
      "hover:bg-gradient-to-br hover:from-orange-400 hover:via-orange-500 hover:to-orange-700 hover:text-white",
    active: "active:shadow-inner active:shadow-black/25",
  },
  info: {
    text: "text-info",
    hover:
      "hover:bg-gradient-to-br hover:from-info hover:via-blue-500 hover:to-blue-700 hover:text-white",
    active: "active:shadow-inner active:shadow-black/25",
  },
};

export const CircularButton = React.forwardRef<
  HTMLButtonElement,
  CircularButtonProps
>(({ type, icon, disabled, className, ...props }, ref) => {
  const config = typeConfig[type];

  return (
    <Button
      ref={ref}
      disabled={disabled}
      size="icon" // 버튼 크기 고정 → 아이콘 날아감 방지 핵심
      className={cn(
        "group rounded-full bg-white border border-neutral-300 shadow-md",
        "transition-all duration-200 ease-out",
        config.text,
        config.hover,
        config.active,
        "hover:shadow-xl hover:border-transparent",
        "active:scale-95",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-black/10",
        className
      )}
      {...props}
    >
      <span
        className={cn(
          "transition-all duration-200 flex items-center justify-center",
          // 아이콘 고정 크기
          "[&_svg]:w-5 [&_svg]:h-5",
          // hover 시 색상만 바뀜 (스케일 변하지 않음)
          "group-hover:[&_svg]:text-white",
          // disabled
          "group-disabled:[&_svg]:opacity-50"
        )}
      >
        {icon}
      </span>
    </Button>
  );
});

CircularButton.displayName = "CircularButton";
