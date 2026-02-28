import { create } from 'zustand';
import type { Room, RoomResult, MarkerRequest } from '@/types';
import api from '@/lib/api';

interface RoomState {
  room: Room | null;
  result: RoomResult | null;
  isLoading: boolean;
  error: string | null;

  createRoom: (name: string) => Promise<Room>;
  fetchRoom: (id: string) => Promise<void>;
  addMarker: (req: MarkerRequest) => Promise<void>;
  deleteMarker: (markerId: string) => Promise<void>;
  clearRoom: () => void;
}

export const useRoomStore = create<RoomState>((set, get) => ({
  room: null,
  result: null,
  isLoading: false,
  error: null,

  createRoom: async (name) => {
    set({ isLoading: true, error: null });
    try {
      const room = await api.createRoom(name);
      set({ room, isLoading: false });
      return room;
    } catch (e) {
      const msg = e instanceof Error ? e.message : '방 생성에 실패했어요';
      set({ error: msg, isLoading: false });
      throw e;
    }
  },

  fetchRoom: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const room = await api.getRoom(id);
      const result = await api.getResult(id);
      set({ room, result, isLoading: false });
    } catch (e) {
      const msg = e instanceof Error ? e.message : '방 정보를 불러올 수 없어요';
      set({ error: msg, isLoading: false });
    }
  },

  addMarker: async (req) => {
    const { room } = get();
    if (!room) return;
    try {
      await api.addMarker(room.id, req);
      await get().fetchRoom(room.id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '위치 등록에 실패했어요';
      set({ error: msg });
    }
  },

  deleteMarker: async (markerId) => {
    const { room } = get();
    if (!room) return;
    try {
      await api.deleteMarker(room.id, markerId);
      await get().fetchRoom(room.id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '마커 삭제에 실패했어요';
      set({ error: msg });
    }
  },

  clearRoom: () => set({ room: null, result: null, error: null }),
}));
