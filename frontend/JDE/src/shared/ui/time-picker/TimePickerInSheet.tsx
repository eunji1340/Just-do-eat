// src/shared/ui/time-picker/TimePickerInSheet.tsx
// 목적: 바텀시트 내부에서 날짜처럼 펼쳐지는 시/분 선택 컴포넌트
// - HH:MM 형식으로 반환
// - 외부에서 open 상태를 관리하도록 설계

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/shared/lib/utils";

type Props = {
  /** "HH:MM" 또는 "" */

  value: string;
  onChange: (v: string) => void;

  /** 펼침 여부는 외부에서 제어 */
  open: boolean;
  onOpenChange: (o: boolean) => void;
};

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

function formatKoreanTime(time: string) {
  if (!time) return "시간 선택";
  const [h, m] = time.split(":");
  return `${h}시 ${m}분`;
}

export default function TimePickerInSheet({ value, onChange, open, onOpenChange }: Props) {
  const [hour, setHour] = React.useState("");
  const [minute, setMinute] = React.useState("");

  // value가 바뀌면 내부 state sync
  React.useEffect(() => {
    if (!value) {
      setHour("");
      setMinute("");
      return;
    }
    const [h, m] = value.split(":");
    setHour(h);
    setMinute(m);
  }, [value]);

  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium">시간</label>

      {/* 상단 버튼 */}
      <button
        type="button"
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-neutral-300 px-3 text-left text-sm outline-none",
        )}
        onClick={() => onOpenChange(!open)}
      >
        <span>{formatKoreanTime(value)}</span>
        <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
      </button>

      {/* 펼침 패널 */}
      {open && (
        <div className="mt-2 rounded-xl border border-border bg-card p-4 flex justify-center gap-6">

          {/* 시 선택 */}
          <div className="h-48 w-20 overflow-y-auto border-r pr-2">
            {HOURS.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => setHour(h)}
                className={cn(
                  "block w-full py-2 text-center rounded-md transition-colors",
                  hour === h
                    ? "bg-[var(--color-t3)] border border-[var(--color-primary)] font-semibold"
                    : "hover:bg-muted"
                )}
              >
                {h}
              </button>
            ))}
          </div>

          {/* 분 선택 */}
          <div className="h-48 w-20 overflow-y-auto">
            {MINUTES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMinute(m);
                  const hh = hour || "00";
                  const mm = m;

                  // 부모로 "HH:MM" 전달
                  onChange(`${hh}:${mm}`);

                  // 선택 완료 시 패널 닫기
                  onOpenChange(false);
                }}
                className={cn(
                  "block w-full py-2 text-center rounded-md transition-colors",
                  minute === m
                    ? "bg-[var(--color-t3)] border border-[var(--color-primary)] font-semibold"
                    : "hover:bg-muted"
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
