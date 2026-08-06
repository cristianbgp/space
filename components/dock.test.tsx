import * as React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Dock } from "@/components/dock";

vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: () => false,
}));

vi.mock("motion/react", () => ({
  motion: {
    div: React.forwardRef<
      HTMLDivElement,
      React.HTMLAttributes<HTMLDivElement> & Record<string, unknown>
    >(function MotionDiv(
      { animate, initial, transition, ...props },
      ref
    ) {
      void animate;
      void initial;
      void transition;
      return <div {...props} ref={ref} />;
    }),
  },
}));

describe("Dock", () => {
  it("exposes every app as a named button and opens the selected app", () => {
    const onOpenWindow = vi.fn();

    render(<Dock onOpenWindow={onOpenWindow} />);

    for (const name of ["Calculator", "Notes", "AI", "Music", "Settings"]) {
      expect(screen.getByRole("button", { name })).toBeTruthy();
    }

    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    expect(onOpenWindow).toHaveBeenCalledWith(
      expect.objectContaining({ id: "notes", title: "Notes" })
    );
  });
});
