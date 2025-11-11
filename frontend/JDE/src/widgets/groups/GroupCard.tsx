// 목적: 모임 카드 프리젠테이션 + '나가기' 액션을 SwipeReveal에 제공
// 단일 책임: 카드의 내용/스타일(도메인 프리젠테이션)

import SwipeReveal from '@/features/swipe-reveal/SwipeReveal'
import type { Group } from '@/entities/groups/types'

type Props = {
  group: Group
  onLeave?: (id: number) => void // 실제 나가기 동작(목업/API) 콜백
  onOpenGroup?: (id: number) => void // 카드 클릭 시 이동 등
}

export default function MyMeetingCard({ group, onLeave, onOpenGroup }: Props) {
  function handleLeave() {
    const ok = window.confirm(`정말 '${group.title}' 모임에서 나가시겠습니까?`)
    if (!ok) return
    onLeave?.(group.id)
  }

  return (
    <SwipeReveal
      className="mb-3"
      reveal={
        <button
          className="h-full px-6 font-bold"
          onClick={handleLeave}
          aria-label={`${group.title} 나가기`}
        >
          나가기
        </button>
      }
      onFrontClick={() => onOpenGroup?.(group.id)}
    >
      {/* === 카드 본문(앞 레이어) === */}
      <div className='bg-white rounded-2xl border border-neutral-300'>
        {/* 썸네일 4분할 */}
        <div className="grid grid-cols-4 gap-3 p-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-square bg-gray-200 rounded-md" />
          ))}
        </div>

        {/* 텍스트 영역 */}
        <div className="p-3">
          <h3 className="font-bold text-gray-900">{group.title}</h3>
          <p className="text-sm text-gray-500 mt-0.5">최근 만남 {group.recentDate}</p>

          <div className="flex gap-2 mt-2 flex-wrap">
            {group.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-gray-100 text-xs text-gray-700 rounded-lg"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </SwipeReveal>
  )
}
