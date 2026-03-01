import type { Room, Marker, MarkerRequest, RoomResult, RoomType } from '@/types';

export interface ApiClient {
  createRoom(name: string, type: RoomType, dates?: string[], password?: string): Promise<Room>;
  getRoom(roomId: string): Promise<Room>;
  verifyRoomPassword(roomId: string, password: string): Promise<boolean>;
  verifyParticipant(roomId: string, nickname: string, password: string): Promise<Marker | null>;
  addMarker(roomId: string, req: MarkerRequest): Promise<Marker>;
  deleteMarker(roomId: string, markerId: string): Promise<void>;
  getResult(roomId: string): Promise<RoomResult | null>;
}
