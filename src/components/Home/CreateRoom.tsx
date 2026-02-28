import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { useRoomStore } from '@/store/roomStore';
import type { RoomType } from '@/types';

interface CreateRoomProps {
  roomType: RoomType;
}

const CreateRoom = ({ roomType }: CreateRoomProps) => {
  const [roomName, setRoomName] = useState('');
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const createRoom = useRoomStore((s) => s.createRoom);
  const isLoading = useRoomStore((s) => s.isLoading);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dates =
        roomType === 'time'
          ? selectedDates.map((d) => d.toISOString().split('T')[0])
          : undefined;
      const room = await createRoom(roomName.trim(), roomType, dates);
      toast.success(
        roomType === 'place'
          ? '모임이 만들어졌어요!'
          : '시간 모으기가 시작됐어요!'
      );
      navigate(`/room/${room.id}`);
    } catch {
      toast.error('모임 생성에 실패했어요. 다시 시도해주세요.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-pretendard-sb text-black-800">
          모임 이름
        </label>
        <Input
          type="text"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          placeholder="예: 주말 점심 모임"
          className="h-12 px-4 text-base"
        />
      </div>

      {roomType === 'time' && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-pretendard-sb text-black-800">
            모임 날짜
          </label>
          <Calendar
            mode="multiple"
            selected={selectedDates}
            onSelect={(dates) => setSelectedDates(dates ?? [])}
            className="rounded-xl border border-black-300 p-3"
          />
        </div>
      )}

      <Button type="submit" size="lg" disabled={isLoading} className="w-full">
        {isLoading
          ? '만드는 중...'
          : roomType === 'place'
            ? '장소 모으기 시작'
            : '시간 모으기 시작'}
      </Button>
    </form>
  );
};

export default CreateRoom;
