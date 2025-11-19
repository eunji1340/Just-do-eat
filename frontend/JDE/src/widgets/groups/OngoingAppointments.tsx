// src/widgets/groups/OngoingAppointments.tsx
import * as React from "react";
import { Clock, ChevronRight, Calendar } from "lucide-react";
import type { Room } from "@/entities/groups/types";

type Props = {
  items: Room["planList"];
  members: Room["roomMemberList"];
  onSeeAll?: () => void;
  onSelect?: (planId: number) => void;
};

export default function OngoingAppointments({
  items,
  members,
  onSeeAll,
  onSelect,
}: Props) {
  // 🔹 DECIDED가 아닌 약속만 필터링 + 최신순 내림차순 + 최대 4개
  const list = React.useMemo(() => {
    if (!items) return [];

    return items
      .filter((plan) => plan.status !== "DECIDED")
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
            <Clock className="size-5 text-foreground/80" aria-hidden />
            <h2 className="text-base font-semibold">진행중인 약속</h2>
          </div>
          {onSeeAll && (
            <button aria-label="전체 보기" onClick={onSeeAll}>
              <ChevronRight className="size-5 text-foreground/60" aria-hidden />
            </button>
          )}
        </div>

        {isEmpty ? (
          <p className="py-6 text-center text-sm text-foreground/60">
            진행중인 약속이 없어요.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-4">
            {list.map((plan) => (
              <PlanCard
                key={plan.planId}
                plan={plan}
                participantsText={participantsText}
                formatDateTime={formatDateTime}
                onSelect={onSelect}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function PlanCard({
  plan,
  participantsText,
  formatDateTime,
  onSelect,
}: {
  plan: Room["planList"][0];
  participantsText: string;
  formatDateTime: (startAt: string) => string;
  onSelect?: (planId: number) => void;
}) {
  return (
    <li
      className="rounded-xl border-2 border-neutral-200 bg-card shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onSelect?.(plan.planId)}
    >
      <div className="p-4">
        {/* 아이콘 + 약속 이름 */}
        <div className="flex items-start gap-3 mb-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center border border-orange-200">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-foreground line-clamp-2">
              {plan.planName}
            </h3>
          </div>
        </div>

        {/* 날짜/시간 */}
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-4 h-4 text-foreground/60 flex-shrink-0" />
          <p className="text-xs text-foreground/60">
            {formatDateTime(plan.startAt)}
          </p>
        </div>

        {/* 식당 상태 */}
        <div className="mt-2 pt-2 border-t border-neutral-200">
          <p className="text-xs text-foreground/60 mb-1">
            {plan.restaurantName ? (
              <span className="text-primary font-medium">
                {plan.restaurantName}
              </span>
            ) : (
              <span>식당 미정</span>
            )}
          </p>
          <p className="text-[10px] text-foreground/50">{participantsText}</p>
        </div>
      </div>
    </li>
  );
}
