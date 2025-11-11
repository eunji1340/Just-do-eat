// 목적: 룰렛 단독 전체화면(데스크탑 포함) 배치

import * as React from "react";
import type { RouletteItem } from "@/entities/roulette/types";
import RouletteWheel from "@/widgets/roulette/RouletteWheel";
import { useRoulette } from "@/features/roulette/useRoulette";

const MOCK: RouletteItem[] = [
  { id: "r1", label: "봉추찜닭", weight: 1, color: "#FF6B6B" },
  { id: "r2", label: "을지로 골뱅이", weight: 1, color: "#4ECDC4" },
  { id: "r3", label: "김밥행", weight: 1, color: "#FFD93D" },
  { id: "r4", label: "춘삼식당", weight: 1, color: "#6C5CE7" },
  { id: "r5", label: "푸주옥", weight: 1, color: "#45AAF2" },
];

export default function RoulettePage() {
  const [items] = React.useState<RouletteItem[]>(MOCK);
  const { angle, spinning, durationMs, gradientStops, spin } = useRoulette({
    items,
    onFinish: ({ item }) => alert(`오늘은 ➜ ${item.label}!`),
  });

  return (
    <main className="min-h-dvh bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-6 md:py-10">
        {/* 상단 제목/설명 */}
        <header className="text-center space-y-1">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            모임 장소 룰렛
          </h1>
          <p className="text-sm text-muted-foreground">
            후보 중 하나를 랜덤으로 골라 보세요.
          </p>
        </header>

        {/* 제목과 휠 사이 여백만 주기 */}
        <section className="mt-6 md:mt-8 lg:mt-10 grid place-items-center">
          <RouletteWheel
            items={items}
            gradientStops={gradientStops}
            angle={angle}
            durationMs={durationMs}
            spinning={spinning}
            onSpin={spin}
          />
        </section>
      </div>
    </main>
  );
}


