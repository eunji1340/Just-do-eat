// src/shared/ui/calendar.tsx
import * as React from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { cn } from "@/shared/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

export function Calendar({ className, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays
      // ✅ 브랜드 컬러 강제 적용 (inline style → 라이브러리 CSS보다 우선)
      style={{
        // react-day-picker v9 CSS variables
        // https://react-day-picker.js.org/style-guide
        "--rdp-accent-color": "var(--color-primary)",
        "--rdp-accent-background": "var(--color-t3)",
        "--rdp-background-color": "transparent",
        "--rdp-outline": "2px solid var(--color-primary)",
        "--rdp-outline-selected": "2px solid var(--color-primary)",
      } as React.CSSProperties}
      className={cn(
        "rdp p-2",
        // month 컨테이너 가운데 정렬
        "[&_.rdp-months]:flex",
        "[&_.rdp-months]:justify-center",
        className
      )}
      {...props}
    />
  );
}
