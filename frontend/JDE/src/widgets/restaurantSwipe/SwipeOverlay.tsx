// 목적: 진행 중/확정 스와이프 힌트를 전체 화면 배경과 텍스트로 보여주는 오버레이
// 타입 안정성 강화하여 map 인덱싱 오류 제거

import type { Offset } from "@/features/feed/useSwipeHandler";

type SwipeFinal = "left" | "right" | "up" | null;

type Props = {
  offset: Offset;
  finalDir?: SwipeFinal;
  visible: boolean;
};

/** 방향 + 강도 계산 */
function getState(
  offset: Offset,
  finalDir?: SwipeFinal
): { dir: SwipeFinal; strength: number } {
  if (finalDir) return { dir: finalDir, strength: 1 };

  const ax = Math.abs(offset.x);
  const ay = Math.abs(offset.y);

  if (ax > ay) {
    if (offset.x > 0) return { dir: "right", strength: Math.min(ax / 160, 1) };
    if (offset.x < 0) return { dir: "left", strength: Math.min(ax / 160, 1) };
  } else {
    if (offset.y < 0) return { dir: "up", strength: Math.min(ay / 160, 1) };
  }

  return { dir: null, strength: 0 };
}

/** map 타입 명확히 지정 */
const dirMap = {
  left: { bg: "bg-red-400", label: "싫어요" },
  right: { bg: "bg-green-500", label: "갈게요" },
  up: { bg: "bg-yellow-500", label: "보류" },
} as const;

export default function SwipeOverlay({
  offset,
  finalDir = null,
  visible,
}: Props) {
  const { dir, strength } = getState(offset, finalDir);

  /** dir가 null이면 어떤 접근도 하지 않음 → TS 문제 해결 */
  const active = dir !== null && visible;

  /** dir이 null이 아닐 때만 map 접근 */
  const bg = active ? dirMap[dir].bg : "bg-transparent";
  const text = active ? dirMap[dir].label : "";

  const opacity = finalDir ? 0.9 : strength * 0.75;

  return (
    <div
      className={`pointer-events-none fixed inset-0 transition-[background-color,opacity] duration-150 ${bg}`}
      style={{ opacity: active ? opacity : 0 }}
      aria-hidden
    >
      {active && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-full px-6 py-3 text-white text-2xl font-extrabold drop-shadow-lg">
            {text}
          </div>
        </div>
      )}
    </div>
  );
}
