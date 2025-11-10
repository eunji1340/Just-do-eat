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
  { id: "r5", label: "푸주옥", weight: 2, color: "#45AAF2" },
];

export default function RoulettePage() {
  const [items] = React.useState<RouletteItem[]>(MOCK);

  const { angle, spinning, durationMs, gradientStops, spin } = useRoulette({
    items,
    onFinish: ({ item }) => {
      alert(`오늘은 ➜ ${item.label}!`);
    },
  });

  return (
    <main className="min-h-dvh bg-gradient-to-b from-gray-50 to-white">
      {/* 헤더 + 중앙정렬 영역 */}
      <div className="mx-auto max-w-7xl px-4 py-6 md:py-10">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-center">
          모임 장소 룰렛
        </h1>
        <p className="mt-1 text-sm text-gray-600 text-center">
          후보 중 하나를 랜덤으로 골라 보세요.
        </p>

        {/* 룰렛 단독, 화면에 가득 차도록 */}
        <div className="mt-6 grid place-items-center">
          <RouletteWheel
            items={items}
            gradientStops={gradientStops}
            angle={angle}
            durationMs={durationMs}
            spinning={spinning}
            onSpin={spin}
          />
        </div>
      </div>
    </main>
  );
}
