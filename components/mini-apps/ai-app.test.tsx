import * as React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
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
  vi.unstubAllGlobals();
});

describe("AIApp composer activity", () => {
  it("returns the composer to idle after generating a response", async () => {
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
    expect(messageInput).toHaveProperty("disabled", true);
    expect(sendButton).toHaveProperty("disabled", true);
    expect(screen.getByRole("status").textContent).toBe("Thinking…");

    await act(async () => {
      resolveResponse(
        new Response(JSON.stringify({ content: "Hello back" }), {
          headers: { "Content-Type": "application/json" },
          status: 200,
        })
      );
      await responsePromise;
    });

    await waitFor(() => {
      expect(composer.getAttribute("data-state")).toBe("idle");
    });
    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.getByText("Hello back")).toBeTruthy();
  });
});
