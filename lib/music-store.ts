import { Mix } from "@/components/mini-apps/music-app";
import { create } from "zustand";

const initialState = {
  mixes: [] as Mix[],
  currentTrackIndex: null as number | null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  seekTime: null as number | null,
};

type MusicState = typeof initialState & {
  setMixes: (mixes: Mix[]) => void;
  setCurrentTrackIndex: (index: number) => void;
  goToNextTrack: (length: number) => void;
  goToPreviousTrack: (length: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  seekTo: (time: number) => void;
  clearSeek: () => void;
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
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
  seekTo: (time) => set({ seekTime: time, currentTime: time }),
  clearSeek: () => set({ seekTime: null }),
  reset: () => set(initialState),
}));
