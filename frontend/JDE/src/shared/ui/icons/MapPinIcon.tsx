// src/shared/ui/icons/MapPinIcon.tsx
// 목적: 지도 핀 아이콘 컴포넌트

import { MapPin } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface MapPinIconProps {
  /** 아이콘 크기 (기본: 16px) */
  size?: number;
  /** 추가 className (색상은 text-* 클래스로 지정, 기본: text-primary) */
  className?: string;
}

/**
 * 지도 핀 아이콘
 * - 식당 위치, 현재 위치 등을 표시할 때 사용
 * - 색상은 className의 text-* 클래스로 지정 (기본: 브랜드 주요 색상)
 */
export default function MapPinIcon({
  size = 16,
  className,
}: MapPinIconProps) {
  return (
    <MapPin
      size={size}
      className={cn("flex-shrink-0 text-primary", className)}
    />
  );
}
