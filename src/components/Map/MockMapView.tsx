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
        'relative bg-black-100 rounded-xl overflow-hidden cursor-crosshair select-none',
        'bg-[radial-gradient(circle,_var(--color-black-300)_1px,_transparent_1px)] bg-[size:24px_24px]',
        className,
      )}
      onClick={handleClick}
    >
      {/* 빈 상태 안내 */}
      {markers.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-black-400">
          <MapPin className="w-8 h-8" />
          <p className="text-sm">지도를 탭하여 위치를 찍어주세요</p>
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
