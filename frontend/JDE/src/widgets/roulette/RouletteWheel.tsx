// 목적: 룰렛 휠 UI (정확한 라벨 배치 + 큰 사이즈)
// 변경점: 라벨을 실제 반지름 기반 좌표에 배치, 휠 회전에 맞춰 자연스럽게 동작

import * as React from "react";
import type { RouletteItem } from "@/entities/roulette/types";

function useSize(ref: React.RefObject<HTMLElement | null>) {
  const [size, setSize] = React.useState({ w: 0, h: 0 });
  React.useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([entry]) => {
      const cr = entry.contentRect;
      setSize({ w: cr.width, h: cr.height });
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return size;
}

type Props = {
  items: RouletteItem[];
  gradientStops: string; // useRoulette에서 생성한 conic-gradient stops
  angle: number; // 현재 회전 각도
  durationMs: number; // 트랜지션 시간
  spinning: boolean; // 스핀 중 여부
  onSpin: () => void;
};

export default function RouletteWheel({
  items,
  gradientStops,
  angle,
  durationMs,
  spinning,
  onSpin,
}: Props) {
  // 각 섹터 중앙 각도(3시 기준) 계산
  const sectors = React.useMemo(() => {
    const weights = items.map((it) => it.weight ?? 1);
    const total = weights.reduce((a, b) => a + b, 0);
    const out: { midDeg: number; label: string; id: string }[] = [];
    let acc = 0;
    for (let i = 0; i < items.length; i++) {
      const share = (weights[i] / total) * 360;
      const mid = acc + share / 2; // 3시 기준
      out.push({ midDeg: mid, label: items[i].label, id: items[i].id });
      acc += share;
    }
    return out;
  }, [items]);

  const wheelRef = React.useRef<HTMLDivElement>(null);
  const { w } = useSize(wheelRef);
  const radius = Math.max(0, w / 2 - 36); // 가장자리와 라벨 간 여백(필요시 44~52로 조정)

  return (
    <div className="w-full mx-auto" style={{ maxWidth: "min(92vmin, 1100px)" }}>
      <div ref={wheelRef} className="relative aspect-square">
        {/* 휠 (회전) */}
        <div
          className="absolute inset-0 rounded-full shadow-xl border border-black/5"
          style={{
            background: `conic-gradient(${gradientStops})`,
            transform: `rotate(${angle}deg)`,
            transition: `transform ${durationMs}ms cubic-bezier(0.2, 0.9, 0.1, 1)`,
          }}
        >
          {/* 라벨 (부모가 회전) */}
          {sectors.map((s) => {
            // 12시 기준 각도로 변환
            const rad = (s.midDeg - 90) * (Math.PI / 180);
            const cx = w / 2;
            const cy = w / 2;
            const x = cx + radius * Math.cos(rad);
            const y = cy + radius * Math.sin(rad);
            return (
              <div
                key={s.id}
                className="absolute text-[12px] md:text-sm font-semibold text-white drop-shadow select-none whitespace-nowrap"
                style={{
                  left: `${x}px`,
                  top: `${y}px`,
                  // 휠이 회전하므로 라벨은 역회전(-angle)로 읽기 방향 유지
                  transform: `translate(-50%, -50%) rotate(${-angle}deg)`,
                }}
                aria-hidden
              >
                <span className="px-2 py-0.5 rounded bg-black/30">
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* 포인터 (12시 고정) */}
        <div
          className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-3"
          aria-hidden
        >
          <div
            className={`w-0 h-0 border-l-[12px] border-r-[12px] border-t-[18px] border-l-transparent border-r-transparent ${
              spinning ? "border-t-orange-400" : "border-t-black/80"
            } drop-shadow`}
          />
        </div>
      </div>

      {/* 컨트롤 */}
      <div className="mt-6 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={onSpin}
          disabled={spinning || items.length === 0}
          className="px-6 py-3 rounded-xl bg-[#FF8904] text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#E07A03] active:bg-[#C96D03]"
          aria-label="룰렛 돌리기"
        >
          {spinning ? "돌아가는 중..." : "룰렛 돌리기"}
        </button>
      </div>
    </div>
  );
}
