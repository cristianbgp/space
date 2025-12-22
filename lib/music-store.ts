import { Mix } from "@/components/mini-apps/music-app";
import { create } from "zustand";

const initialState = {
  mixes: [] as Mix[],
  currentTrackIndex: null as number | null,
  isPlaying: false,
};

type MusicState = typeof initialState & {
  setMixes: (mixes: Mix[]) => void;
  setCurrentTrackIndex: (index: number) => void;
  goToNextTrack: (length: number) => void;
  goToPreviousTrack: (length: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  reset: () => void;
};

export const useMusicStore = create<MusicState>()((set) => ({
  ...initialState,
  setMixes: (mixes) => set({ mixes }),
  setCurrentTrackIndex: (index) => set({ currentTrackIndex: index }),
  goToNextTrack: (length) =>
    set((state) => ({
      currentTrackIndex: ((state.currentTrackIndex ?? 0) + 1) % length,
    })),
  goToPreviousTrack: (length) =>
    set((state) => ({
      currentTrackIndex: ((state.currentTrackIndex ?? 0) - 1 + length) % length,
    })),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  reset: () => set(initialState),
}));
