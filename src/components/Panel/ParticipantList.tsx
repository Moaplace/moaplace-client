import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { Marker } from '@/types';

interface ParticipantListProps {
  markers: Marker[];
  myNickname: string;
}

const ParticipantList = ({ markers, myNickname }: ParticipantListProps) => {
  return (
    <div className="flex flex-col gap-1">
      {markers.map((marker) => {
        const isMine = marker.nickname === myNickname;
        return (
          <div
            key={marker.id}
            className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-surface"
          >
            <div
              className={cn(
                'flex items-center justify-center size-8 rounded-full text-white text-xs font-pretendard-sb',
                isMine ? 'bg-sub' : 'bg-primary',
              )}
            >
              {marker.nickname[0]}
            </div>
            <span className="text-sm font-pretendard-md text-black-800 flex-1">
              {marker.nickname}
            </span>
            {isMine && <Badge variant="sub" className="text-[10px]">나</Badge>}
          </div>
        );
      })}
    </div>
  );
};

export default ParticipantList;
