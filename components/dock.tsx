"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { useState, useRef, useCallback, Suspense } from "react";
import { Window } from "./window-manager";
import {
  Calculator,
  FileText,
  Settings,
  Music,
  SparklesIcon,
} from "lucide-react";
import { Calculator as CalculatorApp } from "./mini-apps/calculator";
import { NotesApp } from "./mini-apps/notes";
import { AIApp } from "./mini-apps/ai-app";
import { MusicApp } from "./mini-apps/music-app";
import { Skeleton } from "./ui/skeleton";
import { ErrorBoundary } from "./error-boundary";
interface DockItem {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  getWindow: () => Omit<Window, "id" | "zIndex">;
}

const dockItems: DockItem[] = [
  {
    id: "calculator",
    name: "Calculator",
    icon: Calculator,
    getWindow: () => ({
      title: "Calculator",
      content: <CalculatorApp />,
      width: 300,
      height: 400,
      x: 100,
      y: 100,
    }),
  },
  {
    id: "notes",
    name: "Notes",
    icon: FileText,
    getWindow: () => ({
      title: "Notes",
      content: <NotesApp />,
      width: 500,
      height: 400,
      x: 150,
      y: 150,
    }),
  },
  {
    id: "ai",
    name: "AI",
    icon: SparklesIcon,
    getWindow: () => ({
      title: "AI",
      content: <AIApp />,
      width: 700,
      height: 500,
      x: 300,
      y: 100,
    }),
  },
  {
    id: "music",
    name: "Music",
    icon: Music,
    getWindow: () => ({
      title: "Music",
      content: (
        <ErrorBoundary>
          <Suspense
            fallback={
              <div className="w-full h-full flex justify-center items-center">
                <Skeleton className="w-full h-full bg-neutral-200 rounded-none" />
              </div>
            }
          >
            <MusicApp />
          </Suspense>
        </ErrorBoundary>
      ),
      width: 500,
      height: 300,
      x: 250,
      y: 150,
    }),
  },
  {
    id: "settings",
    name: "Settings",
    icon: Settings,
    getWindow: () => ({
      title: "Settings",
      content: <div className="p-4">Settings app coming soon...</div>,
      width: 600,
      height: 500,
      x: 200,
      y: 100,
    }),
  },
];

interface DockProps {
  onOpenWindow: (window: Window) => void;
}

export function Dock({ onOpenWindow }: DockProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const getClosestIconIndex = useCallback((x: number, _y: number) => {
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
      className="dock-blur fixed bottom-4 left-1/2 z-40 -translate-x-1/2 transform"
    >
      <div
        ref={dockRef}
        className="flex items-end gap-5 rounded-2xl border border-(--dock-border) bg-(--dock) p-3 shadow-2xl"
        onMouseLeave={() => !isMobile && setHoveredIndex(null)}
        onTouchStart={(e) => {
          if (isMobile) {
            const touch = e.touches[0];
            const closestIndex = getClosestIconIndex(
              touch.clientX,
              touch.clientY
            );
            setHoveredIndex(closestIndex);
          }
        }}
        onTouchMove={(e) => {
          if (isMobile) {
            e.preventDefault();
            const touch = e.touches[0];
            const closestIndex = getClosestIconIndex(
              touch.clientX,
              touch.clientY
            );
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
          const Icon = item.icon;

          return (
            <motion.div
              key={item.id}
              className="relative flex flex-col items-center"
              onMouseEnter={() => !isMobile && setHoveredIndex(index)}
              onClick={() => handleClick(item)}
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
              <div
                className={cn(
                  "flex size-10 cursor-pointer items-center justify-center rounded-xl bg-neutral-200 text-foreground shadow-lg transition-shadow hover:bg-neutral-300"
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
