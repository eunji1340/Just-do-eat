// 목적: 좌→우 스와이프 제스처 해석(카드 밀어 '액션 영역' 노출)
// 단일 책임: 제스처 상태/임계치/오픈여부 관리 (UI 없음)

import { useRef, useState } from 'react'

export type SwipeRevealState = {
  translateX: number
  isOpen: boolean
}

type Options = {
  /** 왼쪽으로 얼마나 밀어야 오픈으로 인정할지(px) */
  openThreshold?: number // 기본 72
  /** 최대 얼마까지 밀 수 있는지(px) - 음수값 */
  maxReveal?: number // 기본 -96
  /** 다른 카드가 열릴 때 닫히도록 외부에서 제어하려면 사용 */
  onOpenChange?: (open: boolean) => void
}

export function useSwipeReveal({
  openThreshold = 72,
  maxReveal = -96,
  onOpenChange,
}: Options = {}) {
  const startX = useRef(0)
  const [state, setState] = useState<SwipeRevealState>({ translateX: 0, isOpen: false })

  // 최신 translateX를 안전하게 참조하기 위한 ref (pointerup에서 상태 지연 방지)
  const translateRef = useRef(0)
  const draggingRef = useRef(false)
  const pointerIdRef = useRef<number | null>(null)

  function setOpen(next: boolean) {
    const nx = next ? maxReveal : 0
    translateRef.current = nx
    setState({ translateX: nx, isOpen: next })
    onOpenChange?.(next)
  }

  function clampToBounds(dx: number) {
    // 왼쪽으로만 허용(음수). 과도한 이동은 maxReveal로 clamp
    return Math.max(maxReveal, Math.min(0, dx))
  }

  function handlePointerDown(e: React.PointerEvent) {
    // 터치/마우스/펜 공통. 모바일 수평 드래그 우선권 확보
    pointerIdRef.current = e.pointerId
    ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
    draggingRef.current = true
    startX.current = e.clientX
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!draggingRef.current) return
    const dx = e.clientX - startX.current
    const next = clampToBounds(dx)
    // sub-pixel 누수 방지: 반올림
    const rounded = Math.round(next)
    translateRef.current = rounded
    setState((s) => ({ ...s, translateX: rounded }))
  }

  function finishGesture() {
    const opened = translateRef.current <= -openThreshold
    setOpen(opened)
    draggingRef.current = false
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (pointerIdRef.current !== null) {
      (e.currentTarget as HTMLElement).releasePointerCapture(pointerIdRef.current)
    }
    finishGesture()
    pointerIdRef.current = null
  }

  function handlePointerCancel(e: React.PointerEvent) {
    if (pointerIdRef.current !== null) {
      (e.currentTarget as HTMLElement).releasePointerCapture(pointerIdRef.current)
    }
    finishGesture()
    pointerIdRef.current = null
  }

  function handleMouseLeave() {
    // 포인터 캡처가 없는 환경 대비: 드래그 중이 아니고, 열리지도 않았으면 복귀
    if (!draggingRef.current && !state.isOpen) {
      translateRef.current = 0
      setState((s) => ({ ...s, translateX: 0 }))
    }
  }

  function close() {
    setOpen(false)
  }

  return {
    state,
    handlers: {
      // ✅ Pointer Events 로 터치/마우스 모두 동작
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerCancel,
      onMouseLeave: handleMouseLeave, // 보조
    },
    setOpen,
    close,
    maxReveal, // UI에서 폭 계산용으로 사용할 수 있게 노출
  }
}
