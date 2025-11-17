// src/widgets/groups/PastAppointments.tsx
import * as React from "react";
import { CalendarClock, ChevronRight } from "lucide-react";
import type { Room } from "@/entities/groups/types";

type Props = { items: Room["planList"]; onSeeAll?: () => void };

export default function PastAppointments({ items, onSeeAll }: Props) {
  // YYYY-MM-DD 형식이므로 Date 파싱 후 내림차순 정렬 + 최대 4개
  const list = React.useMemo(() => {
    const toTime = (s: string) => new Date(s + "T00:00:00").getTime();
    return (items ?? [])
      .slice() // 원본 불변
      .sort((a, b) => toTime(b.startAt) - toTime(a.startAt)) // 최신 → 오래된
      .slice(0, 4); // 최대 4개
  }, [items]);

  const isEmpty = list.length === 0;

//   function formatParticipants(list: string[]) {
//   if (!list || list.length === 0) return "";
//   if (list.length === 1) return list[0];
//   return `${list[0]} 외 ${list.length - 1}명`;
// }

  return (
    <section className="mt-4">
      <div className="rounded-2xl border-neutral-400 bg-card p-3 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarClock className="size-5 text-foreground/80" aria-hidden />
            <h2 className="text-base font-semibold">이전 약속들</h2>
          </div>
          {onSeeAll && (
            <button aria-label="전체 보기" onClick={onSeeAll}>
              <ChevronRight className="size-5 text-foreground/60" aria-hidden />
            </button>
          )}
        </div>

        {isEmpty ? (
          <p className="py-6 text-center text-sm text-foreground/60">
            아직 이전 약속이 없어요.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-2">
            {list.map((a) => (
              <li key={a.planId} className="overflow-hidden rounded-xl border-neutral-400 shadow-sm bg-card">
                {/* <img
                  src={a.restaurantImageUrl}
                  alt={a.restaurantName}
                  className="aspect-video w-full object-cover"
                  loading="lazy"
                />
                <div className="p-2">
                  <p className="text-sm font-semibold">{a.restaurantName}</p>
                  <p className="text-xs text-foreground/60">
                    {a.category} · {a.visitedAt}
                  </p>
                  <p className="mt-1 line-clamp-1 text-xs text-foreground/60">
                    {formatParticipants(a.participants)}
                  </p>
                </div> */}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
