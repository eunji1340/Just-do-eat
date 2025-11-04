// 목적: 스와이프 제스처 해석 + 진행 중 오프셋을 상위로 리포트

import { useRef, useState } from 'react'

export type SwipeDir = 'left' | 'right' | 'up'
export type Offset = { x: number; y: number }

type Options = {
  onMove?: (offset: Offset) => void
  onSwipe: (dir: SwipeDir) => void
  thresholdX?: number
  thresholdY?: number
}

export function useSwipeHandler({ onMove, onSwipe, thresholdX = 120, thresholdY = 120 }: Options) {
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const start = useRef({ x: 0, y: 0 })

  function point(e: React.TouchEvent | React.MouseEvent) {
    return 'touches' in e ? e.touches[0] : (e as React.MouseEvent)
  }

  function handleStart(e: React.TouchEvent | React.MouseEvent) {
    setIsDragging(true)
    const p = point(e)
    start.current = { x: p.clientX, y: p.clientY }
  }

  function handleMove(e: React.TouchEvent | React.MouseEvent) {
    if (!isDragging) return
    const p = point(e)
    const next = { x: p.clientX - start.current.x, y: p.clientY - start.current.y }
    setOffset(next)
    onMove?.(next)
  }

  function handleEnd() {
    setIsDragging(false)
    const { x, y } = offset
    if (x > thresholdX) onSwipe('right')
    else if (x < -thresholdX) onSwipe('left')
    else if (y < -thresholdY) onSwipe('up')
    setOffset({ x: 0, y: 0 })
    onMove?.({ x: 0, y: 0 })
  }

  return { offset, handleStart, handleMove, handleEnd }
}
