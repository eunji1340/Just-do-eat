// 목적: 단일 카드 UI + 제스처 바인딩 (배경/텍스트는 오버레이가 담당)

import { useSwipeHandler } from './useSwipeHandler'
import type { Restaurant } from '@/entities/restaurant/types'

type Props = {
  data: Restaurant
  onMove: (o: { x: number; y: number }) => void
  onSwiped: (dir: 'left' | 'right' | 'up') => void
}

export default function SwipeCard({ data, onMove, onSwiped }: Props) {
  const { offset, isDragging,  handleStart, handleMove, handleEnd } = useSwipeHandler({
    onMove,
    onSwipe: onSwiped,
  })

  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      onMouseDown={handleStart}
      onMouseMove={handleMove}
      onMouseUp={handleEnd}
      onTouchStart={handleStart}
      onTouchMove={handleMove}
      onTouchEnd={handleEnd}
      style={{
        transform: `translate(${offset.x}px, ${offset.y}px) rotate(${offset.x * 0.05}deg)`,
        transition: isDragging ? 'none' : 'transform 150ms ease',
      }}
    >
      <div className="bg-white rounded-2xl shadow-lg w-[92%] max-w-sm overflow-hidden">
        <img
          src={data.image[0]}
          alt={data.name}
          className="w-full h-56 object-cover"
          loading="lazy"
        />
        <div className="p-4 space-y-1">
          <h2 className="text-lg font-semibold">{data.name}</h2>
          <p className="text-sm text-gray-500"> {data.category} · ⭐ {data.rating}</p>
          <p className="text-xs text-gray-400 line-clamp-2">{data.summary}</p>
        </div>
      </div>
    </div>
  )
}
