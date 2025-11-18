import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Users, ChevronLeft, ChevronRight, Vote, Dice5, Trophy, CheckCircle2 } from "lucide-react";
import { getPlanDetail } from "@/entities/plan/api/getPlanDetail";
import { getPlanCandidates } from "@/entities/plan/api/getPlanCandidates";
import { selectDecisionTool } from "@/entities/plan/api/selectDecisionTool";
import type {
  PlanDetailResponse,
  CandidateRestaurant,
  Restaurant,
  PlanParticipant,
} from "@/entities/plan/model/types";
import { formatPlanDate } from "@/shared/lib/date";
import { TopNavBar } from "@/widgets/top-navbar";
import { RestaurantCard } from "@/widgets/plan/RestaurantCard";
import { BottomNavBar } from "@/shared/ui/navbar";

// 참가자 아바타 컴포넌트
function ParticipantAvatar({ participant }: { participant: PlanParticipant }) {
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

// CandidateRestaurant를 Restaurant로 변환
const mapCandidateToRestaurant = (candidate: CandidateRestaurant): Restaurant => {
  // 대표 메뉴 2개 추출 (is_recommend 또는 is_ai_mate가 true인 것 우선)
  const recommendedMenus = candidate.menu.filter(
    (m) => m.is_recommend || m.is_ai_mate
  );
  const displayMenus =
    recommendedMenus.length >= 2
      ? recommendedMenus.slice(0, 2)
      : candidate.menu.slice(0, 2);

  return {
    id: candidate.restaurant.restaurant_id.toString(),
    name: candidate.restaurant.name,
    category: candidate.restaurant.category2 || candidate.restaurant.category1,
    imageUrl: candidate.restaurant.image || "", // 빈 문자열로 fallback
    signatureMenus: displayMenus.map((m) => m.name),
    likesCount: candidate.restaurant.saved_count ?? 0, // bookmark 수 사용
  };
};

export default function PlanDetailPage() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();

  const [planDetail, setPlanDetail] = useState<PlanDetailResponse | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);
  const [isError, setIsError] = useState(false);
  const [cursor, setCursor] = useState<string | null>("0");
  const [hasMore, setHasMore] = useState(true);
  // cursor 히스토리 관리 (이전으로 돌아가기 위해)
  const [cursorHistory, setCursorHistory] = useState<string[]>(["0"]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(0);
  const [selectedTool, setSelectedTool] = useState<"VOTE" | "LADDER" | "ROULETTE" | null>(null);
  
  // cursor의 최신 값을 참조하기 위한 ref
  const cursorRef = useRef<string | null>("0");
  const hasMoreRef = useRef(true);

  // 약속 상세 정보 가져오기
  const fetchPlanDetail = useCallback(async () => {
    if (!planId) return;

    try {
      setIsLoading(true);
      setIsError(false);
      const data = await getPlanDetail(planId);
      setPlanDetail(data);
    } catch (error) {
      console.error("약속 상세 정보 로딩 실패:", error);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [planId]);

  // 후보 식당 목록 가져오기 (항상 교체)
  const fetchCandidates = useCallback(
    async (
      currentCursor: string | null,
      addToHistory: boolean = false,
      historyIndex?: number
    ) => {
      if (!planId || currentCursor === null) return;

      try {
        setIsLoadingCandidates(true);
        console.log("[fetchCandidates] 요청 cursor:", currentCursor, "addToHistory:", addToHistory);
        const response = await getPlanCandidates(planId, currentCursor);
        console.log("[fetchCandidates] 응답 next_cursor:", response.next_cursor);
        console.log("[fetchCandidates] 응답 items 개수:", response.items.length);
        
        // CandidateRestaurant를 Restaurant로 변환
        const mappedRestaurants = response.items.map(mapCandidateToRestaurant);
        console.log("[fetchCandidates] 변환된 restaurants:", mappedRestaurants);
        setRestaurants(mappedRestaurants);
        
        // 다음 cursor가 있는지 확인
        const nextCursor = response.next_cursor;
        const hasNextPage = nextCursor !== null && nextCursor !== "0";
        
        // 히스토리에 추가 (다음 버튼 클릭 시)
        if (addToHistory) {
          // 현재 cursor를 히스토리에 추가
          setCurrentHistoryIndex((currentIndex) => {
            const index = historyIndex !== undefined ? historyIndex : currentIndex;
            setCursorHistory((prev) => {
              const newHistory = prev.slice(0, index + 1);
              newHistory.push(currentCursor); // 현재 cursor 저장
              return newHistory;
            });
            return index + 1;
          });
        }
        
        // cursor와 hasMore는 항상 업데이트
        setCursor(nextCursor);
        cursorRef.current = nextCursor;
        setHasMore(hasNextPage);
        hasMoreRef.current = hasNextPage;
        console.log("[fetchCandidates] hasMore 업데이트:", hasNextPage, "nextCursor:", nextCursor);
      } catch (error) {
        console.error("후보 식당 목록 로딩 실패:", error);
        setRestaurants([]);
        setHasMore(false);
        hasMoreRef.current = false;
      } finally {
        setIsLoadingCandidates(false);
      }
    },
    [planId]
  );

  // 다음 식당 리스트 보기
  const handleNext = useCallback(() => {
    const currentCursor = cursorRef.current;
    const currentHasMore = hasMoreRef.current;
    console.log("[handleNext] 현재 cursor:", currentCursor, "hasMore:", currentHasMore);
    if (currentCursor && currentHasMore && !isLoadingCandidates) {
      fetchCandidates(currentCursor, true);
    }
  }, [isLoadingCandidates, fetchCandidates]);

  // 이전 식당 리스트 보기
  const handlePrevious = useCallback(() => {
    console.log("[handlePrevious] currentHistoryIndex:", currentHistoryIndex, "cursorHistory:", cursorHistory);
    if (currentHistoryIndex > 0 && !isLoadingCandidates) {
      const prevIndex = currentHistoryIndex - 1;
      const prevCursor = cursorHistory[prevIndex];
      console.log("[handlePrevious] 이전 cursor로 이동:", prevCursor, "prevIndex:", prevIndex);
      // 이전 cursor로 데이터 가져오기 (히스토리 추가 안 함, prevIndex 전달)
      // 인덱스는 fetchCandidates 내부에서 업데이트하지 않으므로 여기서 업데이트
      setCurrentHistoryIndex(prevIndex);
      fetchCandidates(prevCursor, false, prevIndex);
    }
  }, [currentHistoryIndex, cursorHistory, isLoadingCandidates, fetchCandidates]);

  // 결정 도구 선택 핸들러 (선택만)
  const handleSelectToolClick = useCallback(
    (toolType: "VOTE" | "LADDER" | "ROULETTE") => {
      // 이미 선택된 도구를 다시 클릭하면 취소
      if (selectedTool === toolType) {
        setSelectedTool(null);
      } else {
        setSelectedTool(toolType);
      }
    },
    [selectedTool]
  );

  // 외부 클릭 감지를 위한 ref
  const toolButtonsRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 도구 선택 취소
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        toolButtonsRef.current &&
        !toolButtonsRef.current.contains(event.target as Node) &&
        selectedTool !== null
      ) {
        setSelectedTool(null);
      }
    };

    if (selectedTool !== null) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [selectedTool]);

  // 결정 도구 시작 핸들러 (API 호출)
  const handleStartTool = useCallback(
    async () => {
      if (!planId || restaurants.length === 0 || !selectedTool) return;

      try {
        // 현재 화면에 보이는 식당들의 ID 배열 생성
        const restaurantIds = restaurants.map((r) => parseInt(r.id, 10));
        console.log("[handleStartTool] 선택된 도구:", selectedTool, "식당 IDs:", restaurantIds);

        await selectDecisionTool(planId, selectedTool, restaurantIds);
        console.log("[handleStartTool] 결정 도구 선택 성공");

        // 룰렛은 별도 페이지로 이동
        if (selectedTool === "ROULETTE") {
          navigate(`/roulette?planId=${planId}`);
        } else {
          // 투표나 토너먼트는 현재 페이지에서 처리 (추후 구현)
          console.log("[handleStartTool] 투표/토너먼트 기능은 추후 구현 예정");
        }
      } catch (error) {
        console.error("[handleStartTool] 결정 도구 선택 실패:", error);
        alert("결정 도구 선택에 실패했습니다. 다시 시도해주세요.");
      }
    },
    [planId, restaurants, selectedTool, navigate]
  );

  // cursor ref 동기화
  useEffect(() => {
    cursorRef.current = cursor;
  }, [cursor]);
  
  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  // 초기 로딩
  useEffect(() => {
    if (!planId) return;
    // 초기 상태 리셋
    setCursorHistory(["0"]);
    setCurrentHistoryIndex(0);
    setCursor("0");
    cursorRef.current = "0";
    setHasMore(true);
    hasMoreRef.current = true;
    
    fetchPlanDetail();
    fetchCandidates("0", false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId]); // planId만 의존성으로 사용하여 초기 로딩만 실행

  // 날짜 포맷팅
  const formattedDate = planDetail
    ? formatPlanDate(planDetail.startAt)
    : "";

  // 참가자 아바타 표시용
  const participants = planDetail?.planParticipantList || [];

  if (isLoading) {
    return (
      <>
        <TopNavBar variant="default" onSearchClick={() => navigate("/search")} />
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-sm text-neutral-500">로딩 중...</p>
        </div>
      </>
    );
  }

  if (isError || !planDetail) {
    return (
      <>
        <TopNavBar variant="default" onSearchClick={() => navigate("/search")} />
        <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4">
          <h2 className="text-base font-semibold text-neutral-900">
            약속 정보를 불러올 수 없습니다
          </h2>
          <button
            onClick={() => {
              fetchPlanDetail();
              fetchCandidates("0");
            }}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white"
          >
            다시 시도
          </button>
        </div>
      </>
    );
  }


  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-[#E8F4F8] to-[#F0F9FC] pb-32">
        {/* Top Navigation */}
        <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-neutral-200/50 px-4 py-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-neutral-900">약속</h2>
            <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">{participants.length}명</span>
            </div>
          </div>
        </div>

        {/* Header Section */}
        <div className="px-4 pt-6 pb-2">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-neutral-600">{formattedDate}</p>
              <h1 className="mt-1 text-2xl font-bold leading-tight text-neutral-900">
                {planDetail.roomName}의 약속 이름(수정)
              </h1>
            </div>
            
            {/* Participant Avatars */}
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

        {/* Info Banner */}
        {selectedTool && (
          <div className="mx-4 mt-4 animate-in slide-in-from-top duration-300">
            <div className="rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 p-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-neutral-900">
                    현재 화면의 {restaurants.length}개 식당이 선택됩니다
                  </p>
                  <p className="text-xs text-neutral-600 mt-0.5">
                    {selectedTool === "VOTE" && "투표에 참여할 식당 목록입니다"}
                    {selectedTool === "ROULETTE" && "룰렛에 포함될 식당 목록입니다"}
                    {selectedTool === "LADDER" && "토너먼트에 참가할 식당 목록입니다"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Restaurant List */}
        <div className="px-4 pt-4">
          {isLoadingCandidates ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-neutral-500">식당 목록을 불러오는 중...</p>
            </div>
          ) : restaurants.length > 0 ? (
            <>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-neutral-700">
                  {restaurants.length}개의 후보 식당
                </p>
              </div>

              <div className="flex flex-col gap-3">
                {restaurants.map((restaurant) => (
                  <RestaurantCard
                    key={restaurant.id}
                    restaurant={restaurant}
                    highlight={selectedTool !== null}
                  />
                ))}
              </div>

              {/* 이전 세트 / 다음 세트 버튼 */}
              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  onClick={handlePrevious}
                  disabled={isLoadingCandidates || currentHistoryIndex === 0}
                  className="flex items-center gap-2 rounded-xl bg-white border-2 border-primary/30 px-6 py-3 text-sm font-semibold text-primary transition-all hover:border-primary hover:bg-primary hover:text-white disabled:opacity-30 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                >
                  <ChevronLeft className="h-5 w-5" />
                  <span>이전 세트</span>
                </button>

                <button
                  onClick={handleNext}
                  disabled={isLoadingCandidates || !hasMore}
                  className="flex items-center gap-2 rounded-xl bg-white border-2 border-primary/30 px-6 py-3 text-sm font-semibold text-primary transition-all hover:border-primary hover:bg-primary hover:text-white disabled:opacity-30 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                >
                  <span>다음 세트</span>
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              {!hasMore && (
                <div className="mt-4 flex items-center justify-center rounded-xl py-3">
                  <p className="text-sm font-medium text-neutral-600">
                    모든 후보를 불러왔습니다
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100">
                <span className="text-4xl">🍽️</span>
              </div>
              <p className="text-sm font-medium text-neutral-500">
                아직 후보 식당이 없습니다
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-20 left-0 right-0 z-20 from-white via-white to-transparent pt-4 pb-6 px-4">
        <div ref={toolButtonsRef} className="flex gap-2">
          <button
            onClick={() => handleSelectToolClick("VOTE")}
            disabled={isLoadingCandidates || restaurants.length === 0}
            className={`group relative flex flex-1 flex-col items-center gap-1.5 rounded-xl p-3 text-xs font-semibold shadow-md transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-40 ${
              selectedTool === "VOTE"
                ? "bg-primary text-white shadow-lg scale-105"
                : "bg-white text-neutral-700 hover:bg-primary hover:text-white hover:shadow-lg hover:scale-105"
            }`}
          >
            <Vote
              className={`h-5 w-5 transition-transform duration-300 ${
                selectedTool === "VOTE" ? "scale-110" : "group-hover:scale-110"
              }`}
            />
            <span className="text-xs">투표</span>
            
            {selectedTool === "VOTE" && (
              <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-green-500 shadow-md">
                <CheckCircle2 className="h-2.5 w-2.5 text-white" />
              </div>
            )}
          </button>

          <button
            onClick={() => handleSelectToolClick("ROULETTE")}
            disabled={isLoadingCandidates || restaurants.length === 0}
            className={`group relative flex flex-1 flex-col items-center gap-1.5 rounded-xl p-3 text-xs font-semibold shadow-md transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-40 ${
              selectedTool === "ROULETTE"
                ? "bg-primary text-white shadow-lg scale-105"
                : "bg-white text-neutral-700 hover:bg-primary hover:text-white hover:shadow-lg hover:scale-105"
            }`}
          >
            <Dice5
              className={`h-5 w-5 transition-transform duration-300 ${
                selectedTool === "ROULETTE" ? "scale-110" : "group-hover:scale-110"
              }`}
            />
            <span className="text-xs">룰렛</span>
            
            {selectedTool === "ROULETTE" && (
              <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-green-500 shadow-md">
                <CheckCircle2 className="h-2.5 w-2.5 text-white" />
              </div>
            )}
          </button>

          <button
            onClick={() => handleSelectToolClick("LADDER")}
            disabled={isLoadingCandidates || restaurants.length === 0}
            className={`group relative flex flex-1 flex-col items-center gap-1.5 rounded-xl p-3 text-xs font-semibold shadow-md transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-40 ${
              selectedTool === "LADDER"
                ? "bg-primary text-white shadow-lg scale-105"
                : "bg-white text-neutral-700 hover:bg-primary hover:text-white hover:shadow-lg hover:scale-105"
            }`}
          >
            <Trophy
              className={`h-5 w-5 transition-transform duration-300 ${
                selectedTool === "LADDER" ? "scale-110" : "group-hover:scale-110"
              }`}
            />
            <span className="text-xs">토너먼트</span>
            
            {selectedTool === "LADDER" && (
              <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-green-500 shadow-md">
                <CheckCircle2 className="h-2.5 w-2.5 text-white" />
              </div>
            )}
          </button>
        </div>
        
        {selectedTool && (
          <button
            onClick={handleStartTool}
            className="mt-2 w-full rounded-xl bg-gradient-to-r from-primary to-primary/90 py-3 text-sm font-bold text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.01] active:scale-[0.99]"
          >
            {selectedTool === "VOTE" && "투표 시작하기"}
            {selectedTool === "ROULETTE" && "룰렛 돌리기"}
            {selectedTool === "LADDER" && "토너먼트 시작하기"}
          </button>
        )}
      </div>

      <BottomNavBar />
    </>
  );
}
