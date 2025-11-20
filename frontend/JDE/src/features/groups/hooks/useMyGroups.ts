// src/features/groups/hooks/useMyRooms.ts
import * as React from "react";
import type { Room } from "@/entities/groups/types";
import { getMyGroups } from "../api/getMyGroups";

export function useMyGroups() {
  const [rooms, setRooms] = React.useState<Room[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setIsLoading(true);
        const data = await getMyGroups();
        if (!cancelled) setRooms(data);
      } catch (err) {
        if (!cancelled) setError(err as Error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return { rooms, isLoading, error };
}
