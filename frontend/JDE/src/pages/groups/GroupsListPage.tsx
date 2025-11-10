// src/pages/main/MainPage.tsx
// 목적: 메인(홈) 화면 레이아웃 구성 (단일 책임: 배치와 섹션 호출)

import { useNavigate } from "react-router-dom";
import { TopNavBar } from "@/widgets/top-navbar";
import { dummyGroup } from "@/entities/groups/dummy";
import { Button } from "@/shared/ui/shadcn/button";
import GroupCard from "@/widgets/groups/GroupCard";
import { Plus } from 'lucide-react'

export default function GroupsListPage() {
  const navigate = useNavigate();

  return (
    <>
      {/* 상단 네비바 */}
      <TopNavBar variant="default" onSearchClick={() => navigate("/search")} />

      {/* 메인 콘텐츠 */}
      {/* 모임 카드 목록 */}
      <section className="grid grid-cols-1 gap-y-2 p-4">
        {dummyGroup.map((g) => (
          <GroupCard key={g.id} group={g} />
        ))}
      </section>

    <div className="fixed bottom-[110px] right-5 z-50">
        <Button
          className="rounded-full shadow-lg"
          aria-label="그룹 만들기"
          onClick={() => navigate("/groups/create")}
        >
          <Plus className="size-4" />
          그룹 만들기
        </Button>
      </div>
    </>
  );
}
