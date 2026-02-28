import { create } from 'zustand';

interface UIState {
  isNicknameModalOpen: boolean;
  isResultPanelExpanded: boolean;
  nickname: string;

  openNicknameModal: () => void;
  closeNicknameModal: () => void;
  setNickname: (name: string) => void;
  toggleResultPanel: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isNicknameModalOpen: false,
  isResultPanelExpanded: false,
  nickname: '',

  openNicknameModal: () => set({ isNicknameModalOpen: true }),
  closeNicknameModal: () => set({ isNicknameModalOpen: false }),
  setNickname: (name) => set({ nickname: name }),
  toggleResultPanel: () =>
    set((s) => ({ isResultPanelExpanded: !s.isResultPanelExpanded })),
}));
