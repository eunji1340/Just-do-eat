// 목적: 앞(콘텐츠) / 뒤(액션영역) 두 레이어를 겹쳐놓고
// 앞 레이어를 스와이프로 밀어 뒤 레이어를 드러내는 컨테이너
// 단일 책임: 제스처 + 레이아웃 (액션 클릭은 부모가 처리)

import * as React from 'react'
import { useSwipeReveal } from './useSwipeReveal'

type Props = {
  children: React.ReactNode
  reveal: React.ReactNode
  onOpenChange?: (open: boolean) => void
  openThreshold?: number
  maxReveal?: number // 음수(px)
  onFrontClick?: () => void
  className?: string
}

export default function SwipeReveal({
  children,
  reveal,
  onOpenChange,
  openThreshold,
  maxReveal,
  onFrontClick,
  className,
}: Props) {
  const { state, handlers, maxReveal: usedMaxReveal } = useSwipeReveal({
    onOpenChange,
    openThreshold,
    maxReveal,
  })

  const absReveal = Math.round(Math.abs(usedMaxReveal ?? 96)) // (1) 정수 보정

  function handleFrontClick(e: React.MouseEvent) {
    if (state.isOpen) {
      e.preventDefault()
      e.stopPropagation()
      handlers.onPointerCancel?.(e as any)
      return
    }
    onFrontClick?.()
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-white ${className ?? ''}`}>
      {/* (2) 뒤 레이어: 우측 라운드 + 1px 안쪽으로 + 상하 1px inset */}
      <div
        className="absolute right-0 left-auto flex items-stretch justify-end bg-red-500 text-white rounded-r-2xl"
        style={{ width: absReveal, top: 1, bottom: 1, right: -1 }} // ← 핵심
        aria-hidden={false}
      >
        {reveal}
      </div>

      {/* (3) 우측 에지 가드(마스킹) — sub-pixel 잔상 숨김 */}
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-[2px] bg-white rounded-r-2xl z-[5]"
      />

      {/* (4) 앞 레이어도 둥근모서리+오버플로우로 2중 클리핑 */}
      <div
        className="relative bg-gray-50 shadow-sm transition-transform duration-200 will-change-transform 
                   select-none touch-pan-y rounded-2xl overflow-hidden"
        style={{ transform: `translate3d(${state.translateX}px,0,0)`, backfaceVisibility: 'hidden' }}
        {...handlers}
        onClick={handleFrontClick}
      >
        {children}
      </div>
    </div>
  )
}
