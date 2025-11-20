import { useState } from "react";
import type { PlanParticipant } from "@/entities/plan/model/types";

type ParticipantAvatarProps = {
  participant: PlanParticipant;
};

export function ParticipantAvatar({ participant }: ParticipantAvatarProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <div
      className="relative inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border-3 border-white bg-gradient-to-br from-primary to-primary/70 text-sm font-bold text-white shadow-md"
      title={participant.userName}
    >
      {participant.userUrl && !imageError ? (
        <img
          src={participant.userUrl}
          alt={`${participant.userName}의 프로필 이미지`}
          className="h-full w-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        participant.userName.slice(0, 1)
      )}
    </div>
  );
}
