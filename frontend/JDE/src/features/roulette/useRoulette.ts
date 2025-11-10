// 목적: 룰렛 스핀 로직 + 회전 각도 계산 (단일 책임: 비즈니스 로직만)
// 사용: 컴포넌트는 angle/transition만 받아서 그려주고, 결과 콜백으로 알림

import { useCallback, useMemo, useRef, useState } from "react";
import type { RouletteItem } from "@/entities/roulette/types";
import { weightedPick } from "@/shared/lib/random";

const DEFAULT_COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#FFD93D",
  "#6C5CE7",
  "#55E6C1",
  "#F79F1F",
  "#45AAF2",
  "#B33771",
  "#26de81",
  "#a55eea",
];

export type SpinResult = {
  index: number;
  item: RouletteItem;
};

type Options = {
  items: RouletteItem[];
  onFinish?: (result: SpinResult) => void;
  /** 스핀 한 바퀴 수(기본 6)와 추가 랜덤 회전값을 조합 */
  baseTurns?: number; // 기본 6
  durationMs?: number; // 기본 4200ms
};

export function useRoulette({
  items,
  onFinish,
  baseTurns = 6,
  durationMs = 4200,
}: Options) {
  const [angle, setAngle] = useState(0); // 현재 총 회전 각도 (누적)
  const [spinning, setSpinning] = useState(false);
  const [lastIndex, setLastIndex] = useState<number | null>(null);
  const timerRef = useRef<number | null>(null);

  // 섹터 각도(가중치 반영). 단, 렌더링은 conic-gradient로 간단화.
  const weights = useMemo(() => items.map((it) => it.weight ?? 1), [items]);
  const totalWeight = useMemo(
    () => weights.reduce((a, b) => a + b, 0),
    [weights]
  );

  const palette = useMemo(() => {
    return items.map(
      (it, i) => it.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length]
    );
  }, [items]);

  /** index를 룰렛 포인터(12시 방향)에 맞추기 위한 목표 각도 계산 */
  const calcTargetAngle = useCallback(
    (targetIndex: number) => {
      // conic-gradient는 0deg가 3시 방향, 시계방향 증가. 여기선 12시 포인터에 맞추고 싶음.
      // 각 섹터의 시작각/중앙각을 가중치 기반으로 구해 중앙에 포인터가 멈추게 함.
      let start = 0; // 0~360 누적
      for (let i = 0; i < items.length; i++) {
        const share = (weights[i] / totalWeight) * 360;
        if (i === targetIndex) {
          const mid = start + share / 2; // 섹터 중앙각(3시 기준)
          // 12시(= -90deg)에서 mid로 정렬하려면, 총 회전각을 (baseTurns*360 + (270 - mid)) 추가
          const randomJitter = (Math.random() - 0.5) * 10; // ±5도 흔들림으로 덜 기계적 느낌
          const target = baseTurns * 360 + (270 - (mid + randomJitter));
          return target;
        }
        start += share;
      }
      // 방어적: 못 찾으면 0
      return baseTurns * 360;
    },
    [items.length, totalWeight, weights, baseTurns]
  );

  const spin = useCallback(() => {
    if (spinning || items.length === 0) return;
    setSpinning(true);

    const picked = weightedPick(items);
    setLastIndex(picked);

    const delta = calcTargetAngle(picked);
    // 새 목표 각도 = 현 각도 + delta (항상 누적 회전)
    const next = angle + delta;
    setAngle(next);

    // CSS transition 종료 시점 알림
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setSpinning(false);
      onFinish?.({ index: picked, item: items[picked] });
    }, durationMs);
  }, [spinning, items, angle, calcTargetAngle, durationMs, onFinish]);

  const gradientStops = useMemo(() => {
    // conic-gradient 문자열 생성 (가중치 기반 비율)
    let acc = 0;
    return items
      .map((it, i) => {
        const share = (weights[i] / totalWeight) * 100; // %
        const from = acc;
        const to = acc + share;
        acc = to;
        return `${palette[i]} ${from}% ${to}%`;
      })
      .join(", ");
  }, [items, palette, totalWeight, weights]);

  return {
    angle,
    spinning,
    lastIndex,
    durationMs,
    gradientStops,
    palette,
    spin,
  } as const;
}
