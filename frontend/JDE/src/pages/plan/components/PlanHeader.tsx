import type { PlanDetailResponse } from "@/entities/plan/model/types";
import { formatPlanDate } from "@/shared/lib/date";
import { ParticipantAvatar } from "@/widgets/plan/ParticipantAvatar";

type PlanHeaderProps = {
  planDetail: PlanDetailResponse;
};

export function PlanHeader({ planDetail }: PlanHeaderProps) {
  const formattedDate = formatPlanDate(planDetail.startAt);
  const participants = planDetail.planParticipantList || [];

  return (
    <div className="px-4 pt-6 pb-2">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-neutral-600">
            {formattedDate}
          </p>
          <h1 className="mt-1 text-2xl font-bold leading-tight text-neutral-900">
            {planDetail.roomName}의 {planDetail.planName}
          </h1>
        </div>

        <div className="flex -space-x-3">
          {participants.slice(0, 3).map((participant) => (
            <ParticipantAvatar
              key={participant.userId}
              participant={participant}
            />
          ))}
          {participants.length > 3 && (
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border-3 border-white bg-gradient-to-br from-neutral-300 to-neutral-200 text-sm font-bold text-neutral-700 shadow-md">
              +{participants.length - 3}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
