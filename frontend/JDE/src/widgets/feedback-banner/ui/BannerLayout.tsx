// src/widgets/feedback-banner/ui/BannerLayout.tsx
// 목적: 피드백 배너 공통 레이아웃 (shadcn Card 기반)

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/shared/ui/shadcn/card";

interface BannerLayoutProps {
  /** 제목 */
  title: string;
  /** 설명 */
  description: string;
  /** 버튼 그룹 */
  children: React.ReactNode;
}

/**
 * 피드백 배너 공통 레이아웃
 *
 * 레이아웃:
 * ┌────────────────────────┐
 * │ 제목                    │
 * │ 설명                    │
 * │         [버튼] [버튼]   │
 * └────────────────────────┘
 */
export default function BannerLayout({
  title,
  description,
  children,
}: BannerLayoutProps) {
  return (
    <Card className="mx-7 shadow-md">
      {/* 제목과 설명 */}
      <CardHeader className="gap-4 pb-0">
        <CardTitle className="text-base text-neutral-900">
          {title}
        </CardTitle>
        <CardDescription className="text-sm text-neutral-500 whitespace-pre-line min-h-[2.5rem] leading-relaxed">
          {description}
        </CardDescription>
      </CardHeader>

      {/* 버튼 그룹 (가로 정렬, 전체 너비 채움) */}
      <CardFooter className="gap-2 w-full pt-0">
        {children}
      </CardFooter>
    </Card>
  );
}
