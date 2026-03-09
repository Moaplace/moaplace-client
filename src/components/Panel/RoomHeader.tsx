import { memo } from 'react';
import { ChevronDown, Users } from 'lucide-react';

interface RoomHeaderProps {
  roomName: string;
  participantCount: number;
  onBadgeClick?: () => void;
}

const RoomHeader = memo(({ roomName, participantCount, onBadgeClick }: RoomHeaderProps) => {
  return (
    <div className="flex items-center justify-between w-full">
      <h1 className="text-lg font-pretendard-sb text-black truncate">
        {roomName}
      </h1>
      <button
        onClick={onBadgeClick}
        className="flex items-center gap-1 py-2 pl-3 pr-2 text-sm font-pretendard-md text-primary active:scale-95 transition-transform"
      >
        <Users className="w-4 h-4" />
        {participantCount}명
        <ChevronDown className="w-4 h-4" />
      </button>
    </div>
  );
});

RoomHeader.displayName = 'RoomHeader';

export default RoomHeader;
