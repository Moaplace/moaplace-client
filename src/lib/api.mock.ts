import type { Room, Marker, MarkerRequest, RoomResult, RoomType, PlaceResult, NearbyPlace, DirectionsResult, LatLng } from '@/types';
import type { ApiClient } from './api.interface';
import { haversine, centroid, solveTSP } from './geo';
import placesData from '@/mock/places.json';
import nearbyData from '@/mock/nearby.json';
import directionsData from '@/mock/directions.json';

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
  async createRoom(name: string, type: RoomType, dates?: string[], password?: string): Promise<Room> {
    const room: Room = {
      id: crypto.randomUUID(),
      name: name.trim() || '이름 없는 모임',
      type,
      markers: [],
      dates,
      password,
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

  async verifyRoomPassword(roomId: string, password: string): Promise<boolean> {
    const rooms = getRooms();
    const room = assertRoom(rooms[roomId]);
    if (!room.password) return true;
    return room.password === password;
  },

  async verifyParticipant(roomId: string, nickname: string, password: string): Promise<Marker | null> {
    const rooms = getRooms();
    const room = assertRoom(rooms[roomId]);
    const marker = room.markers.find((m) => m.nickname === nickname);
    if (!marker) return null;
    if (marker.password !== password) throw new Error('비밀번호가 틀려요');
    return marker;
  },

  async addMarker(roomId: string, req: MarkerRequest): Promise<Marker> {
    const marker: Marker = {
      id: crypto.randomUUID(),
      nickname: req.nickname,
      lat: req.lat,
      lng: req.lng,
      address: req.address,
      password: req.password,
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

    const center = centroid(room.markers);
    const route = solveTSP(room.markers);
    const distances = room.markers.map((m) => ({
      markerId: m.id,
      nickname: m.nickname,
      distance: haversine(m, center),
    }));

    return {
      centroid: { lat: center.lat, lng: center.lng },
      route,
      distances,
    };
  },

  async searchPlaces(query: string): Promise<PlaceResult[]> {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    return (placesData as PlaceResult[]).filter(
      (p) => p.name.toLowerCase().includes(q) || p.address.toLowerCase().includes(q),
    );
  },

  async getNearbyPlaces(_lat: number, _lng: number, type?: string): Promise<NearbyPlace[]> {
    const data = nearbyData as NearbyPlace[];
    if (!type || type === 'all') return data;
    return data.filter((p) => p.category === type);
  },

  async getDirections(_origin: LatLng, _destination: LatLng, _waypoints?: LatLng[]): Promise<DirectionsResult> {
    return directionsData as DirectionsResult;
  },

  async reverseGeocode(_lat: number, _lng: number): Promise<string> {
    return '서울특별시 중구 세종대로 110';
  },
};

export default mockApi;
