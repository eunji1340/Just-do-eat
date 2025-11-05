// src/shared/ui/icons/MapPinIcon.tsx
// 목적: 지도 핀 아이콘 컴포넌트

import { MapPin } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface MapPinIconProps {
  /** 아이콘 크기 (기본: 16px) */
  size?: number;
  /** 아이콘 색상 (기본: 브랜드 컬러) */
  color?: string;
  /** 추가 className */
  className?: string;
}

/**
 * 지도 핀 아이콘
 * - 식당 위치, 현재 위치 등을 표시할 때 사용
 */
export default function MapPinIcon({
  size = 16,
  color = "#FF8904",
  className,
}: MapPinIconProps) {
  return (
    <MapPin
      size={size}
      color={color}
      className={cn("flex-shrink-0", className)}
    />
  );
}
