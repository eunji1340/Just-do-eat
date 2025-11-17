import type { Member } from "@/entities/plan/model/types";
import { cn } from "@/shared/lib/utils";

type MemberAvatarsProps = {
  members: Member[];
  maxVisible?: number;
  ownerId?: string;
};

export function MemberAvatars({
  members,
  maxVisible = 4,
  ownerId,
}: MemberAvatarsProps) {
  const visibleMembers = members.slice(0, maxVisible);
  const overflow = members.length - visibleMembers.length;

  return (
    <div className="flex justify-end">
      <div className="flex -space-x-3">
        {visibleMembers.map((member) => (
          <div
            key={member.id}
            className={cn(
              "relative inline-flex size-10 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-slate-200 text-xs font-semibold text-slate-600 shadow-sm",
              member.profileImageUrl && "bg-transparent",
              ownerId === member.id &&
                "ring-2 ring-primary ring-offset-2 ring-offset-white"
            )}
            title={`${member.name}님`}
          >
            {member.profileImageUrl ? (
              <img
                src={member.profileImageUrl}
                alt={`${member.name}의 프로필 이미지`}
                className="h-full w-full object-cover"
              />
            ) : (
              member.name.slice(0, 1)
            )}
          </div>
        ))}
        {overflow > 0 && (
          <span className="inline-flex size-10 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-xs font-semibold text-slate-500 shadow-sm">
            +{overflow}
          </span>
        )}
      </div>
    </div>
  );
}

