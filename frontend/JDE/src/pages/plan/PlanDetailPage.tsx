import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { getPlanDetail } from "@/entities/plan/api/getPlanDetail";
import type { PlanDetail, Restaurant } from "@/entities/plan/model/types";
import { formatPlanDate } from "@/shared/lib/date";
import { Button } from "@/shared/ui/shadcn/button";
import { ShareButton } from "@/features/plan/ShareButton";
import { RefreshButton } from "@/features/plan/RefreshButton";
import { DeleteButton } from "@/features/plan/DeleteButton";
import { MemberAvatars } from "@/widgets/plan/MemberAvatars";
import { RestaurantCard } from "@/widgets/plan/RestaurantCard";
import { TopNavBar } from "@/widgets/top-navbar";

const mePresets = {
  owner: { id: "u-1", name: "나" },
  guest: { id: "u-2", name: "게스트" },
} as const;

const statusLabelMap: Record<PlanDetail["status"], string> = {
  deciding: "결정 진행중",
  decided: "결정 완료",
  canceled: "취소됨",
};

const decisionToolLabel: Record<
  NonNullable<PlanDetail["decisionTool"]>,
  string
> = {
  vote: "투표",
  roulette: "룰렛",
};

type AddRestaurantPayload = {
  name: string;
  category: string;
  menu1: string;
  menu2: string;
  imageUrl: string;
  likesCount: number;
};

const createEmptyForm = (): AddRestaurantPayload => ({
  name: "",
  category: "",
  menu1: "",
  menu2: "",
  imageUrl: "",
  likesCount: 120,
});

export default function PlanDetailPage() {
  const { planId } = useParams<{ planId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const meOverride = searchParams.get("me");

  const activePlanId = planId ?? "";

  const me = useMemo(() => {
    if (meOverride === "guest") return mePresets.guest;
    return mePresets.owner;
  }, [meOverride]);

  const [plan, setPlan] = useState<PlanDetail | null>(null);
  const [recommended, setRecommended] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [isAddModalOpen, setAddModalOpen] = useState(false);

  const fetchPlanDetail = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!activePlanId) {
        setPlan(null);
        setRecommended([]);
        return;
      }

      const silent = options?.silent ?? false;
      if (silent) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
        setIsError(false);
      }

      try {
        const detail = await getPlanDetail(activePlanId);
        setPlan(detail);
        setRecommended(detail.recommended);
        setIsError(false);
      } catch (error) {
        console.error(error);
        if (silent) {
          if (typeof window !== "undefined") {
            window.alert(
              "약속 정보를 새로고침하지 못했어요. 잠시 후 다시 시도해 주세요."
            );
          }
        } else {
          setIsError(true);
          setPlan(null);
        }
      } finally {
        if (silent) {
          setIsRefreshing(false);
        } else {
          setIsLoading(false);
        }
      }
    },
    [activePlanId]
  );

  useEffect(() => {
    if (!activePlanId) {
      setPlan(null);
      setRecommended([]);
      setIsLoading(false);
      setIsError(false);
      return;
    }

    void fetchPlanDetail();
  }, [activePlanId, fetchPlanDetail]);

  useEffect(() => {
    if (typeof window !== "undefined" && activePlanId) {
      setShareUrl(`${window.location.origin}/plans/${activePlanId}`);
    }
  }, [activePlanId]);

  const handleAddRestaurant = (payload: AddRestaurantPayload) => {
    const menus = [payload.menu1, payload.menu2]
      .map((menu) => menu.trim())
      .filter(Boolean)
      .slice(0, 2);

    const newRestaurant: Restaurant = {
      id: `local-${Date.now()}`,
      name: payload.name.trim() || `새 식당 ${recommended.length + 1}`,
      category: payload.category.trim() || "기타",
      imageUrl:
        payload.imageUrl.trim() || "https://picsum.photos/seed/plan-add/200",
      signatureMenus: menus.length > 0 ? menus : ["대표 메뉴 미입력"],
      likesCount: Number.isNaN(payload.likesCount)
        ? 0
        : Math.max(0, Math.floor(payload.likesCount)),
    };

    setRecommended((prev) => [newRestaurant, ...prev]);
    setAddModalOpen(false);
  };

  const handleDeletePlan = () => {
    window.alert("약속을 삭제했다고 가정합니다.");
  };

  const handleVoteClick = () => {
    window.alert("투표 기능은 준비 중입니다.");
  };

  const handleRouletteClick = () => {
    window.alert("룰렛 기능은 준비 중입니다.");
  };

  if (!activePlanId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-sm text-neutral-500">
        올바르지 않은 약속입니다.
      </div>
    );
  }

  const isOwner = plan ? plan.ownerId === me.id : meOverride !== "guest";

  return (
    <>
      <TopNavBar
        variant="default"
        onSearchClick={() => navigate("/search")}
      />

      <div className="relative flex min-h-screen flex-col bg-white">
        <div className="flex-1 pb-[96px]">
          {isLoading && <LoadingState />}
          {!isLoading && isError && (
            <ErrorState onRetry={() => fetchPlanDetail()} />
          )}
          {!isLoading && !isError && plan && (
            <PlanContent
              plan={plan}
              isOwner={isOwner}
              recommended={recommended}
              onOpenAddModal={() => setAddModalOpen(true)}
              shareUrl={shareUrl}
              onRefresh={() => fetchPlanDetail({ silent: true })}
              isRefreshing={isRefreshing}
              onDelete={handleDeletePlan}
              onVote={handleVoteClick}
              onRoulette={handleRouletteClick}
            />
          )}
          {!isLoading && !isError && !plan && (
            <div className="flex flex-col items-center justify-center gap-2 px-4 py-20 text-sm text-neutral-500">
              약속 정보를 찾을 수 없습니다.
            </div>
          )}
        </div>

        {plan && isOwner && (
          <div className="sticky bottom-0 left-0 z-30 bg-white/95 px-4 py-3 shadow-[0_-4px_20px_rgba(15,23,42,0.08)] backdrop-blur sm:hidden">
            <OwnerActionButtons
              layout="vertical"
              onVote={handleVoteClick}
              onRoulette={handleRouletteClick}
            />
          </div>
        )}

        <AddRestaurantModal
          open={isAddModalOpen}
          onClose={() => setAddModalOpen(false)}
          onSubmit={handleAddRestaurant}
        />
      </div>
    </>
  );
}

type PlanContentProps = {
  plan: PlanDetail;
  isOwner: boolean;
  recommended: Restaurant[];
  onOpenAddModal: () => void;
  shareUrl: string;
  onRefresh: () => Promise<unknown>;
  isRefreshing: boolean;
  onDelete: () => void;
  onVote: () => void;
  onRoulette: () => void;
};

function PlanContent({
  plan,
  isOwner,
  recommended,
  onOpenAddModal,
  shareUrl,
  onRefresh,
  isRefreshing,
  onDelete,
  onVote,
  onRoulette,
}: PlanContentProps) {
  const deciderName = plan.deciderId
    ? plan.members.find((member) => member.id === plan.deciderId)?.name
    : null;

  const hasConditions =
    plan.conditions && Object.keys(plan.conditions).length > 0;

  return (
    <div className="flex flex-col gap-8">
      <section className="px-4 pt-6">
        <div className="flex flex-col gap-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm text-neutral-400">
                {formatPlanDate(plan.dateISO)}
              </p>
              <h1 className="mt-2 text-[22px] font-semibold leading-tight text-neutral-900">
                {plan.groupName}의 {plan.planName}
              </h1>
            </div>
            {isOwner && (
              <div className="flex shrink-0 items-center gap-2">
                <ShareButton
                  url={shareUrl}
                  title={`${plan.groupName}의 ${plan.planName}`}
                />
                <RefreshButton onRefresh={onRefresh} isLoading={isRefreshing} />
                <DeleteButton planName={plan.planName} onConfirm={onDelete} />
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <MemberAvatars members={plan.members} ownerId={plan.ownerId} />
          </div>

          <div className="rounded-2xl bg-orange-50 px-5 py-5 text-sm text-orange-900">
            <PlanInfoRow label="약속 상태" value={statusLabelMap[plan.status]} />
            <PlanInfoRow
              label="참여 인원"
              value={`${plan.participantsCount}명`}
            />
            <PlanInfoRow
              label="진행 도구"
              value={
                plan.decisionTool
                  ? `${decisionToolLabel[plan.decisionTool]} 진행 중`
                  : "아직 선택되지 않았어요"
              }
            />
            {plan.meetingPlace && (
              <PlanInfoRow label="약속 장소" value={plan.meetingPlace} />
            )}
            {deciderName && (
              <PlanInfoRow label="약속장" value={`${deciderName}님`} />
            )}
          </div>

          {hasConditions && (
            <div className="rounded-2xl border border-neutral-100 bg-neutral-50 px-5 py-4">
              <h2 className="text-sm font-semibold text-neutral-700">
                약속 조건
              </h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {Object.entries(plan.conditions).map(([key, value]) => (
                  <li
                    key={key}
                    className="rounded-full bg-white px-3 py-1 text-xs text-neutral-600 shadow-sm"
                  >
                    {key}: {String(value)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {plan.decidedRestaurant && (
            <div className="flex flex-col gap-3">
              <h2 className="text-base font-semibold text-neutral-700">
                결정된 식당
              </h2>
              <RestaurantCard restaurant={plan.decidedRestaurant} highlight />
            </div>
          )}

          {isOwner && (
            <OwnerActionButtons onVote={onVote} onRoulette={onRoulette} />
          )}
        </div>
      </section>

      <section className="flex flex-col gap-4 px-4 pb-10">
        <div className="flex items-center justify_between">
          <h2 className="text-lg font-semibold text-neutral-900">추천 식당</h2>
          <span className="text-sm text-neutral-400">
            {recommended.length}곳
          </span>
        </div>

        {recommended.length > 0 ? (
          <div className="flex flex-col gap-3">
            {recommended.map((restaurant) => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-8 text-center text-sm text-neutral-500">
            추천이 아직 없어요. 마음에 드는 식당을 직접 추가해보세요.
          </div>
        )}

        <Button
          variant="outline"
          size="md"
          className="h-12 border-primary/40 text-sm font-semibold text-primary"
          onClick={onOpenAddModal}
          aria-label="식당 직접 추가"
        >
          + 식당 직접 추가
        </Button>
      </section>
    </div>
  );
}

function PlanInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="font-medium">{label}</span>
      <span className="text-right text-orange-900">{value}</span>
    </div>
  );
}

type OwnerActionButtonsProps = {
  onVote: () => void;
  onRoulette: () => void;
  layout?: "horizontal" | "vertical";
};

function OwnerActionButtons({
  onVote,
  onRoulette,
  layout = "horizontal",
}: OwnerActionButtonsProps) {
  const isVertical = layout === "vertical";
  return (
    <div
      className={`mt-4 flex ${
        isVertical ? "flex-col gap-2 sm:flex-row sm:gap-3" : "gap-3"
      }`}
    >
      <Button
        variant="outline"
        size="md"
        className="h-12 flex-1 text-sm font-semibold text-primary"
        onClick={onVote}
        aria-label="투표 만들기"
      >
        + 투표
      </Button>
      <Button
        variant="outline"
        size="md"
        className="h-12 flex-1 text-sm font-semibold text-primary"
        onClick={onRoulette}
        aria-label="룰렛 만들기"
      >
        + 룰렛
      </Button>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-6 px-4 py-6">
      <div className="flex flex-col gap-3">
        <div className="h-4 w-32 animate-pulse rounded-full bg-neutral-200" />
        <div className="h-6 w-56 animate-pulse rounded-full bg-neutral-200" />
      </div>
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="flex gap-4 rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm">
      <div className="h-20 w-20 animate-pulse rounded-xl bg-neutral-200" />
      <div className="flex flex-1 flex-col gap-3">
        <div className="h-4 w-16 animate-pulse rounded-full bg-neutral-200" />
        <div className="h-4 w-40 animate-pulse rounded-full bg-neutral-200" />
        <div className="h-3 w-28 animate-pulse rounded-full bg-neutral-200" />
        <div className="h-px w-full bg-neutral-100" />
        <div className="ml-auto h-3 w-32 animate-pulse rounded-full bg-neutral-200" />
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => Promise<unknown> }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-4 py-24 text-center">
      <h2 className="text-base font-semibold text-neutral-900">
        약속 정보를 불러오지 못했어요
      </h2>
      <p className="text-sm text-neutral-500">잠시 후 다시 시도해 주세요.</p>
      <Button
        variant="outline"
        size="md"
        className="h-11 px-6"
        onClick={() => {
          void onRetry();
        }}
        aria-label="약속 정보 다시 시도"
      >
        다시 시도
      </Button>
    </div>
  );
}

type AddRestaurantModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: AddRestaurantPayload) => void;
};

function AddRestaurantModal({
  open,
  onClose,
  onSubmit,
}: AddRestaurantModalProps) {
  const [formState, setFormState] =
    useState<AddRestaurantPayload>(createEmptyForm);

  useEffect(() => {
    if (open) {
      setFormState(createEmptyForm());
    }
  }, [open]);

  if (!open) return null;

  const handleChange =
    (field: keyof AddRestaurantPayload) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const value =
        field === "likesCount"
          ? Number(event.target.value)
          : event.target.value;
      setFormState((prev) => ({
        ...prev,
        [field]: value,
      }));
    };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(formState);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-restaurant-heading"
        className="w-full max-w-[360px] rounded-2xl bg-white p-5 shadow-xl"
      >
        <h2
          id="add-restaurant-heading"
          className="text-lg font-semibold text-neutral-900"
        >
          식당 직접 추가
        </h2>

        <form className="mt-4 flex flex-col gap-3" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-1 text-sm font-medium text-neutral-700">
            식당 이름
            <input
              value={formState.name}
              onChange={handleChange("name")}
              placeholder="식당 이름을 입력하세요"
              className="rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-neutral-700">
            카테고리
            <input
              value={formState.category}
              onChange={handleChange("category")}
              placeholder="예: 한식, 양식"
              className="rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm font-medium text-neutral-700">
              대표 메뉴 1
              <input
                value={formState.menu1}
                onChange={handleChange("menu1")}
                placeholder="예: 시그니처 메뉴"
                className="rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-neutral-700">
              대표 메뉴 2
              <input
                value={formState.menu2}
                onChange={handleChange("menu2")}
                placeholder="예: 인기 메뉴"
                className="rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1 text-sm font-medium text-neutral-700">
            대표 이미지 URL
            <input
              value={formState.imageUrl}
              onChange={handleChange("imageUrl")}
              placeholder="이미지 주소(선택)"
              className="rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-neutral-700">
            즐겨찾기 수
            <input
              type="number"
              min={0}
              value={formState.likesCount}
              onChange={handleChange("likesCount")}
              className="rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>

          <div className="mt-2 flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              className="h-11 flex-1"
              onClick={onClose}
            >
              취소
            </Button>
            <Button type="submit" size="md" className="h-11 flex-1">
              추가하기
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

