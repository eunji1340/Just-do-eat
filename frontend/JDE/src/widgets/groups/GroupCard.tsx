// 목적: 모임 카드 프리젠테이션 + '나가기' 액션을 SwipeReveal에 제공
// 단일 책임: 카드의 내용/스타일(도메인 프리젠테이션)

import SwipeReveal from "@/features/swipe-reveal/SwipeReveal";
import type { Room, Plan } from "@/entities/groups/types";
import { Calendar, Users } from "lucide-react";

type Props = {
  group: Room;
  onLeave?: (id: number) => void; // 실제 나가기 동작(목업/API) 콜백
  onOpenGroup?: (id: number) => void; // 카드 클릭 시 이동 등
};

function getLatestPlan(room: Room): Plan | null {
  if (!room.planList || room.planList.length === 0) return null;

  // restaurantImageUrl이 있는 plan들을 우선적으로 선택 (확정된 식당이 있는 약속)
  const plansWithImage = room.planList.filter(
    (plan) => plan.restaurantImageUrl && plan.restaurantImageUrl.trim() !== ""
  );

  if (plansWithImage.length > 0) {
    // restaurantImageUrl이 있는 plan 중에서 startAt 기준으로 가장 최근 것 선택
    const validPlansWithImage = plansWithImage.filter(
      (plan) => plan.startAt && !Number.isNaN(new Date(plan.startAt).getTime())
    );

    if (validPlansWithImage.length > 0) {
      // startAt이 있는 것들 중 가장 최근 것
      const sorted = [...validPlansWithImage].sort(
        (a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime()
      );
      return sorted[0];
    } else {
      // startAt이 없어도 restaurantImageUrl이 있으면 첫 번째 것 반환
      return plansWithImage[0];
    }
  }

  // restaurantImageUrl이 없는 plan들 중에서 startAt 기준으로 가장 최근 것 선택
  const validPlans = room.planList.filter(
    (plan) => plan.startAt && !Number.isNaN(new Date(plan.startAt).getTime())
  );

  if (validPlans.length > 0) {
    const sorted = [...validPlans].sort(
      (a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime()
    );
    return sorted[0];
  }

  // startAt도 없고 restaurantImageUrl도 없으면 첫 번째 plan 반환
  return room.planList[0] || null;
}

function getPlanImages(room: Room): string[] {
  if (!room.planList || room.planList.length === 0) return [];

  // restaurantImageUrl이 있는 plan들을 필터링
  const plansWithImage = room.planList.filter(
    (plan) => plan.restaurantImageUrl && plan.restaurantImageUrl.trim() !== ""
  );

  if (plansWithImage.length === 0) return [];

  // startAt이 있는 것들을 우선 정렬 (최신순)
  const validPlans = plansWithImage.filter(
    (plan) => plan.startAt && !Number.isNaN(new Date(plan.startAt).getTime())
  );

  const invalidPlans = plansWithImage.filter(
    (plan) => !plan.startAt || Number.isNaN(new Date(plan.startAt).getTime())
  );

  // startAt 기준으로 정렬 (최신순)
  const sorted = [...validPlans].sort(
    (a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime()
  );

  // 정렬된 것들 + startAt 없는 것들 합치기
  const allPlans = [...sorted, ...invalidPlans];

  // 최대 4개까지 restaurantImageUrl 추출
  return allPlans
    .slice(0, 4)
    .map((plan) => plan.restaurantImageUrl)
    .filter((url): url is string => !!url && url.trim() !== "");
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
  const recentLabel =
    latestPlan && latestPlan.startAt
      ? formatKoreanDate(latestPlan.startAt)
      : latestPlan
      ? "약속 있음"
      : "아직 약속이 없어요";

  // 확정된 식당 이미지들 (최대 4개)
  const planImages = getPlanImages(group);
  const hasAnyImage = planImages.length > 0;

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
        {/* 썸네일 영역 */}
        <div className="p-4">
          {hasAnyImage ? (
            <div className="grid grid-cols-4 gap-3">
              {/* 확정된 식당 이미지들 (최대 4개) */}
              {planImages.map((imageUrl, index) => (
                <img
                  key={index}
                  src={imageUrl}
                  alt={`${group.roomName} 약속 ${index + 1}`}
                  className="aspect-square rounded-md object-cover"
                />
              ))}
              {/* 나머지 자리는 placeholder로 채우기 */}
              {Array.from({ length: 4 - planImages.length }).map((_, index) => (
                <img
                  key={`placeholder-${index}`}
                  src="/cute_man.png"
                  alt="이미지 없음"
                  className="aspect-square rounded-md object-contain object-center bg-gray-50 p-3"
                />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-20 rounded-md bg-gray-50 border border-gray-200">
              <div className="flex flex-col items-center gap-1 text-center">
                <Calendar className="w-5 h-5 text-gray-400" />
                <p className="text-xs text-gray-500 font-medium">
                  아직 약속이 없어요
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 텍스트 영역 */}
        <div className="p-3 pt-0">
          <h3 className="font-bold text-gray-900">{group.roomName}</h3>

          {/* 최근 만남 - 강조 */}
          <div className="mt-2 flex items-center gap-1.5 bg-orange-50 rounded-lg px-2.5 py-1.5 border border-orange-200 inline-flex">
            <Calendar className="w-3.5 h-3.5 text-orange-600" />
            <p className="text-xs font-semibold text-orange-700 m-0">
              최근 만남
            </p>
            <p className="text-xs font-bold text-orange-900 m-0">
              {recentLabel}
            </p>
          </div>

          {/* 멤버 */}
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-lg bg-gray-100 px-2 py-1 text-xs text-gray-700 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              {memberText}
            </span>
          </div>
        </div>
      </div>
    </SwipeReveal>
  );
}
