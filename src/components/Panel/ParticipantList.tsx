import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { Marker } from "@/types";

interface ParticipantListProps {
  markers: Marker[];
  myNickname: string;
  onParticipantClick?: (marker: Marker) => void;
}

const ParticipantList = ({
  markers,
  myNickname,
  onParticipantClick,
}: ParticipantListProps) => {
  return (
    <div className="flex flex-col gap-1">
      {markers.map((marker) => {
        const isMine = marker.nickname === myNickname;
        return (
          <button
            key={marker.id}
            onClick={() => onParticipantClick?.(marker)}
            className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-surface text-left w-full"
          >
            <div
              className={cn(
                "flex items-center justify-center size-8 rounded-full text-white text-xs font-pretendard-sb",
                isMine ? "bg-sub" : "bg-primary",
              )}
            >
              {marker.nickname[0]}
            </div>
            <span className="text-sm font-pretendard-md text-black-800 flex-1">
              {marker.nickname}
            </span>
            {isMine && (
              <Badge variant="sub" className="text-[10px]">
                나
              </Badge>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default ParticipantList;
