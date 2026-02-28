import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRoomStore } from '@/store/roomStore';

const CreateRoom = () => {
  const [roomName, setRoomName] = useState('');
  const createRoom = useRoomStore((s) => s.createRoom);
  const isLoading = useRoomStore((s) => s.isLoading);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const room = await createRoom(roomName.trim());
      toast.success('모임이 만들어졌어요!');
      navigate(`/room/${room.id}`);
    } catch {
      toast.error('모임 생성에 실패했어요. 다시 시도해주세요.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full">
      <Input
        type="text"
        value={roomName}
        onChange={(e) => setRoomName(e.target.value)}
        placeholder="모임 이름을 입력해주세요 (예: 주말 점심 모임)"
        className="h-12 px-4 text-base"
      />
      <Button
        type="submit"
        size="lg"
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? '만드는 중...' : '새로운 모임 만들기'}
      </Button>
    </form>
  );
};

export default CreateRoom;
