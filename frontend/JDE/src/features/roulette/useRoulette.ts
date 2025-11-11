// 목적: 룰렛 스핀 로직 + 회전 각도 계산 (단일 책임: 비즈니스 로직만)
// 사용: 컴포넌트는 angle/transition만 받아서 그려주고, 결과 콜백으로 알림

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  /** 스핀 한 바퀴 수(기본 6) + 목표 정렬에 필요한 잔여각 */
  baseTurns?: number;   // 기본 6
  durationMs?: number;  // 기본 4200
};

/** 각도 정규화(0~360) */
const norm = (d: number) => ((d % 360) + 360) % 360;

const POINTER_DEG = 0;

export function useRoulette({
  items,
  onFinish,
  baseTurns = 6,
  durationMs = 4200,
}: Options) {
  const [angle, setAngle] = useState(0);      // 누적 각도(CSS rotate에 그대로 적용)
  const [spinning, setSpinning] = useState(false);
  const [lastIndex, setLastIndex] = useState<number | null>(null);
  const timerRef = useRef<number | null>(null);

  /** 가중치/팔레트/그라디언트 준비 */
  const weights = useMemo(() => items.map((it) => it.weight ?? 1), [items]);
  const totalWeight = useMemo(
    () => weights.reduce((a, b) => a + b, 0),
    [weights]
  );
  const palette = useMemo(
    () => items.map((it, i) => it.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length]),
    [items]
  );
  const gradientStops = useMemo(() => {
    // conic-gradient: 3시가 0°, 시계방향 증가
    let acc = 0;
    return items
      .map((_, i) => {
        const share = (weights[i] / totalWeight) * 100;
        const from = acc;
        const to = acc + share;
        acc = to;
        return `${palette[i]} ${from}% ${to}%`;
      })
      .join(", ");
  }, [items, palette, totalWeight, weights]);

  /** targetIndex가 포인터(12시)에 오도록 '현재 각도 기준' 증분 각도 계산 */
  const calcDeltaToCenter = useCallback(
    (targetIndex: number, currentAngle: number) => {
      let start = 0; // 0~360 누적(CW), 기준은 3시
      for (let i = 0; i < items.length; i++) {
        const shareDeg = (weights[i] / totalWeight) * 360;
        if (i === targetIndex) {
          const mid = start + shareDeg / 2; // 슬라이스 중앙각(3시 기준)

          // 지터를 슬라이스 내부로만 제한 (경계 튐 방지)
          const half = shareDeg / 2;
          const margin = Math.min(2, Math.max(0, half * 0.15)); // 최대 2°
          const maxJitter = Math.max(0, half - margin);
          const jitter = maxJitter === 0 ? 0 : (Math.random() * 2 - 1) * maxJitter;

          // 현재 각도에서 추가로 얼마나 돌리면 "mid+jitter"가 12시(=270°)에 오는가?
          const cur = norm(currentAngle);
          const need = norm(POINTER_DEG - (mid + jitter) - cur);

          // baseTurns는 미관용 여분 회전, need는 정렬에 필요한 잔여각
          return baseTurns * 360 + need;
        }
        start += shareDeg;
      }
      return baseTurns * 360; // 방어 코드
    },
    [items.length, totalWeight, weights, baseTurns]
  );

  /** 스핀 실행 */
  const spin = useCallback(() => {
    if (spinning || items.length === 0) return;
    setSpinning(true);

    const picked = weightedPick(items); // 가중치로 먼저 뽑음(화면/콜백 일치의 핵심)
    setLastIndex(picked);

    // 현재 angle 기준으로 정확히 12시에 맞도록 증분각 계산
    const delta = calcDeltaToCenter(picked, angle);
    const next = angle + delta;
    setAngle(next);

    // 트랜지션 종료 시점에 콜백(지금은 타이머 방식, 필요시 onTransitionEnd로 교체 가능)
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setSpinning(false);
      onFinish?.({ index: picked, item: items[picked] });
    }, durationMs);
  }, [spinning, items, angle, calcDeltaToCenter, durationMs, onFinish]);

  /** 언마운트/재실행 시 타이머 정리 */
  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  return {
    angle,          // CSS: transform: rotate(${angle}deg)
    spinning,
    lastIndex,
    durationMs,
    gradientStops,  // CSS: background: conic-gradient(${gradientStops})
    palette,
    spin,
  } as const;
}
