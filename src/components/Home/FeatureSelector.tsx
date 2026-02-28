import { MapPin, Clock } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { RoomType } from '@/types';

interface FeatureSelectorProps {
  selected: RoomType;
  onSelect: (type: RoomType) => void;
}

const features = [
  {
    type: 'place' as const,
    icon: MapPin,
    title: '모아장소',
    description: '만날 장소를 같이 찾자',
  },
  {
    type: 'time' as const,
    icon: Clock,
    title: '모아타임',
    description: '만날 시간을 같이 정하자',
  },
] as const;

const FeatureSelector = ({ selected, onSelect }: FeatureSelectorProps) => {
  return (
    <div className="grid grid-cols-2 gap-3 w-full">
      {features.map(({ type, icon: Icon, title, description }) => (
        <button
          key={type}
          type="button"
          onClick={() => onSelect(type)}
          className={cn(
            'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors',
            selected === type
              ? 'border-primary bg-primary-100'
              : 'border-black-300 bg-white hover:border-black-400'
          )}
        >
          <Icon
            className={cn(
              'w-6 h-6',
              selected === type ? 'text-primary' : 'text-black-600'
            )}
          />
          <span className="text-sm font-pretendard-sb text-black">{title}</span>
          <span className="text-xs text-black-600">{description}</span>
        </button>
      ))}
    </div>
  );
};

export default FeatureSelector;
