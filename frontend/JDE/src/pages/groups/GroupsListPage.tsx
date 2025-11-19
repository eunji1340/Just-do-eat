// src/pages/groups/GroupsListPage.tsx

import { useNavigate } from "react-router-dom";
import { TopNavBar } from "@/widgets/top-navbar";
import { Button } from "@/shared/ui/shadcn/button";
import { Plus } from "lucide-react";
import * as React from "react";

import CreateGroupSheet from "@/features/groups/ui/CreateGroupSheet";
import { useMyGroups } from "@/features/groups/hooks/useMyGroups";

// ✅ 기존 GroupCard 대신 MyMeetingCard 사용
import MyMeetingCard from "@/widgets/groups/GroupCard";

// ✅ 나가기 API
import { leaveGroup } from "@/features/groups/api/leaveGroup";

export default function GroupsListPage() {
  const navigate = useNavigate();
  const [openCreate, setOpenCreate] = React.useState(false);

  const { rooms, isLoading, error } = useMyGroups();

  // ✅ 나가기로 처리한 roomId들을 따로 관리 (렌더링에서만 숨김)
  const [leavingIds, setLeavingIds] = React.useState<number[]>([]);

  // 실제로 화면에 보이는 방 목록 (나간 방 제외)
  const visibleRooms = rooms.filter(
    (room) => !leavingIds.includes(room.roomId)
  );
  const hasRooms = visibleRooms.length > 0;

  function handleCreated(roomId: number) {
    navigate(`/groups/${roomId}`);
  }

  // ✅ "모임 나가기" 실제 동작
  async function handleLeave(roomId: number) {
    try {
      // 1) 일단 화면에서 숨기기 (낙관적 업데이트)
      setLeavingIds((prev) => (prev.includes(roomId) ? prev : [...prev, roomId]));

      // 2) 서버에 DELETE 요청
      await leaveGroup(roomId);

      // 3) 필요하면 토스트/알람으로 성공 알리기
      // toast.success("모임에서 나갔습니다.");
    } catch (e: any) {
      // 실패하면 다시 보이게 복구
      setLeavingIds((prev) => prev.filter((id) => id !== roomId));
      alert(e.message ?? "모임 나가기에 실패했습니다.");
    }
  }

  // ✅ 카드 클릭 시 모임 상세로 이동
  function handleOpenGroup(roomId: number) {
    navigate(`/groups/${roomId}`);
  }

  return (
    <>
      <TopNavBar variant="default" onSearchClick={() => navigate("/search/start")} />

      {isLoading ? (
        <div className="flex flex-col items-center justify-center gap-3 p-8 py-40 text-center">
          <p className="text-lg font-semibold">그룹 불러오는 중...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center gap-3 p-8 py-40 text-center">
          <p className="text-lg font-semibold">그룹을 불러오지 못했어요</p>
          <p className="text-xs text-red-500">{error.message}</p>
        </div>
      ) : !hasRooms ? (
        <div className="flex flex-col items-center justify-center gap-3 p-8 py-40 text-center">
          <p className="text-lg font-semibold">그룹이 없습니다</p>
          <p className="text-sm text-muted-foreground">
            새로운 그룹을 생성해 보세요.
          </p>
          <Button
            className="mt-2 rounded-full"
            aria-label="그룹 만들기"
            onClick={() => setOpenCreate(true)}
          >
            <Plus className="size-4" />
            그룹 만들기
          </Button>
        </div>
      ) : (
        <section className="grid grid-cols-1 gap-y-2 p-4">
          {visibleRooms.map((room) => (
            <MyMeetingCard
              key={room.roomId}
              group={room}
              onLeave={handleLeave}              // ✅ 나가기 콜백
              onOpenGroup={handleOpenGroup}      // ✅ 카드 클릭 → 상세 이동
            />
          ))}
        </section>
      )}

      {/* 🔍 화면에 보이는 방이 있을 때만 플로팅 버튼 표시 */}
      {hasRooms && (
        <div className="fixed bottom-[100px] right-5 z-50 sm:right-[calc(50%-320px+20px)]">
          <Button
            className="rounded-full shadow-lg"
            aria-label="그룹 만들기"
            onClick={() => setOpenCreate(true)}
          >
            <Plus className="size-4" />
            그룹 만들기
          </Button>
        </div>
      )}

      <CreateGroupSheet
        open={openCreate}
        onOpenChange={setOpenCreate}
        onCreated={handleCreated}
      />
    </>
  );
}
