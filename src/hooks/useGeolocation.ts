import { useCallback, useState } from 'react';

import type { LatLng } from '@/types';

interface UseGeolocationReturn {
  position: LatLng | null;
  error: string | null;
  isLoading: boolean;
  getCurrentPosition: () => void;
  clearPosition: () => void;
}

const useGeolocation = (): UseGeolocationReturn => {
  const [position, setPosition] = useState<LatLng | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setError('이 브라우저에서는 위치 서비스를 지원하지 않아요');
      return;
    }

    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setIsLoading(false);
      },
      (err) => {
        const messages: Record<number, string> = {
          1: '위치 권한을 허용해주세요',
          2: '위치를 가져올 수 없어요',
          3: '위치 요청이 시간 초과되었어요',
        };
        setError(messages[err.code] ?? '위치를 가져올 수 없어요');
        setIsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  const clearPosition = useCallback(() => setPosition(null), []);

  return { position, error, isLoading, getCurrentPosition, clearPosition };
};

export default useGeolocation;
