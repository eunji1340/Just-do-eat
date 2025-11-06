// src/widgets/feedback-banner/ui/BannerLayout.tsx
// 목적: 피드백 배너 공통 레이아웃

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
    <div className="mx-7 rounded-xl shadow-md bg-white border border-neutral-300 px-6 pt-6 pb-5">
      {/* 제목, 설명, 버튼을 세로로 배치하고 좌측 정렬 */}
      <div className="flex flex-col items-start gap-4">
        {/* 제목 */}
        <h3 className="text-base font-semibold text-neutral-900 w-full text-left">
          {title}
        </h3>

        {/* 설명 (2줄 높이 유지) */}
        <p className="text-sm text-neutral-500 w-full text-left whitespace-pre-line min-h-[2.5rem] leading-relaxed">
          {description}
        </p>

        {/* 버튼 그룹 (가로 정렬, 전체 너비 채움) */}
        <div className="flex gap-2 w-full">
          {children}
        </div>
      </div>
    </div>
  );
}
