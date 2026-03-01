import { Users } from 'lucide-react';

import { Badge } from '@/components/ui/badge';

interface RoomHeaderProps {
  roomName: string;
  participantCount: number;
}

const RoomHeader = ({ roomName, participantCount }: RoomHeaderProps) => {
  return (
    <div className="flex items-center justify-between h-14">
      <h1 className="text-lg font-pretendard-sb text-black truncate">
        {roomName}
      </h1>
      <Badge variant="secondary" className="bg-primary-100 text-primary border-0 gap-1">
        <Users className="w-3 h-3" />
        {participantCount}명
      </Badge>
    </div>
  );
};

export default RoomHeader;
