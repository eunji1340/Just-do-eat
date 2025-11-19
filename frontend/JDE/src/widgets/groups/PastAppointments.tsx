// src/widgets/groups/PastAppointments.tsx
import * as React from "react";
import { CalendarClock, ChevronRight } from "lucide-react";
import type { Room } from "@/entities/groups/types";

type Props = {
  items: Room["planList"];
  members: Room["roomMemberList"]; // 🔹 모임 참여자 배열
  onSeeAll?: () => void;
};

export default function PastAppointments({ items, members, onSeeAll }: Props) {
  // 🔹 이전 약속(오늘 기준 이전)만 최신순 내림차순 + 최대 4개
const list = React.useMemo(() => {
  if (!items) return [];

  return items
    .slice()
    .sort((a, b) => {
      const ta = new Date(a.startAt).getTime();
      const tb = new Date(b.startAt).getTime();
      return tb - ta; // 최신 → 오래된
    })
    .slice(0, 4);
}, [items]);


  const isEmpty = list.length === 0;

  // 🔹 "홍길동 외 2명" 형식
  function formatParticipants() {
    if (!members || members.length === 0) return "";

    const active = members.filter((m) => !m.del);
    if (active.length === 0) return "";

    if (active.length === 1) return active[0].userName;
    return `${active[0].userName} 외 ${active.length - 1}명`;
  }

  // 🔹 "2025-12-31 19:00" 정도로만 깔끔하게 표시
  function formatDateTime(startAt: string) {
    if (!startAt) return "";
    // "YYYY-MM-DDTHH:MM:SS" 기준
    const [datePart, timePart] = startAt.split("T");
    if (!datePart) return startAt;

    const [y, m, d] = datePart.split("-");
    const [hh, mm] = (timePart ?? "").split(":");

    const dateStr = `${y}.${m}.${d}`;
    const timeStr = hh && mm ? `${hh}:${mm}` : "";
    return timeStr ? `${dateStr} ${timeStr}` : dateStr;
  }

  const participantsText = formatParticipants();

  return (
    <section className="mt-4">
      <div className="rounded-2xl border-neutral-400 bg-card p-3 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarClock className="size-5 text-foreground/80" aria-hidden />
            <h2 className="text-base font-semibold">우리의 약속들</h2>
          </div>
          {onSeeAll && (
            <button aria-label="전체 보기" onClick={onSeeAll}>
              <ChevronRight
                className="size-5 text-foreground/60"
                aria-hidden
              />
            </button>
          )}
        </div>

        {isEmpty ? (
          <p className="py-6 text-center text-sm text-foreground/60">
            아직 약속이 없어요.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-2">
            {list.map((plan) => (
            <li
              key={plan.planId}
              className="overflow-hidden rounded-xl border-neutral-400 bg-card shadow-sm"
            >
              {/* 이미지 + 그라데이션 + 식당 이름 */}
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-[#F6EEDC]">
                {/* 실제 이미지 (없으면 기본 이미지) */}
                <img
                  src={plan.restaurantImageUrl || "/noimages.png"}
                  alt={plan.restaurantName ?? "plan.planName"}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />

                {/* 하단 그라데이션 (투명 → 흰색) */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-white/95 via-white/40 to-transparent" />

                {/* 텍스트 오버레이 */}
                <div className="absolute inset-x-0 bottom-2 flex justify-end px-2">
                  <p className="line-clamp-2 text-center text-m font-semibold text-black">
                    {plan.restaurantName ?? "식당 미정"}
                  </p>
                </div>
              </div>

              {/* 아래 메타 정보 영역 */}
              <div className="p-2">
                {/* 날짜/시간 */}
                <p className="text-[11px] text-foreground/60">
                  {formatDateTime(plan.startAt)}
                </p>

                {/* 약속 이름 */}
                <p className="mt-0.5 line-clamp-1 text-sm font-semibold">
                  {plan.planName}
                </p>

                {/* 주최자 + 참여자 요약 */}
                <p className="mt-1 line-clamp-1 text-[11px] text-foreground/60">
                  {participantsText}
                </p>
              </div>
            </li>

            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
