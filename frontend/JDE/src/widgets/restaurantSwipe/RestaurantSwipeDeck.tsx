// 목적: 덱(스택) 관리 + 전체 화면 오버레이 제어(확정 후 잠깐 유지)

import * as React from 'react'
import SwipeCard from '@/features/swipe/SwipeCard'
import SwipeOverlay from './SwipeOverlay'
import type { Restaurant } from '@/entities/restaurant/types'
import type { Offset } from '@/features/swipe/useSwipeHandler'
import { X, Check, ArrowDown, CircleAlert, Star    } from "lucide-react";
import { CircularButton } from "@/shared/ui/button/circular-button";


type Props = {
  items: Restaurant[]
  onTopSwiped?: (dir: 'left' | 'right' | 'up', item: Restaurant) => void
  overlayHoldMs?: number
}

export default function RestaurantSwipeDeck({ items, onTopSwiped, overlayHoldMs = 300 }: Props) {
  const [index, setIndex] = React.useState(0)
  const [offset, setOffset] = React.useState<Offset>({ x: 0, y: 0 })
  const [finalDir, setFinalDir] = React.useState<'left' | 'right' | 'up' | null>(null)
  const [overlayVisible, setOverlayVisible] = React.useState(true)

  function handleMove(o: Offset) {
    setOffset(o)
    setFinalDir(null)
    setOverlayVisible(true)
  }

  function handleSwiped(dir: 'left' | 'right' | 'up') {
    const cur = items[index]
    setFinalDir(dir)
    setOverlayVisible(true)
    onTopSwiped?.(dir, cur)

    window.setTimeout(() => {
      setIndex((i) => i + 1)
      setFinalDir(null)
      setOffset({ x: 0, y: 0 })
      setOverlayVisible(false)
      requestAnimationFrame(() => setOverlayVisible(true))
    }, overlayHoldMs)
  }

  const top = items[index]

  return (
  <div className="relative h-dvh flex items-center justify-center overflow-hidden">
    {/* 오버레이 */}
    <SwipeOverlay offset={offset} finalDir={finalDir} visible={overlayVisible} />

    {/* 카드 */}
    {top ? (
      <SwipeCard data={top} onMove={handleMove} onSwiped={handleSwiped} />
    ) : (
      <div className="absolute inset-0 flex items-center justify-center text-gray-500">
        더 이상 카드가 없어요
      </div>
    )}

    {/* ✅ 여기가 “Deck 반환부에 버튼 추가” 부분 */}
    <div className="pointer-events-none absolute bottom-6 left-0 right-0 flex items-center justify-center gap-4">
      <div className="pointer-events-auto flex items-center gap-4">
        <CircularButton
          type="dislike"
          icon={<X />}
          onClick={() => handleSwiped('left')}
          aria-label="싫어요"
        />
        <CircularButton
          type="bookmark"
          icon={<Star  />}
          onClick={() => handleSwiped('left')}
          aria-label="싫어요"
        />

        <CircularButton
          type="next"
          icon={<ArrowDown  />}
          onClick={() => handleSwiped('up')}
          aria-label="보류"
        />
        <CircularButton
          type="info"
          icon={<CircleAlert  />}
          onClick={() => handleSwiped('up')}
          aria-label="보류"
        />
        <CircularButton
          type="confirm"
          icon={<Check />}
          onClick={() => handleSwiped('right')}
          aria-label="갈게요"
        />
      </div>
    </div>
  </div>
)
}

