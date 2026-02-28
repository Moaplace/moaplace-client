import type { Room, Marker, MarkerRequest, RoomResult } from '@/types';
import type { ApiClient } from './api.interface';

const STORAGE_KEY = 'moaplace_rooms';

const getRooms = (): Record<string, Room> => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : {};
};

const saveRooms = (rooms: Record<string, Room>) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
};

const assertRoom = (room: Room | undefined): Room => {
  if (!room) throw new Error('방을 찾을 수 없어요');
  return room;
};

const mutateRooms = (fn: (rooms: Record<string, Room>) => void) => {
  const rooms = getRooms();
  fn(rooms);
  saveRooms(rooms);
  return rooms;
};

const mockApi: ApiClient = {
  async createRoom(name: string): Promise<Room> {
    const room: Room = {
      id: crypto.randomUUID(),
      name: name.trim() || '이름 없는 모임',
      markers: [],
      createdAt: new Date().toISOString(),
    };
    mutateRooms((rooms) => {
      rooms[room.id] = room;
    });
    return room;
  },

  async getRoom(roomId: string): Promise<Room> {
    const rooms = getRooms();
    return assertRoom(rooms[roomId]);
  },

  async addMarker(roomId: string, req: MarkerRequest): Promise<Marker> {
    const marker: Marker = {
      id: crypto.randomUUID(),
      nickname: req.nickname,
      lat: req.lat,
      lng: req.lng,
      address: req.address,
      createdAt: new Date().toISOString(),
    };
    mutateRooms((rooms) => {
      const room = assertRoom(rooms[roomId]);
      room.markers.push(marker);
    });
    return marker;
  },

  async deleteMarker(roomId: string, markerId: string): Promise<void> {
    mutateRooms((rooms) => {
      const room = assertRoom(rooms[roomId]);
      room.markers = room.markers.filter((m) => m.id !== markerId);
    });
  },

  async getResult(roomId: string): Promise<RoomResult | null> {
    const rooms = getRooms();
    const room = assertRoom(rooms[roomId]);
    if (room.markers.length < 2) return null;
    // Phase 4에서 중심점/TSP 계산 연결
    return null;
  },
};

export default mockApi;
