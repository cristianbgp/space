"use client";

import * as React from "react";

export function DesktopBackground() {
  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch") return;

    event.currentTarget.style.setProperty(
      "--pointer-x",
      `${event.clientX}px`,
    );
    event.currentTarget.style.setProperty(
      "--pointer-y",
      `${event.clientY}px`,
    );
  };

  return (
    <div
      aria-hidden="true"
      className="desktop-dot-grid absolute inset-0"
      data-testid="desktop-background"
      onPointerMove={handlePointerMove}
    />
  );
}
