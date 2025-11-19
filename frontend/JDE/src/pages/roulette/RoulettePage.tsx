// 예시: src/pages/RoulettePage.tsx (기존 MOCK 버전 → 실제 plan 연동 버전)

import * as React from "react";
import { useSearchParams } from "react-router-dom";
import type { RouletteItem } from "@/entities/roulette/types";
import RouletteWheel from "@/widgets/roulette/RouletteWheel";
import { useRoulette } from "@/features/roulette/useRoulette";
import { getDeterministicWinnerIndex } from "@/features/roulette/utils/getWinnerindex";
import { usePlanCandidates } from "@/pages/plan/hooks/usePlanCandidates";

export default function RoulettePage() {
  const [searchParams] = useSearchParams();
  const planId = searchParams.get("planId") || "";

  // 1) 약속 후보 식당 목록 재사용
  const {
    restaurants,
    isLoading: isLoadingCandidates,
  } = usePlanCandidates(planId);

  const [items, setItems] = React.useState<RouletteItem[]>([]);
  const [winnerIndex, setWinnerIndex] = React.useState<number | null>(null);

  const { angle, spinning, durationMs, gradientStops, spinToIndex } =
    useRoulette({
      items,
      onFinish: ({ item }) => {
        alert(`오늘은 ➜ ${item.label}!`);
      },
    });

  // 2) 후보 식당 → RouletteItem 으로 변환 + winnerIndex 계산
  React.useEffect(() => {
    if (!planId || restaurants.length === 0) return;

    const rouletteItems: RouletteItem[] = restaurants.map((r) => ({
      id: String(r.id),
      label: r.name,
      weight: 1,
    }));

    setItems(rouletteItems);

    const candidateIds = restaurants.map((r) => Number(r.id));
    const idx = getDeterministicWinnerIndex(planId, candidateIds);
    setWinnerIndex(idx);
  }, [planId, restaurants]);

  // 3) "룰렛 돌리기" 버튼 → 항상 같은 인덱스로 회전
  const handleSpinClick = React.useCallback(() => {
    if (winnerIndex === null || spinning || items.length === 0) return;
    spinToIndex(winnerIndex);
  }, [winnerIndex, spinning, items.length, spinToIndex]);

  if (isLoadingCandidates) {
    return (
      <main className="min-h-dvh flex items-center justify-center bg-surface">
        <p className="text-sm text-muted-foreground">룰렛 준비 중...</p>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-6 md:py-10">
        <header className="text-center space-y-1">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            모임 장소 룰렛
          </h1>
          <p className="text-sm text-muted-foreground">
            후보 중 하나를 랜덤으로 골라 보세요.
          </p>
        </header>

        <section className="mt-6 md:mt-8 lg:mt-10 grid place-items-center">
          <RouletteWheel
            items={items}
            gradientStops={gradientStops}
            angle={angle}
            durationMs={durationMs}
            spinning={spinning}
            onSpin={handleSpinClick} // 🔥 누가 눌러도 같은 결과
          />
        </section>
      </div>
    </main>
  );
}
