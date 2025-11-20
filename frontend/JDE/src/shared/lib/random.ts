// 목적: 가중치 기반 랜덤 선택 유틸 (단일 책임)

import type { RouletteItem } from "@/entities/roulette/types";

export function weightedPick(items: RouletteItem[]): number {
  const weights = items.map((it) => it.weight ?? 1);
  const total = weights.reduce((a, b) => a + b, 0);
  const r = Math.random() * total;
  let accum = 0;
  for (let i = 0; i < weights.length; i++) {
    accum += weights[i];
    if (r < accum) return i;
  }
  return items.length - 1; // fallback
}
