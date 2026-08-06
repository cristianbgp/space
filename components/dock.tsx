"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import { AppIcon, type AppIconId } from "@/components/AppIcon";
import { motion } from "motion/react";
import { useState, useRef, useCallback } from "react";
import { Window } from "./window-manager";
import { Calculator as CalculatorApp } from "./mini-apps/calculator";
import { NotesApp } from "./mini-apps/notes";
import { AIApp } from "./mini-apps/ai-app";
import { MusicApp } from "./mini-apps/music-app";
import { ErrorBoundary } from "./error-boundary";
interface DockItem {
  id: AppIconId;
  name: string;
  getWindow: () => Omit<Window, "id" | "zIndex">;
}

// Helper to calculate responsive window dimensions
function getResponsiveWindow(
  preferredWidth: number,
  preferredHeight: number,
  preferredX: number,
  preferredY: number
) {
  const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1200;
  const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 800;
  
  // Available space (accounting for menu bar and dock)
  const availableWidth = viewportWidth - 20; // 10px margin on each side
  const availableHeight = viewportHeight - 130; // menu bar + dock + margins
  
  // Clamp width and height to fit viewport
  const width = Math.min(preferredWidth, availableWidth);
  const height = Math.min(preferredHeight, availableHeight);
  
  // Center the window if it would overflow, otherwise use preferred position
  const maxX = viewportWidth - width - 10;
  const maxY = viewportHeight - height - 110; // account for dock
  
  const x = Math.max(10, Math.min(preferredX, maxX));
  const y = Math.max(30, Math.min(preferredY, maxY)); // account for menu bar
  
  return { width, height, x, y };
}

const dockItems: DockItem[] = [
  {
    id: "calculator",
    name: "Calculator",
    getWindow: () => {
      const { width, height, x, y } = getResponsiveWindow(300, 400, 100, 100);
      return {
        title: "Calculator",
        content: <CalculatorApp />,
        width,
        height,
        x,
        y,
      };
    },
  },
  {
    id: "notes",
    name: "Notes",
    getWindow: () => {
      const { width, height, x, y } = getResponsiveWindow(500, 400, 150, 150);
      return {
        title: "Notes",
        content: <NotesApp />,
        width,
        height,
        x,
        y,
      };
    },
  },
  {
    id: "ai",
    name: "AI",
    getWindow: () => {
      const { width, height, x, y } = getResponsiveWindow(700, 500, 300, 100);
      return {
        title: "AI",
        content: <AIApp />,
        width,
        height,
        x,
        y,
      };
    },
  },
  {
    id: "music",
    name: "Music",
    getWindow: () => {
      const { width, height, x, y } = getResponsiveWindow(500, 300, 250, 150);
      return {
        title: "Music",
        content: (
          <ErrorBoundary>
            <MusicApp />
          </ErrorBoundary>
        ),
        width,
        height,
        x,
        y,
      };
    },
  },
  {
    id: "settings",
    name: "Settings",
    getWindow: () => {
      const { width, height, x, y } = getResponsiveWindow(600, 500, 200, 100);
      return {
        title: "Settings",
        content: <div className="p-4">Settings app coming soon...</div>,
        width,
        height,
        x,
        y,
      };
    },
  },
];

interface DockProps {
  onOpenWindow: (window: Window) => void;
}

export function Dock({ onOpenWindow }: DockProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const getClosestIconIndex = useCallback((x: number) => {
    if (!dockRef.current) return null;

    const dockRect = dockRef.current.getBoundingClientRect();
    const itemWidth = dockRect.width / dockItems.length;
    const relativeX = x - dockRect.left;

    if (relativeX < 0 || relativeX > dockRect.width) return null;

    return Math.floor(relativeX / itemWidth);
  }, []);

  const getScale = (index: number) => {
    if (hoveredIndex === null) return 1;

    const distance = Math.abs(index - hoveredIndex);

    if (distance === 0) return 1.55; // Active item - slightly larger
    if (distance === 1) return 1.3; // Adjacent items
    if (distance === 2) return 1.1; // Items 2 positions away
    if (distance === 3) return 1.0; // Items 3 positions away - subtle effect

    return 1; // Default size
  };

  const getTranslateY = (index: number) => {
    if (hoveredIndex === null) return 0;

    const distance = Math.abs(index - hoveredIndex);

    if (distance === 0) return -24; // Active item lifts up more
    if (distance === 1) return -12; // Adjacent items lift
    if (distance === 2) return -6; // Items 2 positions away lift a bit
    if (distance === 3) return -2; // Items 3 positions away lift slightly

    return 0; // Default position
  };

  const handleClick = (item: DockItem) => {
    onOpenWindow({
      ...item.getWindow(),
      id: item.id,
      zIndex: 0,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="dock-blur fixed bottom-2 md:bottom-4 left-1/2 z-40 -translate-x-1/2 transform"
    >
      <div
        ref={dockRef}
        className="flex items-end gap-3 md:gap-5 rounded-2xl border border-(--dock-border) bg-(--dock) p-2 md:p-3 shadow-2xl"
        onMouseLeave={() => !isMobile && setHoveredIndex(null)}
        onTouchStart={(e) => {
          if (isMobile) {
            const touch = e.touches[0];
            const closestIndex = getClosestIconIndex(touch.clientX);
            setHoveredIndex(closestIndex);
          }
        }}
        onTouchMove={(e) => {
          if (isMobile) {
            e.preventDefault();
            const touch = e.touches[0];
            const closestIndex = getClosestIconIndex(touch.clientX);
            setHoveredIndex(closestIndex);
          }
        }}
        onTouchEnd={() => {
          if (isMobile) {
            setHoveredIndex(null);
          }
        }}
      >
        {dockItems.map((item, index) => {
          return (
            <motion.div
              key={item.id}
              className="relative flex flex-col items-center"
              onMouseEnter={() => !isMobile && setHoveredIndex(index)}
              animate={{
                scale: getScale(index),
                y: getTranslateY(index),
              }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 25,
                mass: 0.8,
              }}
            >
              {/* Tooltip */}
              <motion.div
                className="absolute -top-7 rounded-md bg-foreground select-none px-2 py-1 text-[8px] text-background"
                initial={{ opacity: 0, y: 5 }}
                animate={{
                  opacity: hoveredIndex === index ? 1 : 0,
                  y: hoveredIndex === index ? 0 : 5,
                }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 30,
                  mass: 0.5,
                }}
              >
                {item.name}
              </motion.div>

              {/* Dock Icon */}
              <button
                type="button"
                aria-label={item.name}
                onClick={() => handleClick(item)}
                className="cursor-pointer rounded-[13px] outline-none transition-transform duration-150 active:scale-[0.94] focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-transparent md:rounded-[14px]"
              >
                <AppIcon app={item.id} />
              </button>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
