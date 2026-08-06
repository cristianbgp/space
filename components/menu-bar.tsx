"use client";

import { motion } from "motion/react";
import { useEffect, useState, useRef } from "react";
import { DateTime } from "luxon";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { MusicIcon, PauseIcon, PlayIcon } from "lucide-react";
import { useMusicStore } from "@/lib/music-store";

function AudioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const mixes = useMusicStore((state) => state.mixes);
  const currentTrackIndex = useMusicStore((state) => state.currentTrackIndex);
  const isPlaying = useMusicStore((state) => state.isPlaying);
  const seekTime = useMusicStore((state) => state.seekTime);
  const setCurrentTime = useMusicStore((state) => state.setCurrentTime);
  const setDuration = useMusicStore((state) => state.setDuration);
  const clearSeek = useMusicStore((state) => state.clearSeek);
  const goToNextTrack = useMusicStore((state) => state.goToNextTrack);

  const currentTrack =
    currentTrackIndex !== null ? mixes?.[currentTrackIndex] : null;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const handleEnded = () => goToNextTrack(mixes?.length || 0);

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleDurationChange);
    audio.addEventListener("durationchange", handleDurationChange);
    audio.addEventListener("ended", handleEnded);

    // Check if duration is already available (for cached audio)
    if (audio.duration && !isNaN(audio.duration)) {
      setDuration(audio.duration);
    }

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleDurationChange);
      audio.removeEventListener("durationchange", handleDurationChange);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [setCurrentTime, setDuration, goToNextTrack, mixes?.length, currentTrackIndex]);

  useEffect(() => {
    // Reset time when track changes
    setCurrentTime(0);
    setDuration(0);
  }, [currentTrackIndex, setCurrentTime, setDuration]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play();
    } else {
      audio.pause();
    }
  }, [isPlaying, currentTrackIndex]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || seekTime === null) return;

    audio.currentTime = seekTime;
    clearSeek();
  }, [seekTime, clearSeek]);

  if (!currentTrack?.music_url) return null;

  return <audio ref={audioRef} src={currentTrack.music_url} />;
}

function MiniMusicPlayer() {
  const mixes = useMusicStore((state) => state.mixes);
  const isPlaying = useMusicStore((state) => state.isPlaying);
  const setIsPlaying = useMusicStore((state) => state.setIsPlaying);
  const currentTrackIndex = useMusicStore((state) => state.currentTrackIndex);
  const goToNextTrack = useMusicStore((state) => state.goToNextTrack);
  const goToPreviousTrack = useMusicStore((state) => state.goToPreviousTrack);
  const currentTrack =
    currentTrackIndex !== null ? mixes?.[currentTrackIndex] : null;

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  if(!currentTrack) {
    return null;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1 hover:text-foreground transition-colors">
          {isPlaying ? (
            <PauseIcon className="size-4 fill-muted-foreground text-muted-foreground" />
          ) : (
            <PlayIcon className="size-4 fill-muted-foreground text-muted-foreground" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        {currentTrack ? (
          <div className="space-y-3">
            {/* Current Track Display */}
            <div
              className="rounded-lg p-3"
              style={{
                background: `linear-gradient(to bottom right, ${currentTrack.colors.join(
                  ", "
                )})`,
              }}
            >
              <div
                className="text-[10px] uppercase tracking-wide opacity-70 mb-1"
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

            {/* Controls */}
            <div className="flex items-center justify-center gap-3">
              <Button
                onClick={() => goToPreviousTrack(mixes?.length || 0)}
                variant="ghost"
                size="icon"
                className="h-8 w-8"
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
                className="h-10 w-10 rounded-full"
              >
                {isPlaying ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <rect x="6" y="4" width="4" height="16" />
                    <rect x="14" y="4" width="4" height="16" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                )}
              </Button>

              <Button
                onClick={() => goToNextTrack(mixes?.length || 0)}
                variant="ghost"
                size="icon"
                className="h-8 w-8"
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
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-sm text-muted-foreground">
            <MusicIcon className="size-8 mx-auto mb-2 opacity-50" />
            <p>No track playing</p>
            <p className="text-xs mt-1">Open Music app to start</p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export function MenuBar() {
  const [currentTime, setCurrentTime] = useState(
    DateTime.now().toLocaleString(DateTime.TIME_SIMPLE)
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(DateTime.now().toLocaleString(DateTime.TIME_SIMPLE));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <AudioPlayer />
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="menu-bar-blur fixed inset-x-0 top-0 z-50 flex h-[calc(var(--mobile-menu-height)+env(safe-area-inset-top,0px))] items-end justify-between border-b border-(--menu-bar-border) bg-(--menu-bar) px-4 pb-1 text-xs md:h-7 md:items-center md:pb-0"
      >
        <div className="flex items-center gap-4">
          <span className="font-semibold text-foreground font-mono">
            .space
          </span>
        </div>
        <div className="flex items-center gap-4 text-muted-foreground">
          <MiniMusicPlayer />
          <div className="flex gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-foreground/20" />
            <div className="h-1.5 w-1.5 rounded-full bg-foreground/20" />
            <div className="h-1.5 w-1.5 rounded-full bg-foreground/20" />
          </div>
          <motion.span
            key={currentTime}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2 }}
            className="font-medium"
          >
            {currentTime}
          </motion.span>
        </div>
      </motion.div>
    </>
  );
}
