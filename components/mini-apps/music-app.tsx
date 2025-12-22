"use client";

import { useState, useEffect, useRef, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMusicStore } from "@/lib/music-store";

export interface Track {
  index: number;
  title: string;
  duration: string;
  timestamp: string;
}

export interface Mix {
  id: string;
  title: string;
  theme: string;
  description: string;
  release_date: string;
  duration: string;
  colors: string[];
  title_color: string;
  subtitle_color: string;
  youtube_url?: string;
  tracks: Track[];
  created_with: string;
  license: string;
  music_url?: string;
}

export function MusicApp() {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const mixes = useMusicStore((state) => state.mixes);
  const currentTrackIndex = useMusicStore((state) => state.currentTrackIndex);
  const isPlaying = useMusicStore((state) => state.isPlaying);
  const setCurrentTrackIndex = useMusicStore(
    (state) => state.setCurrentTrackIndex
  );
  const setIsPlaying = useMusicStore((state) => state.setIsPlaying);
  const goToNextTrack = useMusicStore((state) => state.goToNextTrack);
  const goToPreviousTrack = useMusicStore((state) => state.goToPreviousTrack);
  const currentTrack = mixes?.[currentTrackIndex ?? 0];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => handleNext();

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play();
    } else {
      audio.pause();
    }
  }, [isPlaying, currentTrackIndex]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    setCurrentTrackIndex(currentTrackIndex ?? 0);
  };

  const handleNext = () => {
    goToNextTrack(mixes?.length || 0);
  };

  const handlePrevious = () => {
    goToPreviousTrack(mixes?.length || 0);
  };

  const handleTrackSelect = (index: number) => {
    setCurrentTrackIndex(index);
    setIsPlaying(true);
  };

  const handleSeek = (e: ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const time = parseFloat(e.target.value);
    audio.currentTime = time;
    setCurrentTime(time);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (!currentTrack) return null;

  return (
    <div className="flex flex-col w-full h-full bg-linear-to-br from-neutral-200 to-neutral-100 text-black p-3 overflow-hidden">
      <audio ref={audioRef} src={currentTrack.music_url} />

      <div className="mb-2">
        <h1 className="text-lg font-bold select-none">numa</h1>
      </div>

      <div
        className="rounded-lg p-2 mb-2"
        style={{
          background: `linear-gradient(to bottom right, ${currentTrack.colors.join(
            ", "
          )})`,
        }}
      >
        <div
          className="text-[10px] uppercase tracking-wide opacity-70"
          style={{ color: currentTrack.title_color }}
        >
          Now Playing
        </div>
        <div
          className="text-sm font-semibold"
          style={{ color: currentTrack.title_color }}
        >
          {currentTrack.id}
        </div>
        <div
          className="text-xs opacity-80"
          style={{ color: currentTrack.title_color }}
        >
          {currentTrack.title}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <Button
          onClick={handlePrevious}
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-black hover:bg-black/10 cursor-pointer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="19 20 9 12 19 4 19 20" />
            <line x1="5" y1="19" x2="5" y2="5" />
          </svg>
        </Button>

        <Button
          onClick={handlePlayPause}
          size="icon"
          className="h-8 w-8 rounded-full cursor-pointer bg-black text-white hover:bg-neutral-800"
        >
          {isPlaying ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          )}
        </Button>

        <Button
          onClick={handleNext}
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-black cursor-pointer hover:bg-black/10"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="5 4 15 12 5 20 5 4" />
            <line x1="19" y1="5" x2="19" y2="19" />
          </svg>
        </Button>

        <div className="flex-1 flex items-center gap-2 ml-2">
          <span className="text-[10px] text-neutral-600 w-8">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="flex-1 h-1 bg-neutral-300 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-black"
          />
          <span className="text-[10px] text-neutral-600 w-8">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        <h2 className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wide mb-1">
          Playlist
        </h2>
        <div className="space-y-0.5">
          {mixes.map((mix, index) => (
            <button
              key={mix.id}
              onClick={() => handleTrackSelect(index)}
              className={cn(
                "w-full text-left px-2 py-1.5 rounded cursor-pointer transition-colors",
                currentTrackIndex === index
                  ? "bg-black/10 text-black"
                  : "hover:bg-black/5 text-neutral-700"
              )}
            >
              <div className="flex items-center gap-2">
                <div className="text-[10px] text-neutral-500 w-4">
                  {index === currentTrackIndex && isPlaying ? (
                    <span>▶</span>
                  ) : (
                    <span>{String(index + 1).padStart(2, "0")}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-xs truncate">{mix.id}</div>
                  <div className="text-[10px] text-neutral-600 truncate">
                    {mix.title}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
