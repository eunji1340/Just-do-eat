import * as React from "react";
import { cn } from "@/shared/lib/utils";

/**
 * JDE 로고 컴포넌트
 * JUST DO EAT 브랜드 로고
 */
interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 로고 크기 */
  size?: "sm" | "md" | "lg";
  /** 전체 텍스트 표시 여부 */
  fullText?: boolean;
}

// 크기별 스타일 정의
const sizeStyles = {
  sm: "text-lg", // 18px
  md: "text-2xl", // 24px
  lg: "text-4xl", // 36px
};

export const Logo = React.forwardRef<HTMLDivElement, LogoProps>(
  ({ size = "md", fullText = false, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "font-bold text-primary select-none",
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {fullText ? "JUST DO EAT" : "JDE"}
      </div>
    );
  }
);

Logo.displayName = "Logo";
