"use client";

import { useState, useRef, useEffect } from "react";
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
  onResize?: (id: string, width: number, height: number) => void;
}

export function WindowManager({
  windows,
  activeWindowId,
  onClose,
  onFocus,
  onResize,
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
            onResize={onResize}
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
  onResize?: (id: string, width: number, height: number) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

function WindowComponent({
  window,
  isActive,
  onClose,
  onFocus,
  onResize,
  containerRef,
}: WindowComponentProps) {
  const windowRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  const x = useMotionValue(window.x);
  const y = useMotionValue(window.y);
  const width = useMotionValue(window.width);
  const height = useMotionValue(window.height);
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartPos = useRef({ 
    pointerX: 0, 
    pointerY: 0, 
    windowX: 0,
    windowY: 0,
    width: 0, 
    height: 0, 
    direction: "" 
  });
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Only sync position from window props on initial mount
    if (!hasInitialized.current) {
      x.set(window.x);
      y.set(window.y);
      width.set(window.width);
      height.set(window.height);
      hasInitialized.current = true;
    }
    
    // After init, only sync width/height changes (not position)
    if (hasInitialized.current && (window.width !== width.get() || window.height !== height.get())) {
      width.set(window.width);
      height.set(window.height);
    }
  }, [window.x, window.y, window.width, window.height, x, y, width, height]);

  const handleResizeStart = (e: React.PointerEvent, direction: string) => {
    e.stopPropagation();
    setIsResizing(true);
    onFocus(window.id);
    resizeStartPos.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      windowX: x.get(),
      windowY: y.get(),
      width: width.get(),
      height: height.get(),
      direction,
    };
  };

  const handleResize = (e: PointerEvent) => {
    if (!isResizing || !containerRef.current) return;

    const { direction, windowX, windowY } = resizeStartPos.current;
    const deltaX = e.clientX - resizeStartPos.current.pointerX;
    const deltaY = e.clientY - resizeStartPos.current.pointerY;
    const containerRect = containerRef.current.getBoundingClientRect();
    const minWidth = 200;
    const minHeight = 150;

    let newWidth = resizeStartPos.current.width;
    let newHeight = resizeStartPos.current.height;
    let newX = windowX;
    let newY = windowY;

    if (direction.includes("e")) {
      newWidth = Math.max(minWidth, resizeStartPos.current.width + deltaX);
      const maxWidth = containerRect.width - windowX;
      newWidth = Math.min(newWidth, maxWidth);
    }
    if (direction.includes("w")) {
      const potentialWidth = Math.max(minWidth, resizeStartPos.current.width - deltaX);
      const maxWidth = windowX + resizeStartPos.current.width;
      newWidth = Math.min(potentialWidth, maxWidth);
      // Adjust X position based on width change
      newX = windowX + (resizeStartPos.current.width - newWidth);
      // Ensure we don't go past left edge
      if (newX < 0) {
        newX = 0;
        newWidth = windowX + resizeStartPos.current.width;
      }
    }
    if (direction.includes("s")) {
      newHeight = Math.max(minHeight, resizeStartPos.current.height + deltaY);
      const maxHeight = containerRect.height - windowY;
      newHeight = Math.min(newHeight, maxHeight);
    }
    if (direction.includes("n")) {
      const potentialHeight = Math.max(minHeight, resizeStartPos.current.height - deltaY);
      const maxHeight = windowY + resizeStartPos.current.height;
      newHeight = Math.min(potentialHeight, maxHeight);
      // Adjust Y position based on height change
      newY = windowY + (resizeStartPos.current.height - newHeight);
      // Ensure we don't go past top edge (account for menu bar at 28px)
      if (newY < 28) {
        newY = 28;
        newHeight = windowY + resizeStartPos.current.height - 28;
      }
    }

    width.set(newWidth);
    height.set(newHeight);
    x.set(newX);
    y.set(newY);
  };

  const handleResizeEnd = () => {
    if (isResizing && onResize) {
      onResize(window.id, width.get(), height.get());
    }
    setIsResizing(false);
  };

  useEffect(() => {
    if (isResizing) {
      const handlePointerMove = (e: PointerEvent) => {
        handleResize(e);
      };

      globalThis.addEventListener("pointermove", handlePointerMove);
      globalThis.addEventListener("pointerup", handleResizeEnd);

      return () => {
        globalThis.removeEventListener("pointermove", handlePointerMove);
        globalThis.removeEventListener("pointerup", handleResizeEnd);
      };
    }
  }, [isResizing, x, y, width, height]);

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
      dragListener={false}
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
        width,
        height,
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
          <span className="ml-2 text-xs select-none font-medium text-foreground">
            {window.title}
          </span>
        </div>
      </div>

      {/* Window Content */}
      <div className="h-[calc(100%-2rem)] overflow-auto rounded-b-lg bg-card">
        {window.content}
      </div>

      {/* Resize Handles */}
      {isActive && (
        <>
          {/* Corner handles */}
          <div
            data-resize="nw"
            className="absolute top-0 left-0 w-3 h-3 cursor-nwse-resize z-10"
            onPointerDown={(e) => handleResizeStart(e, "nw")}
          />
          <div
            data-resize="ne"
            className="absolute top-0 right-0 w-3 h-3 cursor-nesw-resize z-10"
            onPointerDown={(e) => handleResizeStart(e, "ne")}
          />
          <div
            data-resize="sw"
            className="absolute bottom-0 left-0 w-3 h-3 cursor-nesw-resize z-10"
            onPointerDown={(e) => handleResizeStart(e, "sw")}
          />
          <div
            data-resize="se"
            className="absolute bottom-0 right-0 w-3 h-3 cursor-nwse-resize z-10"
            onPointerDown={(e) => handleResizeStart(e, "se")}
          />
          {/* Edge handles */}
          <div
            data-resize="n"
            className="absolute top-0 left-3 right-3 h-1 cursor-ns-resize z-10"
            onPointerDown={(e) => handleResizeStart(e, "n")}
          />
          <div
            data-resize="s"
            className="absolute bottom-0 left-3 right-3 h-1 cursor-ns-resize z-10"
            onPointerDown={(e) => handleResizeStart(e, "s")}
          />
          <div
            data-resize="w"
            className="absolute left-0 top-3 bottom-3 w-1 cursor-ew-resize z-10"
            onPointerDown={(e) => handleResizeStart(e, "w")}
          />
          <div
            data-resize="e"
            className="absolute right-0 top-3 bottom-3 w-1 cursor-ew-resize z-10"
            onPointerDown={(e) => handleResizeStart(e, "e")}
          />
        </>
      )}
    </motion.div>
  );
}
