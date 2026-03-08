import { useEffect, useState } from 'react';
import { Coffee, MapPin, Train, UtensilsCrossed } from 'lucide-react';

import { cn } from '@/lib/utils';
import api from '@/lib/api';
import type { NearbyPlace } from '@/types';

interface NearbyPlaceListProps {
  lat: number;
  lng: number;
  className?: string;
}

const CATEGORIES = [
  { key: 'all', label: '전체', icon: MapPin },
  { key: 'restaurant', label: '식당', icon: UtensilsCrossed },
  { key: 'cafe', label: '카페', icon: Coffee },
  { key: 'subway', label: '지하철', icon: Train },
] as const;

const NearbyPlaceList = ({ lat, lng, className }: NearbyPlaceListProps) => {
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [category, setCategory] = useState<string>('all');

  useEffect(() => {
    const fetchPlaces = async () => {
      const data = await api.getNearbyPlaces(lat, lng, category);
      setPlaces(data);
    };
    fetchPlaces();
  }, [lat, lng, category]);

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <h3 className="text-sm font-pretendard-sb text-black-800">주변 시설 추천</h3>

      <div className="flex gap-2">
        {CATEGORIES.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setCategory(key)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-pretendard-md transition-colors',
              category === key
                ? 'bg-primary text-white'
                : 'bg-black-100 text-black-600 hover:bg-black-300/50',
            )}
          >
            <Icon className="size-3.5" />
            {label}
          </button>
        ))}
      </div>

      <ul className="flex flex-col gap-2">
        {places.map((place) => {
          const catInfo = CATEGORIES.find((c) => c.key === place.category);
          const Icon = catInfo?.icon ?? MapPin;
          return (
            <li
              key={place.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-black-100/50 hover:bg-black-100 transition-colors"
            >
              <div className="flex size-8 items-center justify-center rounded-full bg-white shadow-sm">
                <Icon className="size-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-pretendard-md text-black-800 truncate">{place.name}</p>
              </div>
              <span className="text-xs text-black-400 shrink-0">{place.distance}m</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default NearbyPlaceList;
