// 목적: 모임 카드 프리젠테이션 + '나가기' 액션을 SwipeReveal에 제공
// 단일 책임: 카드의 내용/스타일(도메인 프리젠테이션)

import SwipeReveal from '@/features/swipe-reveal/SwipeReveal'
import type { Room, Plan } from '@/entities/groups/types'

type Props = {
  group: Room
  onLeave?: (id: number) => void // 실제 나가기 동작(목업/API) 콜백
  onOpenGroup?: (id: number) => void // 카드 클릭 시 이동 등
}

function getLatestPlan(room: Room): Plan | null {
  if (!room.planList || room.planList.length === 0) return null;

  // startAt 기준으로 가장 최근 것 선택
  const sorted = [...room.planList].sort(
    (a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime()
  );
  return sorted[0];
}

function formatKoreanDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "날짜 정보 없음";
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${y}년 ${m}월 ${day}일`;
}


export default function MyMeetingCard({ group, onLeave, onOpenGroup }: Props) {
  function handleLeave() {
    const ok = window.confirm(
      `정말 '${group.roomName}' 모임에서 나가시겠습니까?`
    );
    if (!ok) return;
    onLeave?.(group.roomId);
  }

  // 멤버 텍스트
  const activeMembers = group.roomMemberList.filter((m) => !m.del);
  const memberCount = activeMembers.length;
  const firstName = activeMembers[0]?.userName ?? "멤버 없음";
  const memberText =
    memberCount <= 1 ? firstName : `${firstName} 외 ${memberCount - 1}명`;

  // 최신 약속 정보
  const latestPlan = getLatestPlan(group);
  const recentLabel = latestPlan
    ? formatKoreanDate(latestPlan.startAt)
    : "아직 약속이 없어요";

  // 썸네일: 최신 plan의 이미지 1장만 사용 (나머지는 placeholder)
  const thumbnailUrls: (string | null)[] = [
    latestPlan?.restaurantImageUrl || null,
    null,
    null,
    null,
  ];

  return (
    <SwipeReveal
      className="mb-3"
      reveal={
        <button
          className="h-full px-6 font-bold"
          onClick={handleLeave}
          aria-label={`${group.roomName} 나가기`}
        >
          나가기
        </button>
      }
      onFrontClick={() => onOpenGroup?.(group.roomId)}
    >
      <div className="rounded-2xl border border-neutral-300 bg-white">
        {/* 썸네일 4분할 */}
        <div className="grid grid-cols-4 gap-3 p-4">
          {thumbnailUrls.map((url, i) =>
            url ? (
              <img
                key={i}
                src={url}
                alt={`${group.roomName} 썸네일`}
                className="aspect-square rounded-md object-cover"
              />
            ) : (
              <div
                key={i}
                className="aspect-square rounded-md bg-gray-200"
              />
            )
          )}
        </div>

        {/* 텍스트 영역 */}
        <div className="p-3">
          <h3 className="font-bold text-gray-900">{group.roomName}</h3>

          <p className="mt-0.5 text-sm text-gray-500">
            최근 만남 {recentLabel}
          </p>

          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-lg bg-gray-100 px-2 py-1 text-xs text-gray-700">
              {memberText}
            </span>
          </div>
        </div>
      </div>
    </SwipeReveal>
  );
}
