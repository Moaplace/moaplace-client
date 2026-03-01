import { MapPin } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { Marker } from '@/types';

interface ParticipantListProps {
  markers: Marker[];
  myNickname: string;
}

const ParticipantList = ({ markers, myNickname }: ParticipantListProps) => {
  return (
    <div className="flex flex-col gap-2">
      {markers.map((marker) => {
        const isMine = marker.nickname === myNickname;
        return (
          <div
            key={marker.id}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-black-100"
          >
            <div
              className={cn(
                'flex items-center justify-center w-7 h-7 rounded-full',
                isMine ? 'bg-sub text-white' : 'bg-primary text-white',
              )}
            >
              <MapPin className="w-3.5 h-3.5" />
            </div>
            <span className="text-sm font-pretendard-md text-black-800 flex-1">
              {marker.nickname}
              {isMine && (
                <span className="text-xs text-black-400 ml-1">(나)</span>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default ParticipantList;
