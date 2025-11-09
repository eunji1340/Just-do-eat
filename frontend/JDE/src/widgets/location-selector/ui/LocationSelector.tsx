// src/widgets/location-selector/ui/LocationSelector.tsx
// 목적: 지역 선택 컴포넌트

import { MapPin, ChevronDown } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface LocationSelectorProps {
  location?: string;
  onClick?: () => void;
  className?: string;
}

export const LocationSelector = ({
  location = "역삼역",
  onClick,
  className,
}: LocationSelectorProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-3 py-2 text-card-foreground hover:bg-muted transition-colors rounded-lg",
        className
      )}
      aria-label="역삼역"
    >
      <MapPin className="w-5 h-5 text-[var(--color-primary)]" strokeWidth={2} />
      <span className="text-base font-medium">{location}</span>
      <ChevronDown className="w-5 h-5 text-muted-foreground" strokeWidth={2} />
    </button>
  );
};
