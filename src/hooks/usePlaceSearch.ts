import { useCallback, useState } from 'react';

import api from '@/lib/api';
import type { PlaceResult } from '@/types';

interface UsePlaceSearchReturn {
  results: PlaceResult[];
  isLoading: boolean;
  search: (query: string) => Promise<void>;
  clear: () => void;
}

const usePlaceSearch = (): UsePlaceSearchReturn => {
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    try {
      const data = await api.searchPlaces(query);
      setResults(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clear = useCallback(() => setResults([]), []);

  return { results, isLoading, search, clear };
};

export default usePlaceSearch;
