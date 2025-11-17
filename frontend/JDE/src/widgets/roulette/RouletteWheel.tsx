// 목적: 룰렛 휠 UI (정확한 라벨 배치 + 큰 사이즈, 고급 비주얼)
// 변경점(디자인만):
// - 바깥 림(금속 질감 그라데이션) + 안쪽 그림자 + 하이라이트 링
// - 유리 글레어(glare) 레이어로 코팅된 느낌
// - 슬라이스 경계선(미세한 빛 반사) + 테두리 눈금(ticks)
// - 중앙 허브(메탈 버튼)로 깊이감
// - 라벨 칩(가독성 높은 반투명 블랙 + 드롭섀도)
// - 포인터는 위쪽(border-top) 유지, 회전 중 색 강조
//
// 주의: 기능(각도/트랜지션/라벨 좌표/포인터·버튼 등)은 그대로 유지됩니다.

import * as React from "react";
import type { RouletteItem } from "@/entities/roulette/types";
import { Button } from "@/shared/ui/shadcn/button";

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
  gradientStops: string;
  angle: number;
  durationMs: number;
  spinning: boolean;
  onSpin: () => void;
  /** 추가: 상단 제목/설명 (옵션) */
  title?: string;
  subtitle?: string;
};

export default function RouletteWheel({
  items,
  gradientStops,
  angle,
  durationMs,
  spinning,
  onSpin,
  title,
  subtitle,
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

  // 가장자리와 라벨 간 여백: 44~52px 추천(큰 화면에서 과밀해 보이지 않음)
  const rimPadding = 48;
  const radius = Math.max(0, w / 2 - rimPadding);


// ...상단 import/useSize/Props/계산 로직 동일

  return (
    <div className="w-full mx-auto" style={{ maxWidth: "min(92vmin, 1100px)" }}>
      <div
        ref={wheelRef}
        className="relative aspect-square select-none bg-surface rounded-[32px]"
        role="application"
        aria-label="식당 추천 룰렛"
      >
        {/* ⬇⬇⬇ 추가: 상단 타이틀/설명 (포인터와 겹치지 않게 여백 확보) */}
        {(title || subtitle) && (
          <div className="absolute inset-x-4 top-8 z-30 text-center space-y-1">
            {title && (
              <h1 className="text-lg md:text-xl font-extrabold tracking-tight">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-xs md:text-sm text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
        )}

        {/* 바닥 그림자(아래쪽만) */}
        <div className="absolute inset-0 rounded-full shadow-floor" />

        {/* 바깥 림/하이라이트 … (이하 동일) */}
        <div
          className="absolute inset-0 rounded-full border-stroke-1"
          style={{
            background:
              "linear-gradient(to bottom, oklch(0.97 0 0), oklch(0.93 0 0))",
          }}
        />
        <div
          className="absolute inset-[8px] rounded-full"
          style={{
            background:
              "linear-gradient(135deg, rgba(0,0,0,.40), rgba(0,0,0,.08))",
          }}
        />
        <div className="absolute inset-[10px] rounded-full ring-stroke" />

        {/* 실제 회전하는 판 */}
        <div
          className="absolute inset-[18px] rounded-full will-change-transform border-border"
          style={{
            background: `conic-gradient(${gradientStops})`,
            transform: `rotate(${angle}deg)`,
            transition: `transform ${durationMs}ms cubic-bezier(0.2, 0.9, 0.1, 1)`,
            borderColor: "var(--color-border)",
            borderWidth: 1,
          }}
        >
          {/* 글레어 */}
          <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none">
            <div
              className="absolute -top-[52%] left-0 right-0 mx-auto h-[85%] w-[85%] rounded-[50%] blur-2xl"
              style={{
                background:
                  "radial-gradient(100% 70% at 50% 0%, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.08) 55%, rgba(255,255,255,0) 72%)",
              }}
            />
          </div>

          {/* 라벨(역회전) */}
          {sectors.map((s) => {
            const rad = (s.midDeg - 90) * (Math.PI / 180);
            const cx = w / 2;
            const cy = w / 2;
            const x = cx + radius * Math.cos(rad);
            const y = cy + radius * Math.sin(rad);
            return (
              <div
                key={s.id}
                className="absolute"
                style={{
                  left: `${x}px`,
                  top: `${y}px`,
                  transform: `translate(-50%, -50%) rotate(${-angle}deg)`,
                }}
                aria-hidden
              >
                <span
                  className={[
                    "text-[clamp(10px,1.6vmin,14px)] font-semibold tracking-tight leading-tight",
                    "px-2 py-0.5 rounded-md bg-black/35 text-white",
                    "shadow-[0_1px_2px_rgba(0,0,0,0.45)]",
                    "ring-1 border-stroke whitespace-nowrap",
                  ].join(" ")}
                  style={{
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical" as any,
                    display: "-webkit-box",
                    overflow: "hidden",
                    maxWidth: "38vmin",
                  }}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* 중앙 허브 */}
        <div className="absolute inset-0 grid place-items-center pointer-events-none">
          <div
            className="relative h-[18%] w-[18%] rounded-full"
            style={{
              background:
                "linear-gradient(to bottom, oklch(0.98 0 0), oklch(0.93 0 0))",
              boxShadow:
                "inset 0 2px 4px rgba(255,255,255,0.65), 0 10px 28px rgba(0,0,0,0.35)",
            }}
          >
            <div className="absolute inset-[10%] rounded-full ring-stroke" />
            <div className="absolute inset-[22%] rounded-full bg-white/30 blur-md" />
          </div>
        </div>

        {/* 포인터 (테마 연동) */}
        <div
          className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-3 z-30"
          aria-hidden
        >
          <div
            className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[18px] border-l-transparent border-r-transparent drop-shadow"
            style={{
              borderTopColor: spinning
                ? "var(--color-primary)"
                : "var(--color-fg)",
            }}
          />
        </div>
      </div>

      {/* 컨트롤 버튼 */}
      <div className="mt-6 flex items-center justify-center gap-3">
        <Button
          type="button"
          onClick={onSpin}
          disabled={spinning || items.length === 0}
          className="px-6 py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: "var(--color-primary)" }}
          onMouseDown={(e) => ((e.currentTarget.style.background as any) = "var(--color-s3)")}
          onMouseUp={(e) => ((e.currentTarget.style.background as any) = "var(--color-primary)")}
          onMouseEnter={(e) => ((e.currentTarget.style.background as any) = "var(--color-s2)")}
          onMouseLeave={(e) => ((e.currentTarget.style.background as any) = "var(--color-primary)")}
          aria-label="룰렛 돌리기"
        >
          {spinning ? "돌아가는 중..." : "룰렛 돌리기"}
        </Button>
      </div>
    </div>
  );
}
