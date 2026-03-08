import { useCallback, useState } from 'react';

import api from '@/lib/api';
import type { LatLng, DirectionsResult } from '@/types';

interface UseDirectionsReturn {
  route: DirectionsResult | null;
  isLoading: boolean;
  getRoute: (origin: LatLng, destination: LatLng, waypoints?: LatLng[]) => Promise<DirectionsResult>;
}

const useDirections = (): UseDirectionsReturn => {
  const [route, setRoute] = useState<DirectionsResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getRoute = useCallback(async (origin: LatLng, destination: LatLng, waypoints?: LatLng[]) => {
    setIsLoading(true);
    try {
      const result = await api.getDirections(origin, destination, waypoints);
      setRoute(result);
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { route, isLoading, getRoute };
};

export default useDirections;
