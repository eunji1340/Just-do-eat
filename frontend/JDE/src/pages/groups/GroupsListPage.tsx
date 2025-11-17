// src/pages/groups/GroupsListPage.tsx

import { useNavigate } from "react-router-dom";
import { TopNavBar } from "@/widgets/top-navbar";
import { Button } from "@/shared/ui/shadcn/button";
import GroupCard from "@/widgets/groups/GroupCard";
import { Plus } from "lucide-react";
import * as React from "react";

import CreateGroupSheet from "@/features/groups/ui/CreateGroupSheet";
import { useMyGroups } from "@/features/groups/hooks/useMyGroups";

export default function GroupsListPage() {
  const navigate = useNavigate();
  const [openCreate, setOpenCreate] = React.useState(false);

  const { rooms, isLoading, error } = useMyGroups();
  const hasRooms = rooms.length > 0;

  function handleCreated(roomId: number) {
    navigate(`/groups/${roomId}`);
  }

  return (
    <>
      <TopNavBar variant="default" onSearchClick={() => navigate("/search")} />

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
          {rooms.map((room) => (
            <GroupCard key={room.roomId} group={room} />
          ))}
        </section>
      )}

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
