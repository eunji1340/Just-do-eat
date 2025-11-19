import { useState, useEffect, useCallback } from "react";
import { getUserMe, type UserMeResponse } from "../api/getUserMe";

/**
 * 사용자 정보 조회 훅
 */
export function useUserMe() {
  const [userData, setUserData] = useState<UserMeResponse["data"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUserData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getUserMe();
      setUserData(data || null);
      return data;
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new Error("사용자 정보를 불러오는데 실패했습니다.")
      );
      console.error("사용자 정보 조회 실패:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  return { userData, isLoading, error, refetch: fetchUserData };
}
