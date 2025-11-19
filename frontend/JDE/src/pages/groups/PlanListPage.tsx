// src/pages/groups/PlanListPage.tsx
// 목적: 특정 모임(group)의 모든 약속(plan) 목록을 보여주는 페이지

import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { TopNavBar } from "@/widgets/top-navbar";
import { useGroupDetail } from "@/features/group-detail/useGroupDetail";

// 멤버 표시: "첫번째 사람 외 n명"
function formatMembers(members: { userName: string }[]) {
  if (!members || members.length === 0) return "참여자 없음";
  if (members.length === 1) return members[0].userName;
  return `${members[0].userName} 외 ${members.length - 1}명`;
}

// 날짜/시간 표시 포맷터
function formatDateTime(isoString: string) {
  if (!isoString) return "시간 미정";
  const date = new Date(isoString);
  return date.toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PlanListPage() {
  const navigate = useNavigate();
  const { groupId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const statusFilter = searchParams.get("status"); // "ongoing" 또는 "decided"

  const { data, loading } = useGroupDetail(groupId);

  // 로딩/데이터 없음 처리
  if (loading || !data) {
    return (
      <>
        <TopNavBar variant="label" label="모임" onBack={() => navigate(-1)} />
        <main className="px-4 pb-36 pt-3">
          <div className="mb-3 h-8 w-40 animate-pulse rounded-full bg-muted/40" />
          <div className="h-24 animate-pulse rounded-2xl bg-muted/40" />
          <div className="mt-2 h-24 animate-pulse rounded-2xl bg-muted/40" />
        </main>
      </>
    );
  }

  // 상태별 필터링
  let filteredPlans = [...data.planList];
  if (statusFilter === "ongoing") {
    // 진행중인 약속: DECIDED가 아닌 것들
    filteredPlans = filteredPlans.filter((plan) => plan.status !== "DECIDED");
  } else if (statusFilter === "decided") {
    // 지난 약속: DECIDED만
    filteredPlans = filteredPlans.filter((plan) => plan.status === "DECIDED");
  }

  // 최신 순 정렬
  const sortedPlans = filteredPlans.sort((a, b) => {
    const tA = new Date(a.startAt).getTime();
    const tB = new Date(b.startAt).getTime();
    return tB - tA;
  });

  const memberText = formatMembers(data.roomMemberList);

  return (
    <>
      <TopNavBar
        variant="label"
        label={data.roomName}
        onBack={() => navigate(-1)}
        onSearchClick={() => navigate("/search/start")}
      />
      <main className="px-4 pb-36 pt-3">
        {/* 상단 헤더 */}
        <header className="mb-4">
          <h1 className="text-lg font-extrabold tracking-tight">
            {statusFilter === "ongoing"
              ? "진행중인 약속"
              : statusFilter === "decided"
              ? "지난 약속들"
              : "모임의 모든 약속"}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {memberText} · 총 {sortedPlans.length}개 약속
          </p>
        </header>

        {/* 약속 없음 */}
        {sortedPlans.length === 0 && (
          <div className="mt-10 rounded-2xl border border-neutral-300 bg-card/40 p-6 text-center text-sm text-muted-foreground">
            {statusFilter === "ongoing"
              ? "진행중인 약속이 없어요."
              : statusFilter === "decided"
              ? "지난 약속이 없어요."
              : "아직 등록된 약속이 없어요."}
            <br />
            {!statusFilter && (
              <>
                모임 상세에서{" "}
                <span className="font-semibold">"약속 만들기"</span> 로 첫 약속을 추가해 보세요.
              </>
            )}
          </div>
        )}

        {/* 약속 리스트 */}
        <section className="space-y-3">
          {sortedPlans.map((plan) => (
            <article
              key={plan.planId}
              onClick={() => {
                // DECIDED 상태이고 restaurantId가 있으면 식당 상세로, 아니면 약속 상세로
                if (plan.status === "DECIDED" && plan.restaurantId) {
                  navigate(`/restaurants/${plan.restaurantId}`);
                } else {
                  navigate(`/plans/${plan.planId}`);
                }
              }}
              className="flex gap-3 rounded-2xl border border-neutral-300 bg-card p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            >
              {/* 왼쪽 이미지 */}
              {plan.restaurantImageUrl ? (
                <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-muted">
                  <img
                    src={plan.restaurantImageUrl}
                    alt={plan.restaurantName ?? "약속 장소"}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-muted text-[10px] text-muted-foreground">
                  이미지 없음
                </div>
              )}

              {/* 오른쪽 정보 */}
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-semibold">
                      {plan.planName ?? plan.restaurantName ?? "이름 없는 약속"}
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDateTime(plan.startAt)}
                    </p>
                  </div>
                </div>

                <p className="mt-2 text-xs text-muted-foreground">{memberText}</p>
              </div>
            </article>
          ))}
        </section>
      </main>
    </>
  );
}
