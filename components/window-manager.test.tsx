import * as React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { WindowManager, type Window } from "@/components/window-manager";

vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: () => true,
}));

vi.mock("motion/react", () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  motion: {
    div: React.forwardRef<
      HTMLDivElement,
      React.HTMLAttributes<HTMLDivElement> & Record<string, unknown>
    >(function MotionDiv(
      { animate, dragControls, exit, initial, transition, ...props },
      ref
    ) {
      void animate;
      void dragControls;
      void exit;
      void initial;
      void transition;
      return <div {...props} ref={ref} />;
    }),
  },
  useDragControls: () => ({ start: vi.fn() }),
  useMotionValue: (initialValue: number) => {
    let value = initialValue;
    return {
      get: () => value,
      set: (nextValue: number) => {
        value = nextValue;
      },
    };
  },
}));

const noteWindow: Window = {
  id: "notes",
  title: "Notes",
  content: <div>Note content</div>,
  width: 500,
  height: 400,
  x: 150,
  y: 100,
  zIndex: 1,
};

describe("WindowManager mobile sizing", () => {
  it("clears desktop dimensions when rendering the mobile window", () => {
    render(
      <WindowManager
        activeWindowId="notes"
        onClose={vi.fn()}
        onFocus={vi.fn()}
        windows={[noteWindow]}
      />
    );

    const windowElement = screen
      .getByText("Note content")
      .closest<HTMLDivElement>(".absolute.left-2");

    expect(windowElement?.style.width).toBe("auto");
    expect(windowElement?.style.height).toBe("auto");
  });
});
