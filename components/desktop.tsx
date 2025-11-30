"use client";

import { useState } from "react";
import { MenuBar } from "./menu-bar";
import { Dock } from "./dock";
import { WindowManager } from "./window-manager";
import type { Window } from "./window-manager";

export function Desktop() {
  const [windows, setWindows] = useState<Window[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);

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
      setActiveWindowId(remaining.length > 0 ? remaining[remaining.length - 1].id : null);
    }
  };

  const focusWindow = (id: string) => {
    setActiveWindowId(id);
    // Bring the focused window to the front
    setWindows(
      windows.map((w) => ({
        ...w,
        zIndex: w.id === id ? windows.length : w.zIndex,
      }))
    );
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background">
      {/* Desktop background */}
      <div className="absolute inset-0 bg-linear-to-br from-background via-background to-muted/20" />
      
      {/* Menu Bar */}
      <MenuBar />
      
      {/* Window Manager */}
      <WindowManager
        windows={windows}
        activeWindowId={activeWindowId}
        onClose={closeWindow}
        onFocus={focusWindow}
      />
      
      {/* Dock */}
      <Dock onOpenWindow={openWindow} />
    </div>
  );
}

