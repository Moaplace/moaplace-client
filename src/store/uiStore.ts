import { create } from 'zustand';

import type { EntryStep } from '@/types';

interface PendingLocation {
  x: number;
  y: number;
}

interface UIState {
  entryStep: EntryStep;
  nickname: string;
  participantPassword: string;
  isCreator: boolean;
  pendingLocation: PendingLocation | null;
  isLocationSheetOpen: boolean;

  setEntryStep: (step: EntryStep) => void;
  setNickname: (name: string) => void;
  setParticipantPassword: (pw: string) => void;
  setIsCreator: (value: boolean) => void;
  resetEntryState: () => void;
  setPendingLocation: (loc: PendingLocation | null) => void;
  openLocationSheet: () => void;
  closeLocationSheet: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  entryStep: 'idle',
  nickname: '',
  participantPassword: '',
  isCreator: false,
  pendingLocation: null,
  isLocationSheetOpen: false,

  setEntryStep: (step) => set({ entryStep: step }),
  setNickname: (name) => set({ nickname: name }),
  setParticipantPassword: (pw) => set({ participantPassword: pw }),
  setIsCreator: (value) => set({ isCreator: value }),
  resetEntryState: () => set({
    entryStep: 'idle',
    nickname: '',
    participantPassword: '',
    isCreator: false,
  }),
  setPendingLocation: (loc) => set({ pendingLocation: loc }),
  openLocationSheet: () => set({ isLocationSheetOpen: true }),
  closeLocationSheet: () => set({ isLocationSheetOpen: false, pendingLocation: null }),
}));
