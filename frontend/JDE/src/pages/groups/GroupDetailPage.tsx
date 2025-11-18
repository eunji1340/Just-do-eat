// src/pages/groups/GroupDetailPage.tsx
import { useParams, useNavigate } from "react-router-dom";
import { TopNavBar } from "@/widgets/top-navbar";
import { Button } from "@/shared/ui/button";
import { useGroupDetail } from "@/features/group-detail/useGroupDetail";
import MemberSectionCard from "@/widgets/groups/MemberSectionCard";
import PastAppointmentsSectionCard from "@/widgets/groups/PastAppointments";
import CreatePlanSheet from "@/features/group-detail/ui/CreatePlanSheet";
import * as React from "react";
import { requestInviteLink } from "@/features/group-detail/api/requestInviteLink";

export default function GroupDetailPage() {
  const [openCreate, setOpenCreate] = React.useState(false);

  // 🔗 초대 모달 상태
  const [inviteModalOpen, setInviteModalOpen] = React.useState(false);
  const [inviteLink, setInviteLink] = React.useState<string | null>(null);

  const { groupId = "" } = useParams();
  const navigate = useNavigate();
  const { data, loading } = useGroupDetail(groupId);

  // 🔗 초대 버튼 클릭 핸들러
// 🔗 초대 버튼 클릭 핸들러
async function handleInviteClick() {
  if (!groupId) return;

  try {
    // ❌ setInviteLoading(true);
    const res = await requestInviteLink(groupId);
    setInviteLink(res.inviteLink);
    setInviteModalOpen(true);
  } catch (error) {
    console.error(error);
    alert("초대 링크를 가져오지 못했습니다. 잠시 후 다시 시도해주세요.");
  } finally {
    // ❌ setInviteLoading(false);
  }
}


  // 🔗 링크 복사
  async function handleCopy() {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      alert("초대 링크가 클립보드에 복사되었습니다.");
    } catch {
      alert("복사에 실패했습니다. 직접 복사해주세요.");
    }
  }

  if (loading || !data) {
    return (
      <>
        <TopNavBar variant="default" onSearchClick={undefined} />
        <main className="px-4 pb-36 pt-3">
          <div className="h-40 animate-pulse rounded-2xl bg-muted/40" />
          <div className="mt-3 h-40 animate-pulse rounded-2xl bg-muted/40" />
        </main>
      </>
    );
  }

  return (
    <>
      <TopNavBar variant="default" onSearchClick={undefined} />
      <main className="px-4 pb-36 pt-3">
        <h1 className="text-center text-2xl font-extrabold tracking-tight">
          {data.roomName}
        </h1>

        <MemberSectionCard
          members={data.roomMemberList}
          onInvite={handleInviteClick} // ✅ 초대 API 연결
        />

        {/* 이전 약속 섹션 */}
        <PastAppointmentsSectionCard
          items={data.planList}
          members={data.roomMemberList}
          onSeeAll={() => navigate(`/groups/${groupId}/appointments`)}
        />
      </main>

      {/* 페이지 전용 CTA(플로팅)는 page에서 배치 OK) */}
      <div className="pointer-events-none fixed bottom-24 right-5 z-50 sm:right-[calc(50%-320px+20px)]">
        <Button
          className="pointer-events-auto rounded-full px-5 py-5 text-base font-bold shadow-lg"
          aria-label="약속 만들기"
          onClick={() => setOpenCreate(true)}
        >
          <span className="text-xl">＋</span>&nbsp;약속 만들기
        </Button>
      </div>

      {/* 바텀시트 */}
      <CreatePlanSheet 
        open={openCreate} 
        onOpenChange={setOpenCreate} 
        groupId={Number(groupId)} 
        members={data.roomMemberList}  
      />

      {/* 🔗 초대 링크 모달 */}
      {inviteModalOpen && inviteLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[90%] max-w-sm rounded-2xl bg-card p-4 shadow-lg">
            <h2 className="mb-2 text-lg font-semibold">모임 초대 링크</h2>
            <p className="mb-3 text-xs text-muted-foreground">
              이 링크를 공유하면 모임에 초대할 수 있어요.
            </p>

            <div className="mb-3 max-h-24 overflow-y-auto rounded-lg bg-muted/70 p-2 text-xs break-all">
              {inviteLink}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setInviteModalOpen(false)}>
                닫기
              </Button>
              <Button size="sm" onClick={handleCopy}>
                링크 복사
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 초대 버튼 로딩 상태는 MemberSectionCard 안에서
          스피너/비활성화로 활용하고 싶으면 onInvite에 loading도 내려주면 됩니다. */}
    </>
  );
}
