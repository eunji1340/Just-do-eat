import { useCallback, useState, useRef, useEffect } from "react";
import { getPlanCandidates } from "@/entities/plan/api/getPlanCandidates";
import type { Restaurant } from "@/entities/plan/model/types";
import { mapCandidateToRestaurant } from "../utils/mapCandidateToRestaurant";

export function usePlanCandidates(planId: string | undefined) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [cursor, setCursor] = useState<string | null>("0");
  const [hasMore, setHasMore] = useState(true);
  const [cursorHistory, setCursorHistory] = useState<string[]>(["0"]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(0);

  const cursorRef = useRef<string | null>("0");
  const hasMoreRef = useRef(true);

  const fetchCandidates = useCallback(
    async (
      currentCursor: string | null,
      addToHistory: boolean = false,
      historyIndex?: number
    ) => {
      if (!planId || currentCursor === null) return;

      try {
        setIsLoading(true);
        const response = await getPlanCandidates(planId, currentCursor);
        const mappedRestaurants = response.items.map(mapCandidateToRestaurant);
        setRestaurants(mappedRestaurants);

        const nextCursor = response.next_cursor;
        const hasNextPage = nextCursor !== null && nextCursor !== "0";

        if (addToHistory) {
          setCurrentHistoryIndex((currentIndex) => {
            const index =
              historyIndex !== undefined ? historyIndex : currentIndex;
            setCursorHistory((prev) => {
              const newHistory = prev.slice(0, index + 1);
              newHistory.push(currentCursor);
              return newHistory;
            });
            return index + 1;
          });
        }

        setCursor(nextCursor);
        cursorRef.current = nextCursor;
        setHasMore(hasNextPage);
        hasMoreRef.current = hasNextPage;
      } catch (error) {
        console.error("후보 식당 목록 로딩 실패:", error);
        setRestaurants([]);
        setHasMore(false);
        hasMoreRef.current = false;
      } finally {
        setIsLoading(false);
      }
    },
    [planId]
  );

  const handleNext = useCallback(() => {
    const currentCursor = cursorRef.current;
    const currentHasMore = hasMoreRef.current;
    if (currentCursor && currentHasMore && !isLoading) {
      fetchCandidates(currentCursor, true);
    }
  }, [isLoading, fetchCandidates]);

  const handlePrevious = useCallback(() => {
    if (currentHistoryIndex > 0 && !isLoading) {
      const prevIndex = currentHistoryIndex - 1;
      const prevCursor = cursorHistory[prevIndex];
      setCurrentHistoryIndex(prevIndex);
      fetchCandidates(prevCursor, false, prevIndex);
    }
  }, [currentHistoryIndex, cursorHistory, isLoading, fetchCandidates]);

  useEffect(() => {
    cursorRef.current = cursor;
  }, [cursor]);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  useEffect(() => {
    if (!planId) return;
    setCursorHistory(["0"]);
    setCurrentHistoryIndex(0);
    setCursor("0");
    cursorRef.current = "0";
    setHasMore(true);
    hasMoreRef.current = true;
    fetchCandidates("0", false);
  }, [planId, fetchCandidates]);

  return {
    restaurants,
    isLoading,
    hasMore,
    handleNext,
    handlePrevious,
    currentHistoryIndex,
  };
}
