// src/widgets/groups/MemberSectionCard.tsx
import { UsersRound, Plus } from "lucide-react";
import MemberAvatarList from "./MemberAvatarList";
import type { RoomMember } from "@/entities/groups/types";  // 🔁 여기!

type Props = {
  members: RoomMember[];  // 🔁 GroupDetail["members"] → RoomMember[]
  onInvite?: () => void;
};

export default function MemberSectionCard({ members, onInvite }: Props) {
  // (선택) 탈퇴/삭제된 멤버는 숨기고 싶다면 여기서 필터링할 수도 있어요.
  const activeMembers = members.filter((m) => !m.del);

  return (
    <section className="mt-10">
      <div className="rounded-2xl border-neutral-400 bg-card p-3 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UsersRound className="size-5 text-foreground/80" aria-hidden />
            <h2 className="text-base font-semibold">모임원</h2>
          </div>
          <button
            aria-label="멤버 초대"
            className="grid size-8 place-items-center rounded-full border-neutral-400 bg-background text-foreground/80"
            onClick={onInvite}
          >
            <Plus className="size-4" />
          </button>
        </div>

        {/* 🔁 여기서도 activeMembers로 넘길지, members 그대로 넘길지 선택 */}
        <MemberAvatarList members={activeMembers} />
      </div>
    </section>
  );
}
