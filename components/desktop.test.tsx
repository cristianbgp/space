import * as React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Desktop } from "@/components/desktop";

vi.mock("@/components/menu-bar", () => ({ MenuBar: () => null }));
vi.mock("@/components/dock", () => ({ Dock: () => null }));
vi.mock("@/components/window-manager", () => ({
  WindowManager: () => null,
}));
vi.mock("@/lib/music-store", () => ({
  useMusicStore: (selector: (state: { setMixes: () => void }) => unknown) =>
    selector({ setMixes: vi.fn() }),
}));

describe("Desktop background", () => {
  it("moves the dot highlight to the pointer without rerendered dot elements", () => {
    render(<Desktop mixes={[]} />);

    const background = screen.getByTestId("desktop-background");
    fireEvent.pointerMove(background, { clientX: 120, clientY: 84 });

    expect(background.style.getPropertyValue("--pointer-x")).toBe("120px");
    expect(background.style.getPropertyValue("--pointer-y")).toBe("84px");
    expect(background.querySelectorAll("[data-dot]")).toHaveLength(0);
  });

  it("keeps the dot grid static for touch input", () => {
    render(<Desktop mixes={[]} />);

    const background = screen.getByTestId("desktop-background");
    fireEvent.pointerMove(background, {
      clientX: 120,
      clientY: 84,
      pointerType: "touch",
    });

    expect(background.style.getPropertyValue("--pointer-x")).toBe("");
    expect(background.style.getPropertyValue("--pointer-y")).toBe("");
  });
});
