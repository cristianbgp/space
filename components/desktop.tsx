"use client";

import { useEffect, useState } from "react";

import { DesktopBackground } from "@/components/DesktopBackground";
import { Dock } from "@/components/dock";
import { MenuBar } from "@/components/menu-bar";
import type { Mix } from "@/components/mini-apps/music-app";
import { WindowManager, type Window } from "@/components/window-manager";
import { useMusicStore } from "@/lib/music-store";

export function Desktop({ mixes }: { mixes: Mix[] }) {
  const [windows, setWindows] = useState<Window[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const setMixes = useMusicStore((state) => state.setMixes);

  const openWindow = (window: Window) => {
    const windowId = window.id || `window-${Date.now()}`;

    // Check if this app is already open
    const existingWindow = windows.find((w) => w.id === windowId);

    if (existingWindow) {
      // If already open, just focus it
      focusWindow(windowId);
    } else {
      // If not open, add it to the windows array
      const newWindow = {
        ...window,
        id: windowId,
        zIndex: windows.length,
      };
      setWindows([...windows, newWindow]);
      setActiveWindowId(newWindow.id);
    }
  };

  const closeWindow = (id: string) => {
    const remaining = windows.filter((w) => w.id !== id);
    setWindows(remaining);
    if (activeWindowId === id) {
      setActiveWindowId(
        remaining.length > 0 ? remaining[remaining.length - 1].id : null
      );
    }
  };

  const focusWindow = (id: string) => {
    setActiveWindowId(id);
    // Bring the focused window to the front
    setWindows((currentWindows) => {
      const maxZIndex = Math.max(...currentWindows.map((w) => w.zIndex), 0);
      return currentWindows.map((w) => ({
        ...w,
        zIndex: w.id === id ? maxZIndex + 1 : w.zIndex,
      }));
    });
  };

  const resizeWindow = (id: string, width: number, height: number) => {
    setWindows((currentWindows) =>
      currentWindows.map((w) => (w.id === id ? { ...w, width, height } : w))
    );
  };

  useEffect(() => {
    if (mixes.length > 0) {
      setMixes(mixes);
    }
  }, [mixes]);

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-background">
      <DesktopBackground />

      {/* Menu Bar */}
      <MenuBar />

      {/* Window Manager */}
      <WindowManager
        windows={windows}
        activeWindowId={activeWindowId}
        onClose={closeWindow}
        onFocus={focusWindow}
        onResize={resizeWindow}
      />

      {/* Dock */}
      <Dock onOpenWindow={openWindow} />
    </div>
  );
}
