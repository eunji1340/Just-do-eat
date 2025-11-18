import { useCallback, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Users } from "lucide-react";
import { selectDecisionTool } from "@/entities/plan/api/selectDecisionTool";
import { TopNavBar } from "@/widgets/top-navbar";
import { usePlanDetail } from "./hooks/usePlanDetail";
import { usePlanCandidates } from "./hooks/usePlanCandidates";
import { useDirectSelect } from "./hooks/useDirectSelect";
import { PlanHeader } from "./components/PlanHeader";
import { RestaurantList } from "./components/RestaurantList";
import { BottomActionBar } from "./components/BottomActionBar";
import { ToolSelectionModal } from "./components/ToolSelectionModal";
import { ComingSoonModal } from "./components/ComingSoonModal";
import { DecideSuccessModal } from "./components/DecideSuccessModal";

export default function PlanDetailPage() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();

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
    selectedRestaurantId,
    showDecideSuccessModal,
    setShowDecideSuccessModal,
    restaurantListRef,
    bottomButtonsRef,
    handleDirectSelect,
    handleRestaurantSelect,
    handleDirectSelectComplete,
  } = useDirectSelect(planId, fetchPlanDetail);

  const [selectedTool, setSelectedTool] = useState<
    "VOTE" | "LADDER" | "ROULETTE" | "DIRECT" | null
  >(null);
  const [showToolModal, setShowToolModal] = useState(false);
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);

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
          navigate(`/roulette?planId=${planId}`);
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
    [planId, restaurants, navigate]
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
      <div className="min-h-screen bg-neutral-100 pb-24">
        <PlanHeader planDetail={planDetail} />

        <RestaurantList
          restaurants={restaurants}
          isLoading={isLoadingCandidates}
          hasMore={hasMore}
          currentHistoryIndex={currentHistoryIndex}
          directSelectMode={directSelectMode}
          selectedRestaurantId={selectedRestaurantId}
          selectedTool={selectedTool}
          restaurantListRef={restaurantListRef}
          onRestaurantSelect={handleRestaurantSelect}
          onPrevious={handlePrevious}
          onNext={handleNext}
        />
      </div>

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

      <DecideSuccessModal
        isOpen={showDecideSuccessModal}
        onClose={() => setShowDecideSuccessModal(false)}
      />
    </>
  );
}
