import { create } from 'zustand';

export type CameraView = 'default' | 'top' | 'side' | 'front';

interface CameraState {
  currentView: CameraView;
  setView: (view: CameraView) => void;
}

export const useCameraStore = create<CameraState>((set) => ({
  currentView: 'side',
  setView: (view) => set({ currentView: view }),
}));
