import { useCallback, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Users } from "lucide-react";
import { selectDecisionTool } from "@/entities/plan/api/selectDecisionTool";
import { TopNavBar } from "@/widgets/top-navbar";
import { useUserMe } from "@/features/user/model/useUserMe";
import { usePlanDetail } from "./hooks/usePlanDetail";
import { usePlanCandidates } from "./hooks/usePlanCandidates";
import { useDirectSelect } from "./hooks/useDirectSelect";
import { useVote } from "./hooks/useVote";
import { PlanHeader } from "./components/PlanHeader";
import { RestaurantList } from "./components/RestaurantList";
import { BottomActionBar } from "./components/BottomActionBar";
import { VoteActionBar } from "./components/VoteActionBar";
import { VoteSubmitButton } from "./components/VoteSubmitButton";
import { ToolSelectionModal } from "./components/ToolSelectionModal";
import { ComingSoonModal } from "./components/ComingSoonModal";
import { DecideSuccessModal } from "./components/DecideSuccessModal";
import { EndVoteConfirmModal } from "./components/EndVoteConfirmModal";
import { TieVoteModal } from "./components/TieVoteModal";
import { ManagerSelectModal } from "./components/ManagerSelectModal";

export default function PlanDetailPage() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const { userData } = useUserMe();

  const { planDetail, isLoading, isError, fetchPlanDetail } =
    usePlanDetail(planId);
  const {
    restaurants,
    isLoading: isLoadingCandidates,
    hasMore,
    handleNext,
    handlePrevious,
    currentHistoryIndex,
  } = usePlanCandidates(planId);

  const {
    directSelectMode,
    selectedRestaurantId: directSelectedId,
    showDecideSuccessModal,
    setShowDecideSuccessModal,
    restaurantListRef,
    bottomButtonsRef,
    handleDirectSelect,
    handleRestaurantSelect: handleDirectRestaurantSelect,
    handleDirectSelectComplete: originalHandleDirectSelectComplete,
  } = useDirectSelect(planId, fetchPlanDetail);

  const [selectedTool, setSelectedTool] = useState<
    "VOTE" | "LADDER" | "ROULETTE" | "DIRECT" | null
  >(null);

  const isVotingStatus = planDetail?.status === "VOTING";
  const decisionTool = planDetail?.decisionTool
    ? planDetail.decisionTool.toUpperCase()
    : null;
  const isVoteTool = decisionTool === "VOTE";
  const isRouletteTool = decisionTool === "ROULETTE";

  const {
    selectedRestaurantId: voteSelectedId,
    setSelectedRestaurantId: setVoteSelectedId,
    isSubmitting,
    startVote,
    submitVote,
    endVoteAndDecide,
    getVoteCount,
    voteTallyData,
    getTiedRestaurants,
  } = useVote(planId, Boolean(isVotingStatus && isVoteTool), fetchPlanDetail);

  const [showToolModal, setShowToolModal] = useState(false);
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);
  const [showEndVoteConfirmModal, setShowEndVoteConfirmModal] = useState(false);
  const [showTieVoteModal, setShowTieVoteModal] = useState(false);
  const [showManagerSelectModal, setShowManagerSelectModal] = useState(false);
  const [isRevoteMode, setIsRevoteMode] = useState(false);
  // 재투표 시 동점이었던 식당 ID들 (동점이 해소되어도 유지)
  const [revoteRestaurantIds, setRevoteRestaurantIds] = useState<number[]>([]);

  // VOTING + ROULETTE면 약속 상세 진입 시 바로 룰렛 페이지로 이동
  useEffect(() => {
    if (!planId || !planDetail) return;

    if (planDetail.status === "VOTING" && isRouletteTool) {
      navigate(`/roulette/${planId}`, { replace: true });
      return;
    }

    // 이미 VOTE 도구가 선택된 상태로 들어온 경우, 선택된 도구 상태 동기화
    if (planDetail.status === "VOTING" && isVoteTool) {
      setSelectedTool("VOTE");
    }
  }, [planId, planDetail, isRouletteTool, isVoteTool, navigate]);

  const handleSelectToolClick = useCallback(() => {
    if (!planDetail) return;
    // 결정 도구 선택은 OPEN 상태에서만 가능
    if (planDetail.status !== "OPEN") return;
    setShowToolModal(true);
  }, [planDetail]);

  const handleToolSelectFromModal = useCallback(
    async (toolType: "VOTE" | "LADDER" | "ROULETTE") => {
      if (!planId || restaurants.length === 0) return;

      if (toolType === "LADDER") {
        setShowToolModal(false);
        setShowComingSoonModal(true);
        return;
      }

      setSelectedTool(toolType);
      setShowToolModal(false);

      try {
        const restaurantIds = restaurants.map((r) => parseInt(r.id, 10));
        await selectDecisionTool(planId, toolType, restaurantIds);

        if (toolType === "ROULETTE") {
          navigate(`/roulette/${planId}`);
        } else if (toolType === "VOTE") {
          // 투표 시작
          await startVote();
        }
      } catch (error) {
        console.error(
          "[handleToolSelectFromModal] 결정 도구 선택 실패:",
          error
        );
        alert("결정 도구 선택에 실패했습니다. 다시 시도해주세요.");
        setSelectedTool(null);
      }
    },
    [planId, restaurants, navigate, startVote]
  );

  // 바로 선택 완료 시 결정 도구 선택 API 먼저 호출
  const handleDirectSelectComplete = useCallback(async () => {
    if (!planId || !directSelectedId || restaurants.length === 0) return;

    try {
      // 1. 결정 도구 선택 API 호출 (VOTE로 현재 리스트의 후보 식당들 저장)
      const restaurantIds = restaurants.map((r) => parseInt(r.id, 10));
      await selectDecisionTool(planId, "VOTE", restaurantIds);

      // 2. 식당 확정
      await originalHandleDirectSelectComplete();
    } catch (error) {
      console.error("[handleDirectSelectComplete] 바로 선택 완료 실패:", error);
      alert(
        error instanceof Error
          ? error.message
          : "식당 확정에 실패했습니다. 다시 시도해주세요."
      );
    }
  }, [
    planId,
    directSelectedId,
    restaurants,
    originalHandleDirectSelectComplete,
  ]);

  const handleVoteRestaurantSelect = useCallback(
    (restaurantId: string) => {
      // 재투표 중이면 (revoteRestaurantIds가 있으면) 동점이었던 식당만 선택 가능
      if (revoteRestaurantIds.length > 0) {
        const isRevoteRestaurant = revoteRestaurantIds.includes(
          parseInt(restaurantId, 10)
        );
        if (!isRevoteRestaurant) {
          return; // 재투표 대상이 아닌 식당은 선택 불가
        }
        // 동점이 해소되었으면 재투표 모드만 해제 (revoteRestaurantIds는 유지)
        const tiedRestaurants = getTiedRestaurants();
        if (tiedRestaurants.length <= 1) {
          setIsRevoteMode(false);
        }
      }
      setVoteSelectedId(restaurantId);
    },
    [revoteRestaurantIds, getTiedRestaurants, setVoteSelectedId]
  );

  const handleVoteSubmit = useCallback(async () => {
    try {
      await submitVote();
      // 투표 제출 후 동점이 해소되었는지 확인하여 재투표 모드 해제
      // fetchTally가 완료된 후에 확인하기 위해 약간의 지연
      setTimeout(() => {
        const tiedRestaurants = getTiedRestaurants();
        if (tiedRestaurants.length <= 1) {
          setIsRevoteMode(false);
        }
      }, 100);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "투표 제출에 실패했습니다. 다시 시도해주세요."
      );
    }
  }, [submitVote, getTiedRestaurants]);

  const handleEndVoteClick = useCallback(() => {
    setShowEndVoteConfirmModal(true);
  }, []);

  const handleEndVoteConfirm = useCallback(async () => {
    setShowEndVoteConfirmModal(false);
    try {
      // 동점인 식당이 있는지 확인
      const tiedRestaurants = getTiedRestaurants();
      if (tiedRestaurants.length > 0) {
        // 동점인 경우 모달 표시
        setShowTieVoteModal(true);
        return;
      }

      // 동점이 없으면 바로 확정
      await endVoteAndDecide();
      setShowDecideSuccessModal(true);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "투표 종료에 실패했습니다. 다시 시도해주세요."
      );
    }
  }, [endVoteAndDecide, setShowDecideSuccessModal, getTiedRestaurants]);

  const handleRevote = useCallback(() => {
    setShowTieVoteModal(false);
    // 재투표 모드 활성화 (동점인 식당들만 선택 가능)
    const tiedRestaurants = getTiedRestaurants();
    const tiedRestaurantIds = tiedRestaurants.map((r) => r.restaurantId);
    setRevoteRestaurantIds(tiedRestaurantIds);
    setIsRevoteMode(true);
    // 선택 상태 초기화
    setVoteSelectedId(null);
  }, [setVoteSelectedId, getTiedRestaurants]);

  // 동점이 해소되면 재투표 모드 자동 해제
  useEffect(() => {
    const voteMode = Boolean(isVotingStatus && isVoteTool);
    if (isRevoteMode && voteMode) {
      const tiedRestaurants = getTiedRestaurants();
      // 동점이 해소되면 (동점인 식당이 1개 이하) 재투표 모드 해제
      if (tiedRestaurants.length <= 1) {
        setIsRevoteMode(false);
        console.log("[PlanDetailPage] 동점 해소, 재투표 모드 해제");
      }
    }
  }, [isRevoteMode, isVotingStatus, isVoteTool, getTiedRestaurants, voteTallyData]);

  const handleManagerSelectClick = useCallback(() => {
    setShowTieVoteModal(false);
    setShowManagerSelectModal(true);
  }, []);

  const handleManagerSelectConfirm = useCallback(
    async (restaurantId: number) => {
      setShowManagerSelectModal(false);
      try {
        await endVoteAndDecide(restaurantId);
        setShowDecideSuccessModal(true);
      } catch (error) {
        alert(
          error instanceof Error
            ? error.message
            : "식당 확정에 실패했습니다. 다시 시도해주세요."
        );
      }
    },
    [endVoteAndDecide, setShowDecideSuccessModal]
  );

  if (isLoading) {
    return (
      <>
        <TopNavBar
          variant="default"
          onSearchClick={() => navigate("/search")}
        />
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-sm text-neutral-500">로딩 중...</p>
        </div>
      </>
    );
  }

  if (isError || !planDetail) {
    return (
      <>
        <TopNavBar
          variant="default"
          onSearchClick={() => navigate("/search")}
        />
        <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4">
          <h2 className="text-base font-semibold text-neutral-900">
            약속 정보를 불러올 수 없습니다
          </h2>
          <button
            onClick={() => {
              fetchPlanDetail();
            }}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white"
          >
            다시 시도
          </button>
        </div>
      </>
    );
  }

  const participants = planDetail.planParticipantList || [];
  const isPlanManager = userData?.name === planDetail.planManager;
  const isDecidedStatus = planDetail?.status === "DECIDED";

  // VOTE 도구 + VOTING 상태일 때만 투표 모드
  const voteMode = Boolean(isVotingStatus && isVoteTool);
  const selectedRestaurantId = voteMode ? voteSelectedId : directSelectedId;

  return (
    <>
      <TopNavBar
        variant="label"
        label="약속"
        onBack={() => navigate(-1)}
        rightContent={
          <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-primary">
              {participants.length}명
            </span>
          </div>
        }
      />
      <div
        className={`min-h-screen bg-neutral-100 ${
          isPlanManager || voteMode ? "pb-24" : ""
        }`}
      >
        <PlanHeader planDetail={planDetail} />

        <RestaurantList
          restaurants={restaurants}
          isLoading={isLoadingCandidates}
          hasMore={hasMore}
          currentHistoryIndex={currentHistoryIndex}
          directSelectMode={directSelectMode}
          voteMode={voteMode}
          selectedRestaurantId={selectedRestaurantId}
          selectedTool={selectedTool}
          restaurantListRef={restaurantListRef}
          onRestaurantSelect={
            voteMode ? handleVoteRestaurantSelect : handleDirectRestaurantSelect
          }
          onPrevious={handlePrevious}
          onNext={handleNext}
          getVoteCount={voteMode ? getVoteCount : undefined}
          totalParticipants={
            voteMode && planDetail
              ? planDetail.planParticipantList.length
              : undefined
          }
          currentVoteCount={voteMode ? voteTallyData?.totalVotes : undefined}
          allowedRestaurantIds={
            voteMode && revoteRestaurantIds.length > 0
              ? revoteRestaurantIds
              : undefined
          }
        />
      </div>

      {voteMode && (
        <>
          <VoteSubmitButton
            hasSelectedRestaurant={!!selectedRestaurantId}
            isSubmitting={isSubmitting}
            onVoteSubmit={handleVoteSubmit}
          />
          {isPlanManager && (
            <VoteActionBar
              bottomButtonsRef={bottomButtonsRef}
              onEndVote={handleEndVoteClick}
            />
          )}
        </>
      )}

      {/* OPEN 상태 + 모임장 + 미확정일 때만 도구선택 / 바로선택 바텀바 노출 */}
      {!isVotingStatus && isPlanManager && !isDecidedStatus && (
        <BottomActionBar
          bottomButtonsRef={bottomButtonsRef}
          isLoading={isLoadingCandidates}
          hasRestaurants={restaurants.length > 0}
          directSelectMode={directSelectMode}
          hasSelectedRestaurant={!!selectedRestaurantId}
          onSelectToolClick={handleSelectToolClick}
          onDirectSelect={() => {
            if (planDetail?.status === "DECIDED") return;
            handleDirectSelect();
          }}
          onDirectSelectComplete={handleDirectSelectComplete}
        />
      )}

      <ToolSelectionModal
        isOpen={showToolModal}
        restaurantCount={restaurants.length}
        onClose={() => setShowToolModal(false)}
        onSelectTool={handleToolSelectFromModal}
      />

      <ComingSoonModal
        isOpen={showComingSoonModal}
        onClose={() => setShowComingSoonModal(false)}
      />

      <EndVoteConfirmModal
        isOpen={showEndVoteConfirmModal}
        onClose={() => setShowEndVoteConfirmModal(false)}
        onConfirm={handleEndVoteConfirm}
      />
      <TieVoteModal
        isOpen={showTieVoteModal}
        tiedCount={
          getTiedRestaurants().length > 0 ? getTiedRestaurants().length : 0
        }
        voteCount={
          getTiedRestaurants().length > 0 ? getTiedRestaurants()[0].votes : 0
        }
        onClose={() => setShowTieVoteModal(false)}
        onRevote={handleRevote}
        onManagerSelect={handleManagerSelectClick}
      />
      <ManagerSelectModal
        isOpen={showManagerSelectModal}
        tiedRestaurants={getTiedRestaurants()}
        restaurants={restaurants.map((r) => ({
          id: r.id,
          name: r.name,
          category: r.category,
        }))}
        onClose={() => setShowManagerSelectModal(false)}
        onSelect={handleManagerSelectConfirm}
      />
      <DecideSuccessModal
        isOpen={showDecideSuccessModal}
        onClose={() => {
          setShowDecideSuccessModal(false);
          // 식당 확정 후 그룹 상세 페이지로 이동
          if (planDetail?.roomId) {
            navigate(`/groups/${planDetail.roomId}`);
          }
        }}
      />
    </>
  );
}
