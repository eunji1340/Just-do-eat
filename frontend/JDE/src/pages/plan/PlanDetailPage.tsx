import { useCallback, useState } from "react";
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
    handleDirectSelectComplete,
  } = useDirectSelect(planId, fetchPlanDetail);

  const [selectedTool, setSelectedTool] = useState<
    "VOTE" | "LADDER" | "ROULETTE" | "DIRECT" | null
  >(null);

  const isVotingStatus = planDetail?.status === "VOTING";
  const {
    selectedRestaurantId: voteSelectedId,
    setSelectedRestaurantId: setVoteSelectedId,
    hasVoted,
    isSubmitting,
    startVote,
    submitVote,
    endVoteAndDecide,
    getVoteCount,
    voteTallyData,
    getTiedRestaurants,
  } = useVote(planId, isVotingStatus || false, fetchPlanDetail);
  const [showToolModal, setShowToolModal] = useState(false);
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);
  const [showEndVoteConfirmModal, setShowEndVoteConfirmModal] = useState(false);
  const [showTieVoteModal, setShowTieVoteModal] = useState(false);
  const [showManagerSelectModal, setShowManagerSelectModal] = useState(false);

  const handleSelectToolClick = useCallback(() => {
    setShowToolModal(true);
  }, []);

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
          console.log("@@@@@@@@@@@@@@@@@@@@")
          navigate(`/roulette?planId=${planId}`);
        } else if (toolType === "VOTE") {
          // 투표 시작
          await startVote();
          // 투표 모드 활성화는 selectedTool이 "VOTE"로 설정되어 있어서 자동으로 됨
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

  const handleVoteRestaurantSelect = useCallback(
    (restaurantId: string) => {
      if (!hasVoted) {
        setVoteSelectedId(restaurantId);
      }
    },
    [hasVoted, setVoteSelectedId]
  );

  const handleVoteSubmit = useCallback(async () => {
    try {
      await submitVote();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "투표 제출에 실패했습니다. 다시 시도해주세요."
      );
    }
  }, [submitVote]);

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

  const handleRevote = useCallback(async () => {
    setShowTieVoteModal(false);
    try {
      // 재투표 시작 (투표 상태 초기화 후 다시 시작)
      await startVote();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "재투표 시작에 실패했습니다. 다시 시도해주세요."
      );
    }
  }, [startVote]);

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
  // VOTE 상태일 때 라디오 버튼 표시
  const voteMode = isVotingStatus;
  const selectedRestaurantId = isVotingStatus
    ? voteSelectedId
    : directSelectedId;

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
          isPlanManager || isVotingStatus ? "pb-24" : ""
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
            isVotingStatus
              ? handleVoteRestaurantSelect
              : handleDirectRestaurantSelect
          }
          onPrevious={handlePrevious}
          onNext={handleNext}
          getVoteCount={isVotingStatus ? getVoteCount : undefined}
          totalParticipants={
            isVotingStatus && planDetail
              ? planDetail.planParticipantList.length
              : undefined
          }
          currentVoteCount={
            isVotingStatus ? voteTallyData?.totalVotes : undefined
          }
        />
      </div>

      {isVotingStatus && (
        <>
          <VoteSubmitButton
            hasVoted={hasVoted}
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

      {!isVotingStatus && isPlanManager && (
        <BottomActionBar
          bottomButtonsRef={bottomButtonsRef}
          isLoading={isLoadingCandidates}
          hasRestaurants={restaurants.length > 0}
          directSelectMode={directSelectMode}
          hasSelectedRestaurant={!!selectedRestaurantId}
          onSelectToolClick={handleSelectToolClick}
          onDirectSelect={handleDirectSelect}
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
        onClose={() => setShowDecideSuccessModal(false)}
      />
    </>
  );
}
