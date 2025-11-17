// src/pages/groups/GroupDetailPage.tsx
import { useParams, useNavigate } from "react-router-dom";
import { TopNavBar } from "@/widgets/top-navbar";
import { Button } from "@/shared/ui/button";
import { useGroupDetail } from "@/features/group-detail/useGroupDetail";
import MemberSectionCard from "@/widgets/groups/MemberSectionCard";
import PastAppointmentsSectionCard from "@/widgets/groups/PastAppointments";
import CreatePlanSheet from "@/features/group-detail/ui/CreatePlanSheet";
import * as React from "react";

export default function GroupDetailPage()
 {
  const [openCreate, setOpenCreate] = React.useState(false);  
  const { groupId = "" } = useParams();
  const navigate = useNavigate();
  const { data, loading } = useGroupDetail(groupId);
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
        <h1 className="text-center text-2xl font-extrabold tracking-tight">{data.roomName}</h1>
        <MemberSectionCard
          members={data.roomMemberList}
          // onInvite={() => navigate(`/groups/${groupId}/invite`)}
          // todo : 초청 버튼
          onInvite={()=>{
            alert('TODO: 초청 버튼')
          }}
          />

        {/* 이전 약속 섹션 */}
        <PastAppointmentsSectionCard
          items={data.planList}
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
      />
    </>
    
  );
}
