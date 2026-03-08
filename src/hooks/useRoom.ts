import { useEffect } from 'react';

import { useRoomStore } from '@/store/roomStore';

const useRoom = (roomId: string | undefined) => {
  const fetchRoom = useRoomStore((s) => s.fetchRoom);

  useEffect(() => {
    if (roomId) {
      fetchRoom(roomId);
    }
  }, [roomId, fetchRoom]);
};

export default useRoom;
