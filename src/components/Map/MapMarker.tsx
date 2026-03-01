import { MapPin, Star } from 'lucide-react';

import { cn } from '@/lib/utils';

type MarkerType = 'mine' | 'others' | 'center';

interface MapMarkerProps {
  type: MarkerType;
  nickname?: string;
  x: number;
  y: number;
}

const markerStyles = {
  mine: 'bg-sub text-white',
  others: 'bg-primary text-white',
  center: 'bg-error text-white',
} as const;

const MapMarker = ({ type, nickname, x, y }: MapMarkerProps) => {
  return (
    <div
      className="absolute flex flex-col items-center -translate-x-1/2 -translate-y-full pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      {nickname && (
        <span className="text-xs font-pretendard-md text-black-800 bg-white px-1.5 py-0.5 rounded shadow-sm mb-1 whitespace-nowrap">
          {nickname}
        </span>
      )}
      <div
        className={cn(
          'flex items-center justify-center w-8 h-8 rounded-full shadow-md',
          markerStyles[type],
        )}
      >
        {type === 'center' ? (
          <Star className="w-4 h-4" />
        ) : (
          <MapPin className="w-4 h-4" />
        )}
      </div>
    </div>
  );
};

export default MapMarker;
