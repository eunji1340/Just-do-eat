import { useState, useEffect } from "react";
import { searchRestaurants } from "@/entities/restaurant/api/searchRestaurants";
import { mapSearchResponseToRestaurant } from "@/entities/restaurant/model/mappers";
import type { Restaurant } from "@/entities/restaurant/model/types";

export function useRestaurantSearch(query: string) {
  const [results, setResults] = useState<Restaurant[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setResults([]);
    setPage(0);
    setHasMore(true);
  }, [query]);

  useEffect(() => {
    if (!query) return;

    (async () => {
      try {
        setLoading(true);
        const data = await searchRestaurants({query, page});

        const mapped = data.content.map(mapSearchResponseToRestaurant);

        if (page === 0) setResults(mapped);
        else setResults((prev) => [...prev, ...mapped]);

        setTotal(data.totalElements);
        setHasMore(!data.last);
      } catch (e) {
        setError("검색 중 오류");
        console.log(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [query, page]);

  return { results, total, loading, error, hasMore, loadMore: () => setPage((p) => p + 1) };
}
