import { create } from 'zustand';

type EntryStep = 'idle' | 'room_password' | 'participant' | 'done';

interface PendingLocation {
  x: number;
  y: number;
}

interface UIState {
  entryStep: EntryStep;
  isResultPanelExpanded: boolean;
  nickname: string;
  participantPassword: string;
  pendingLocation: PendingLocation | null;
  isLocationSheetOpen: boolean;

  setEntryStep: (step: EntryStep) => void;
  setNickname: (name: string) => void;
  setParticipantPassword: (pw: string) => void;
  resetEntry: () => void;
  toggleResultPanel: () => void;
  setPendingLocation: (loc: PendingLocation | null) => void;
  openLocationSheet: () => void;
  closeLocationSheet: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  entryStep: 'idle',
  isResultPanelExpanded: false,
  nickname: '',
  participantPassword: '',
  pendingLocation: null,
  isLocationSheetOpen: false,

  setEntryStep: (step) => set({ entryStep: step }),
  setNickname: (name) => set({ nickname: name }),
  setParticipantPassword: (pw) => set({ participantPassword: pw }),
  resetEntry: () => set({ entryStep: 'idle', nickname: '', participantPassword: '' }),
  toggleResultPanel: () =>
    set((s) => ({ isResultPanelExpanded: !s.isResultPanelExpanded })),
  setPendingLocation: (loc) => set({ pendingLocation: loc }),
  openLocationSheet: () => set({ isLocationSheetOpen: true }),
  closeLocationSheet: () => set({ isLocationSheetOpen: false, pendingLocation: null }),
}));
