import { MapPin } from 'lucide-react';

import MapMarker from '@/components/Map/MapMarker';
import { cn } from '@/lib/utils';
import type { Marker } from '@/types';

interface MockMapViewProps {
  markers: Marker[];
  myNickname: string;
  centroid?: { lat: number; lng: number };
  onMapClick: (x: number, y: number) => void;
  className?: string;
}

const MockMapView = ({
  markers,
  myNickname,
  centroid,
  onMapClick,
  className,
}: MockMapViewProps) => {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onMapClick(x, y);
  };

  return (
    <div
      className={cn(
        'relative rounded-xl overflow-hidden cursor-crosshair select-none',
        'bg-gradient-to-br from-surface via-white to-primary-100/30',
        'bg-[radial-gradient(circle,_var(--color-black-300)_0.5px,_transparent_0.5px)] bg-[size:32px_32px]',
        className,
      )}
      onClick={handleClick}
    >
      {/* 빈 상태 안내 */}
      {markers.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-black-400">
          <MapPin className="size-12 text-black-300" />
          <p className="text-sm font-pretendard-md">지도를 탭해서 위치를 찍어주세요</p>
        </div>
      )}

      {/* 마커 렌더링 */}
      {markers.map((marker) => (
        <MapMarker
          key={marker.id}
          type={marker.nickname === myNickname ? 'mine' : 'others'}
          nickname={marker.nickname}
          x={marker.lng}
          y={marker.lat}
        />
      ))}

      {/* 중심점 */}
      {centroid && (
        <MapMarker type="center" x={centroid.lng} y={centroid.lat} />
      )}
    </div>
  );
};

export default MockMapView;
