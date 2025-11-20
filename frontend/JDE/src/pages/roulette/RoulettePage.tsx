import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { RouletteItem } from "@/entities/roulette/types";
import RouletteWheel from "@/widgets/roulette/RouletteWheel";
import { useRoulette } from "@/features/roulette/useRoulette";
import { getDeterministicWinnerIndex } from "@/features/roulette/utils/getWinnerindex";
import { usePlanCandidates } from "@/pages/plan/hooks/usePlanCandidates";
import { rouletteResultRestaurant } from "@/entities/plan/api/rouletteResult";

export default function RoulettePage() {
  const navigate = useNavigate();
  const { planId = "" } = useParams<{ planId: string }>();

  const {
    restaurants,
    isLoading: isLoadingCandidates,
  } = usePlanCandidates(planId);

  const [items, setItems] = React.useState<RouletteItem[]>([]);
  const [winnerIndex, setWinnerIndex] = React.useState<number | null>(null);
  const [isDeciding, setIsDeciding] = React.useState(false);

  const { angle, spinning, durationMs, gradientStops, spinToIndex } =
    useRoulette({
      items,
      // 🔥 룰렛이 멈췄을 때 호출되는 콜백
      onFinish: async ({ item }) => {
        if (!planId || !item) return;
        if (isDeciding) return;

        const restaurantId = Number(item.id);
        const decidedRestaurant = restaurants.find(
          (r) => String(r.id) === String(item.id)
        );

        try {
          setIsDeciding(true);
          // 1) 서버에 최종 결정 PATCH
          await rouletteResultRestaurant(planId, restaurantId);

          // 2) 결과 페이지로 이동 (식당 정보도 함께 전달)
          navigate(`/plans/${planId}/decision`, {
            state: {
              restaurant: decidedRestaurant,
            },
          });
        } catch (error) {
          console.error("[RoulettePage] 결정 PATCH 실패:", error);
          alert(
            error instanceof Error
              ? error.message
              : "식당 확정에 실패했습니다. 다시 시도해주세요."
          );
        } finally {
          setIsDeciding(false);
        }
      },
    });

  React.useEffect(() => {
    if (!planId || restaurants.length === 0) return;

    const rouletteItems: RouletteItem[] = restaurants.map((r) => ({
      id: String(r.id), // 🔥 나중에 restaurantId로 다시 쓸 거라 id를 그대로 넣어둠
      label: r.name,
      weight: 1,
    }));

    setItems(rouletteItems);

    const candidateIds = restaurants.map((r) => Number(r.id));
    const idx = getDeterministicWinnerIndex(planId, candidateIds);
    setWinnerIndex(idx);
  }, [planId, restaurants]);

  const handleSpinClick = React.useCallback(() => {
    if (winnerIndex === null || spinning || items.length === 0 || isDeciding)
      return;
    spinToIndex(winnerIndex);
  }, [winnerIndex, spinning, items.length, isDeciding, spinToIndex]);

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
