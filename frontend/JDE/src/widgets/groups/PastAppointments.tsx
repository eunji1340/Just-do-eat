// src/widgets/groups/PastAppointments.tsx
import * as React from "react";
import { CalendarClock, ChevronRight } from "lucide-react";
import type { Room } from "@/entities/groups/types";

type Props = {
  items: Room["planList"];
  members: Room["roomMemberList"]; // 🔹 모임 참여자 배열
  onSeeAll?: () => void;
  onSelect?: (planId: number, restaurantId?: number) => void;
};

export default function PastAppointments({
  items,
  members,
  onSeeAll,
  onSelect,
}: Props) {
  // 🔹 DECIDED 상태인 약속만 필터링 + 최신순 내림차순 + 최대 4개
  const list = React.useMemo(() => {
    if (!items) return [];

    return items
      .filter((plan) => plan.status === "DECIDED")
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
            <h2 className="text-base font-semibold">지난 약속들</h2>
          </div>
          {onSeeAll && (
            <button
              aria-label="전체 보기"
              onClick={onSeeAll}
              className="hover:bg-neutral-100 rounded-full p-1 transition-colors"
            >
              <ChevronRight className="size-5 text-foreground/60" aria-hidden />
            </button>
          )}
        </div>

        {isEmpty ? (
          <div className="py-6 flex flex-col items-center justify-center gap-3">
            <p className="text-sm text-foreground/60">지난 약속이 없어요.</p>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-4">
            {list.map((plan) => (
              <PastPlanCard
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

function PastPlanCard({
  plan,
  participantsText,
  formatDateTime,
  onSelect,
}: {
  plan: Room["planList"][0];
  participantsText: string;
  formatDateTime: (startAt: string) => string;
  onSelect?: (planId: number, restaurantId?: number) => void;
}) {
  const [imageError, setImageError] = React.useState(false);
  const imageUrl =
    imageError || !plan.restaurantImageUrl
      ? "/NOIMAGE.png"
      : plan.restaurantImageUrl;

  return (
    <li
      className="overflow-hidden rounded-xl border-2 border-neutral-200 bg-card shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onSelect?.(plan.planId, plan.restaurantId)}
    >
      {/* 이미지 + 그라데이션 + 식당 이름 */}
      <div className="relative aspect-video w-full overflow-hidden bg-[#F6EEDC]">
        {/* 실제 이미지 (없으면 기본 이미지) */}
        <img
          src={imageUrl}
          alt={plan.restaurantName ?? plan.planName}
          className={`h-full w-full ${
            imageUrl === "/NOIMAGE.png" ? "object-contain p-4" : "object-cover"
          }`}
          loading="lazy"
          onError={() => setImageError(true)}
        />

        {/* 하단 그라데이션 */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />

        {/* 텍스트 오버레이 */}
        <div className="absolute inset-x-0 bottom-2 flex justify-center px-2">
          <p className="line-clamp-2 text-center text-sm font-bold text-white drop-shadow-lg">
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
  );
}
