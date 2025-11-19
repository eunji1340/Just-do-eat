import { useState, useEffect, useCallback, useRef } from "react";
import {
  voteStart,
  voteSubmit,
  voteTally,
  type VoteTallyResponse,
} from "@/entities/plan/api";
import { decidePlan } from "@/entities/plan/api/decidePlan";
import { useUserMe } from "@/features/user/model/useUserMe";

const POLLING_INTERVAL = 3000; // 3초마다 폴링

export function useVote(
  planId: string | undefined,
  isVoting: boolean,
  fetchPlanDetail: () => Promise<void>
) {
  const { userData } = useUserMe();
  const currentUserId = userData?.userId;

  const [voteTallyData, setVoteTallyData] = useState<VoteTallyResponse | null>(
    null
  );
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<
    string | null
  >(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pollingIntervalRef = useRef<number | null>(null);
  // 사용자가 직접 선택한 경우를 추적 (라디오 버튼 클릭 등)
  const userSelectedRef = useRef<string | null>(null);

  // 투표 시작
  const startVote = useCallback(async () => {
    if (!planId) return;
    try {
      await voteStart(planId);
      // 투표 재시작 시 상태 초기화
      userSelectedRef.current = null;
      setSelectedRestaurantId(null);
      setHasVoted(false);
      await fetchPlanDetail();
    } catch (error) {
      console.error("[useVote] 투표 시작 실패:", error);
      throw error;
    }
  }, [planId, fetchPlanDetail]);

  // 투표 집계 조회
  const fetchTally = useCallback(async () => {
    if (!planId || !currentUserId) return;

    try {
      const data = await voteTally(planId);
      setVoteTallyData(data);

      // 현재 사용자가 투표한 식당 찾기
      const userVote = data.results.find((result) =>
        result.userIds.includes(currentUserId)
      );

      // 현재 선택된 식당 ID를 참조하여 덮어쓰지 않도록 함
      setSelectedRestaurantId((prevSelectedId) => {
        // 사용자가 직접 선택한 경우 (라디오 버튼 클릭 등) 항상 유지
        if (
          userSelectedRef.current &&
          prevSelectedId === userSelectedRef.current
        ) {
          console.log(
            "[useVote] 사용자가 직접 선택한 식당 유지:",
            prevSelectedId
          );
          // 서버에 투표 기록이 있으면 hasVoted 업데이트
          if (userVote) {
            setHasVoted(true);
          } else {
            setHasVoted(false);
          }
          return prevSelectedId;
        }

        // 사용자가 이미 투표를 제출한 경우 서버 정보 우선
        if (userVote) {
          setHasVoted(true);
          // 현재 선택된 식당이 없거나, 서버의 투표 정보와 다를 때만 업데이트
          if (
            !prevSelectedId ||
            prevSelectedId !== userVote.restaurantId.toString()
          ) {
            console.log("[useVote] 사용자 투표 정보 확인:", {
              restaurantId: userVote.restaurantId,
              hasVoted: true,
            });
            // 사용자가 직접 선택한 경우가 아니므로 서버 정보로 업데이트
            userSelectedRef.current = null;
            return userVote.restaurantId.toString();
          }
          // 현재 선택된 식당이 서버 정보와 같으면 유지
          return prevSelectedId;
        } else {
          // 서버에 투표 정보가 없는 경우
          setHasVoted(false);
          // 현재 선택된 식당이 있으면 유지 (사용자가 선택 중일 수 있음)
          if (prevSelectedId) {
            console.log(
              "[useVote] 서버 투표 정보 없음, 현재 선택 유지:",
              prevSelectedId
            );
            return prevSelectedId;
          }
          // 선택된 식당도 없으면 null
          console.log("[useVote] 사용자 투표 정보 없음");
          userSelectedRef.current = null;
          return null;
        }
      });
    } catch (error) {
      console.error("[useVote] 투표 집계 조회 실패:", error);
    }
  }, [planId, currentUserId]);

  // 투표 제출
  const submitVote = useCallback(async () => {
    if (!planId || !selectedRestaurantId) return;

    try {
      setIsSubmitting(true);
      const restaurantIdNum = parseInt(selectedRestaurantId, 10);
      await voteSubmit(planId, restaurantIdNum);
      setHasVoted(true);
      // 투표 제출 후에는 사용자 직접 선택 추적 초기화 (서버 정보로 동기화)
      userSelectedRef.current = null;
      // 투표 제출 후 즉시 집계 다시 조회하여 상태 업데이트
      await fetchTally();
    } catch (error: any) {
      console.error("[useVote] 투표 제출 실패:", error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [planId, selectedRestaurantId, fetchTally]);

  // 투표 종료 및 확정 (식당 ID 직접 지정 가능)
  const endVoteAndDecide = useCallback(
    async (restaurantId?: number) => {
      if (!planId || !voteTallyData) return;

      try {
        let finalRestaurantId: number;

        if (restaurantId) {
          // 매니저가 직접 선택한 경우
          finalRestaurantId = restaurantId;
        } else {
          // 자동으로 가장 높은 표를 받은 식당 찾기
          const maxVotes = Math.max(
            ...voteTallyData.results.map((r) => r.votes)
          );

          if (maxVotes === 0) {
            throw new Error("투표 결과가 없습니다.");
          }

          // 동점인 식당들 찾기
          const topRestaurants = voteTallyData.results.filter(
            (r) => r.votes === maxVotes
          );

          if (topRestaurants.length > 1) {
            // 동점인 경우 첫 번째 식당으로 확정 (정책에 따라 변경 가능)
            console.warn(
              `[useVote] 동점 발생: ${topRestaurants.length}개 식당이 ${maxVotes}표로 동점입니다. 첫 번째 식당으로 확정합니다.`,
              topRestaurants
            );
          }

          // 동점인 경우 첫 번째 식당으로 확정
          finalRestaurantId = topRestaurants[0].restaurantId;
        }

        await decidePlan(planId, finalRestaurantId);
        await fetchPlanDetail();
      } catch (error) {
        console.error("[useVote] 투표 종료 및 확정 실패:", error);
        throw error;
      }
    },
    [planId, voteTallyData, fetchPlanDetail]
  );

  // 폴링 시작/중지
  useEffect(() => {
    if (isVoting && planId) {
      // 즉시 한 번 조회
      fetchTally();

      // 주기적으로 조회
      pollingIntervalRef.current = window.setInterval(() => {
        fetchTally();
      }, POLLING_INTERVAL);
    } else {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [isVoting, planId, fetchTally]);

  // 식당별 표 수 가져오기
  const getVoteCount = useCallback(
    (restaurantId: string) => {
      if (!voteTallyData) return 0;
      const result = voteTallyData.results.find(
        (r) => r.restaurantId === parseInt(restaurantId, 10)
      );
      return result?.votes || 0;
    },
    [voteTallyData]
  );

  // 동점인 식당들 찾기 (외부에서 사용할 수 있도록)
  const getTiedRestaurants = useCallback(() => {
    if (!voteTallyData || voteTallyData.results.length === 0) return [];

    const maxVotes = Math.max(...voteTallyData.results.map((r) => r.votes));
    if (maxVotes === 0) return [];

    const topRestaurants = voteTallyData.results.filter(
      (r) => r.votes === maxVotes
    );

    return topRestaurants.length > 1 ? topRestaurants : [];
  }, [voteTallyData]);

  // setSelectedRestaurantId를 래핑하여 사용자 직접 선택을 추적
  const setSelectedRestaurantIdWithTracking = useCallback(
    (restaurantId: string | null) => {
      if (restaurantId) {
        userSelectedRef.current = restaurantId;
      } else {
        userSelectedRef.current = null;
      }
      setSelectedRestaurantId(restaurantId);
    },
    []
  );

  return {
    voteTallyData,
    selectedRestaurantId,
    setSelectedRestaurantId: setSelectedRestaurantIdWithTracking,
    hasVoted,
    isSubmitting,
    startVote,
    submitVote,
    endVoteAndDecide,
    getVoteCount,
    totalVotes: voteTallyData?.totalVotes,
    getTiedRestaurants,
  };
}
