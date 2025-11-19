import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/shared/ui/shadcn/card";

interface BannerLayoutProps {
  /** 제목 */
  title: string | React.ReactNode;
  /** 설명 */
  description: string;
  /** 버튼 그룹 */
  children: React.ReactNode;
}

/**
 * 피드백 배너 공통 레이아웃 (개선 버전)
 *
 * 개선사항:
 * - 그라데이션 테두리로 시각적 강조
 * - 아이콘 추가로 피드백 의도 명확화
 * - 애니메이션으로 부드러운 등장 효과
 * - 개선된 간격과 타이포그래피
 */
export default function BannerLayout({
  title,
  description,
  children,
}: BannerLayoutProps) {
  return (
    <div className="mx-4 my-4 animate-in fade-in slide-in-from-top-2 duration-500">
      <Card className="relative overflow-hidden border-2 border-orange-200 bg-gradient-to-br from-white to-orange-50/30 shadow-lg hover:shadow-xl transition-shadow duration-300">
        {/* 좌측 강조 바 */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-400 to-orange-600" />

        {/* 헤더 */}
        <CardHeader className="gap-3 pl-6">
          {/* 아이콘과 제목 */}
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-bold text-neutral-900 leading-tight">
                {title}
              </CardTitle>
            </div>
          </div>

          {/* 설명 */}
          <CardDescription className="pl-[28px] text-sm text-neutral-500 whitespace-pre-line min-h-[2.5rem] leading-relaxed">
            {description}
          </CardDescription>
        </CardHeader>

        {/* 버튼 그룹 */}
        <CardFooter className="gap-2.5 w-full pt-0">
          <div className="flex gap-2.5 w-full">{children}</div>
        </CardFooter>
      </Card>
    </div>
  );
}
