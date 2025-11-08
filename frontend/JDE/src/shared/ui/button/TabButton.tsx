import * as React from "react";
import { type LucideProps } from "lucide-react";
import { cn } from "@/shared/lib/utils";

/**
 * 하단 네비게이션 탭 버튼 컴포넌트
 * 아이콘과 라벨을 세로로 배치한 탭 버튼
 */
interface TabButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** 탭 아이콘 (lucide-react) */
  icon: React.ComponentType<LucideProps>;
  /** 탭 라벨 텍스트 */
  label: string;
  /** 활성화 상태 */
  isActive: boolean;
}

export const TabButton = React.forwardRef<HTMLButtonElement, TabButtonProps>(
  ({ icon: Icon, label, isActive, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          // 기본 크기 및 레이아웃
          "w-15 h-[55px]",
          "flex flex-col items-center justify-center",
          "gap-1",

          // 색상 (활성/비활성)
          isActive ? "text-orange-500" : "text-neutral-500",

          // 트랜지션 효과
          "transition-colors duration-200",

          // 호버 효과
          !isActive && "hover:text-neutral-700",

          // 포커스 효과
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 rounded-lg",

          className
        )}
        {...props}
      >
        {/* 아이콘 */}
        <Icon className="w-6 h-6" strokeWidth={2} />

        {/* 라벨 */}
        <span className="text-xs font-medium">{label}</span>
      </button>
    );
  }
);

TabButton.displayName = "TabButton";
