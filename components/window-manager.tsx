"use client";

import { useState, useRef, useEffect } from "react";
import { X, Minus, Square } from "lucide-react";
import {
  motion,
  AnimatePresence,
  useDragControls,
  useMotionValue,
} from "motion/react";
import { cn } from "@/lib/utils";

export interface Window {
  id: string;
  title: string;
  content: React.ReactNode;
  width: number;
  height: number;
  x: number;
  y: number;
  zIndex: number;
}

interface WindowManagerProps {
  windows: Window[];
  activeWindowId: string | null;
  onClose: (id: string) => void;
  onFocus: (id: string) => void;
}

export function WindowManager({
  windows,
  activeWindowId,
  onClose,
  onFocus,
}: WindowManagerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0"
      style={{ paddingTop: "28px", paddingBottom: "100px" }}
    >
      <AnimatePresence>
        {windows.map((window) => (
          <WindowComponent
            key={window.id}
            window={window}
            isActive={activeWindowId === window.id}
            onClose={onClose}
            onFocus={onFocus}
            containerRef={containerRef}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface WindowComponentProps {
  window: Window;
  isActive: boolean;
  onClose: (id: string) => void;
  onFocus: (id: string) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

function WindowComponent({
  window,
  isActive,
  onClose,
  onFocus,
  containerRef,
}: WindowComponentProps) {
  const [position, setPosition] = useState({ x: window.x, y: window.y });
  const windowRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  const x = useMotionValue(window.x);
  const y = useMotionValue(window.y);

  useEffect(() => {
    // Sync position with window prop if it changes externally
    setPosition({ x: window.x, y: window.y });
    x.set(window.x);
    y.set(window.y);
  }, [window.x, window.y, x, y]);

  console.log({ x: x.get(), y: y.get() });

  return (
    <motion.div
      ref={windowRef}
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{
        opacity: isActive ? 1 : 0.9,
        scale: 1,
      }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        opacity: { duration: 0.2 },
      }}
      drag
      dragControls={dragControls}
      dragMomentum={false}
      dragElastic={0}
      dragConstraints={containerRef}
      onDragStart={() => {
        onFocus(window.id);
      }}
      className={cn(
        "absolute rounded-lg border border-(--window-border) bg-card shadow-2xl",
        isActive ? "ring-1 ring-foreground/20" : ""
      )}
      style={{
        x,
        y,
        width: `${window.width}px`,
        height: `${window.height}px`,
        zIndex: window.zIndex,
        boxShadow: isActive
          ? "0 20px 25px -5px var(--window-shadow), 0 10px 10px -5px var(--window-shadow)"
          : "0 10px 15px -3px var(--window-shadow), 0 4px 6px -2px var(--window-shadow)",
      }}
      onClick={() => onFocus(window.id)}
    >
      {/* Title Bar */}
      <div
        className="flex h-8 items-center justify-between rounded-t-lg border-b border-border bg-muted/30 px-3 cursor-move"
        onPointerDown={(e) => {
          dragControls.start(e);
        }}
      >
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <button
              className="h-3 w-3 rounded-full bg-red-500/80 hover:bg-red-500"
              onClick={(e) => {
                e.stopPropagation();
                onClose(window.id);
              }}
            />
            <button className="h-3 w-3 rounded-full bg-yellow-500/80 hover:bg-yellow-500" />
            <button className="h-3 w-3 rounded-full bg-green-500/80 hover:bg-green-500" />
          </div>
          <span className="ml-2 text-xs font-medium text-foreground">
            {window.title}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            className="rounded p-1 hover:bg-foreground/10"
            onClick={(e) => {
              e.stopPropagation();
              // Minimize functionality can be added here
            }}
          >
            <Minus className="h-3.5 w-3.5 text-foreground/70" />
          </button>
          <button
            className="rounded p-1 hover:bg-foreground/10"
            onClick={(e) => {
              e.stopPropagation();
              // Maximize functionality can be added here
            }}
          >
            <Square className="h-3.5 w-3.5 text-foreground/70" />
          </button>
          <button
            className="rounded p-1 hover:bg-foreground/10"
            onClick={(e) => {
              e.stopPropagation();
              onClose(window.id);
            }}
          >
            <X className="h-3.5 w-3.5 text-foreground/70" />
          </button>
        </div>
      </div>

      {/* Window Content */}
      <div className="h-[calc(100%-2rem)] overflow-auto rounded-b-lg bg-card">
        {window.content}
      </div>
    </motion.div>
  );
}
