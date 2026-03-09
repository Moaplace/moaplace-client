import { useCallback, useEffect, useRef, useState } from 'react';

import api from '@/lib/api';

interface UseGeocodingReturn {
  address: string | null;
  isLoading: boolean;
  reverseGeocode: (lat: number, lng: number) => Promise<string>;
}

const useGeocoding = (): UseGeocodingReturn => {
  const [address, setAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<string> => {
    setIsLoading(true);
    try {
      const result = await api.reverseGeocode(lat, lng);
      if (mountedRef.current) setAddress(result);
      return result;
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, []);

  return { address, isLoading, reverseGeocode };
};

export default useGeocoding;
