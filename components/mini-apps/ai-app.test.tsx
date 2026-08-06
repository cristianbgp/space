import * as React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AIApp } from "@/components/mini-apps/ai-app";

beforeEach(() => {
  Object.defineProperty(Element.prototype, "scrollIntoView", {
    configurable: true,
    value: vi.fn(),
  });
});

afterEach(() => {
  Reflect.deleteProperty(Element.prototype, "scrollIntoView");
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("AIApp composer activity", () => {
  it("returns the composer to idle after generating a response", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);

    let resolveResponse!: (response: Response) => void;
    const responsePromise = new Promise<Response>((resolve) => {
      resolveResponse = resolve;
    });
    vi.stubGlobal("fetch", vi.fn(() => responsePromise));

    render(<AIApp />);

    const composer = screen.getByTestId("ai-composer");
    const messageInput = screen.getByRole("textbox", { name: "Message" });
    const sendButton = screen.getByRole("button", { name: "Send message" });

    expect(composer.getAttribute("data-state")).toBe("idle");
    expect(composer.parentElement?.classList.contains("w-full")).toBe(true);

    fireEvent.change(messageInput, { target: { value: "Hello" } });
    fireEvent.click(sendButton);

    expect(composer.getAttribute("data-state")).toBe("generating");
    expect(composer.getAttribute("data-beam-state")).toBe("active");
    expect(messageInput).toHaveProperty("disabled", true);
    expect(sendButton).toHaveProperty("disabled", true);
    expect(screen.getByRole("status").textContent).toBe("Thinking…");

    await act(async () => {
      vi.advanceTimersByTime(1_000);
      resolveResponse(
        new Response(JSON.stringify({ content: "Hello back" }), {
          headers: { "Content-Type": "application/json" },
          status: 200,
        })
      );
      await responsePromise;
    });

    expect(composer.getAttribute("data-state")).toBe("idle");
    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.getByText("Hello back")).toBeTruthy();
    expect(composer.getAttribute("data-beam-state")).toBe("active");

    act(() => vi.advanceTimersByTime(2_999));
    expect(composer.getAttribute("data-beam-state")).toBe("active");

    act(() => vi.advanceTimersByTime(1));
    expect(composer.getAttribute("data-beam-state")).toBe("idle");
  });

  it("clears the lingering Beam timer when unmounted", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);

    let resolveResponse!: (response: Response) => void;
    const responsePromise = new Promise<Response>((resolve) => {
      resolveResponse = resolve;
    });
    vi.stubGlobal("fetch", vi.fn(() => responsePromise));

    const { unmount } = render(<AIApp />);

    fireEvent.change(screen.getByRole("textbox", { name: "Message" }), {
      target: { value: "Hello" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));

    await act(async () => {
      vi.advanceTimersByTime(1_000);
      resolveResponse(
        new Response(JSON.stringify({ content: "Hello back" }), {
          headers: { "Content-Type": "application/json" },
          status: 200,
        }),
      );
      await responsePromise;
    });

    expect(vi.getTimerCount()).toBeGreaterThan(0);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
