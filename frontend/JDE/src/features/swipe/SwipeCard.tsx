// 목적: 배경은 전면 이미지, 하단엔 윗모서리만 둥근 설명 카드(바텀시트 느낌)

import { Clock, MapPin } from 'lucide-react'
import { useSwipeHandler } from './useSwipeHandler'
import type { Restaurant } from '@/entities/restaurant/types'

type Props = {
  data: Restaurant
  onMove: (o: { x: number; y: number }) => void
  onSwiped: (dir: 'left' | 'right' | 'up') => void
}

export default function SwipeCard({ data, onMove, onSwiped }: Props) {
  const { offset, handleStart, handleMove, handleEnd } = useSwipeHandler({
    onMove,
    onSwipe: onSwiped,
  })

  return (
    <div
      className="absolute inset-0"
      onMouseDown={handleStart}
      onMouseMove={handleMove}
      onMouseUp={handleEnd}
      onTouchStart={handleStart}
      onTouchMove={handleMove}
      onTouchEnd={handleEnd}
      style={{
        transform: `translate(${offset.x}px, ${offset.y}px) rotate(${offset.x * 0.05}deg)`,
        transition: 'transform 80ms linear',
      }}
    >
      <div className="relative w-full h-dvh">
        {/* 1) 전체 배경 이미지 (카드 아래로 깔림) */}
        <img
          src={data.image[0]}
          alt={data.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* 가독성 보조 그라데이션(아래쪽만 살짝 어둡게) */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/20 via-black/5 to-transparent" />

        {/* 2) 하단 바텀시트 카드: 위쪽만 둥글게, 떠있는 그림자 */}
        <div className="absolute inset-x-0 bottom-0">
          <div className="rounded-t-3xl bg-white shadow-2xl p-4">
            <div className="p-5">
              {/* 상단 보조 정보 라인 */}
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{data.category ?? '카테고리'}</span>
                <span>
                  카카오 별점 <b className="text-gray-800">{(data.rating ?? 0).toFixed(1)}</b>
                </span>
              </div>

              {/* 식당명 */}
              <h2 className="mt-3 text-xl font-extrabold text-gray-900">{data.name}</h2>

              {/* 대표 메뉴 (있으면 노출) */}
              <div className="mt-2 text-sm text-gray-700">
                <div className="font-semibold">대표 메뉴</div>
                <div className="text-gray-500">
                  {data.menu?.[0]?.name ? data.menu[0].name : '정보 없음'}
                </div>
              </div>

              {/* 아이콘 정보 */}
              <div className="mt-3 space-y-2 text-sm text-gray-700">
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 mt-0.5 text-gray-500" />
                  <span className="leading-5">
                    영업 상태 · 오전 24:55 오픈/오후 24:55에 영업 종료
                    {/* 실제 영업시간 데이터 매핑 부 */}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5 text-gray-500" />
                  <span className="leading-5">역삼역에서 {formatDistance(data.distance_m)}</span>
                </div>
              </div>
            </div>

            {/* 안전 영역(노치/홈바) 대응 여백 */}
            <div className="h-4 pb-[env(safe-area-inset-bottom)]" />
          </div>
        </div>
      </div>
    </div>
  )
}

function formatDistance(m?: number) {
  if (!m && m !== 0) return '-'
  if (m >= 1000) return `${(m / 1000).toFixed(1)}km`
  return `${m}m`
}
