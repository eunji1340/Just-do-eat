import { useNavigate } from "react-router-dom";
import { TopNavBar } from "@/widgets/top-navbar";
import { dummyGroup } from "@/entities/groups/dummy";
import { Button } from "@/shared/ui/shadcn/button";
import GroupCard from "@/widgets/groups/GroupCard";
import { Plus } from "lucide-react";
import * as React from "react";

import CreateGroupSheet from "@/features/groups/ui/CreateGroupSheet";

export default function GroupsListPage() {
  const navigate = useNavigate();
  const [openCreate, setOpenCreate] = React.useState(false);

  // 실제 API 연동 시에는 useQuery 등으로 가져온 data로 교체
  const groups = dummyGroup;

  function handleCreated(groupId: number) {
    navigate(`/groups/${groupId}`);
  }

  return (
    <>
      {/* 상단 네비바 */}
      <TopNavBar variant="default" onSearchClick={() => navigate("/search")} />

      {/* 메인 콘텐츠 */}
      {groups.length === 0 ? (
        // 빈 상태 (Empty State)
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
        // 그룹 목록
        <section className="grid grid-cols-1 gap-y-2 p-4">
          {groups.map((g) => (
            <GroupCard key={g.id} group={g} />
          ))}
        </section>
      )}

      {/* 그룹이 있을 때만 플로팅 버튼 표시 */}
      {groups.length > 0 && (
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

      {/* 바텀시트 */}
      <CreateGroupSheet
        open={openCreate}
        onOpenChange={setOpenCreate}
        onCreated={handleCreated}
      />
    </>
  );
}
