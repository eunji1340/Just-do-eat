// 목적: 진행 중/확정 스와이프 힌트를 전체 화면 배경과 텍스트로 보여줌
// 참고: 'null as const' 사용 금지(에러). 유니온 타입으로 처리.

import type { Offset } from '@/features/swipe/useSwipeHandler'

type SwipeFinal = 'left' | 'right' | 'up' | null

type Props = {
  offset: Offset
  finalDir?: SwipeFinal
  visible: boolean
}

function getState(offset: Offset, finalDir?: SwipeFinal): { dir: SwipeFinal; strength: number } {
  if (finalDir && finalDir !== null) return { dir: finalDir, strength: 1 }
  const ax = Math.abs(offset.x)
  const ay = Math.abs(offset.y)
  if (offset.x > 0 && ax > ay) return { dir: 'right', strength: Math.min(ax / 160, 1) }
  if (offset.x < 0 && ax > ay) return { dir: 'left', strength: Math.min(ax / 160, 1) }
  if (offset.y < 0 && ay >= ax) return { dir: 'up', strength: Math.min(ay / 160, 1) }
  return { dir: null, strength: 0 }
}

export default function SwipeOverlay({ offset, finalDir = null, visible }: Props) {
  const { dir, strength } = getState(offset, finalDir)
  const map: Record<Exclude<SwipeFinal, null>, { bg: string; label: string }> = {
    left:  { bg: 'bg-red-400', label: '싫어요' },
    right: { bg: 'bg-green-500',    label: '갈게요' },
    up:    { bg: 'bg-yellow-500',  label: '보류' },
  }

  const active = dir !== null && visible
  const k = dir as Exclude<SwipeFinal, null>
  const bg = active ? map[k].bg : 'bg-transparent'
  const text = active ? map[k].label : ''
  const opacity = finalDir ? 0.9 : strength * 0.75

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
  )
}
