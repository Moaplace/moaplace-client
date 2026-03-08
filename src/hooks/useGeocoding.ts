import { useCallback, useState } from 'react';

import api from '@/lib/api';

interface UseGeocodingReturn {
  address: string | null;
  isLoading: boolean;
  reverseGeocode: (lat: number, lng: number) => Promise<string>;
}

const useGeocoding = (): UseGeocodingReturn => {
  const [address, setAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<string> => {
    setIsLoading(true);
    try {
      const result = await api.reverseGeocode(lat, lng);
      setAddress(result);
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { address, isLoading, reverseGeocode };
};

export default useGeocoding;
