import type { Room, Marker, MarkerRequest, RoomResult } from '@/types';

const STORAGE_KEY = 'moaplace_rooms';

const getRooms = (): Record<string, Room> => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : {};
};

const saveRooms = (rooms: Record<string, Room>) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
};

const api = {
  async createRoom(name: string): Promise<Room> {
    const rooms = getRooms();
    const room: Room = {
      id: crypto.randomUUID(),
      name: name.trim() || '이름 없는 모임',
      markers: [],
      createdAt: new Date().toISOString(),
    };
    rooms[room.id] = room;
    saveRooms(rooms);
    return room;
  },

  async getRoom(roomId: string): Promise<Room> {
    const rooms = getRooms();
    const room = rooms[roomId];
    if (!room) throw new Error('방을 찾을 수 없어요');
    return room;
  },

  async addMarker(roomId: string, req: MarkerRequest): Promise<Marker> {
    const rooms = getRooms();
    const room = rooms[roomId];
    if (!room) throw new Error('방을 찾을 수 없어요');

    const marker: Marker = {
      id: crypto.randomUUID(),
      nickname: req.nickname,
      lat: req.lat,
      lng: req.lng,
      address: req.address,
      createdAt: new Date().toISOString(),
    };
    room.markers.push(marker);
    saveRooms(rooms);
    return marker;
  },

  async deleteMarker(roomId: string, markerId: string): Promise<void> {
    const rooms = getRooms();
    const room = rooms[roomId];
    if (!room) throw new Error('방을 찾을 수 없어요');

    room.markers = room.markers.filter((m) => m.id !== markerId);
    saveRooms(rooms);
  },

  async getResult(roomId: string): Promise<RoomResult | null> {
    const room = await this.getRoom(roomId);
    if (room.markers.length < 2) return null;
    // 결과 계산은 Phase 4에서 구현 후 연결
    return null;
  },
};

export default api;
