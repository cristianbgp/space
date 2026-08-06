# AI Composer Border Beam Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a restrained monochrome Border Beam to the AI composer that communicates when an AI response is being generated.

**Architecture:** Keep generation state inside `AIApp` and pass `isLoading` directly to the third-party `BorderBeam` component. Turn the textarea and send button into one neutral composer surface, expose the application-owned state through `data-state`, and use a static live-region status as the non-visual loading signal.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Border Beam 1.3.0, Vitest, Testing Library

## Global Constraints

- Use `border-beam@1.3.0`, which supports React 18 and newer and has no runtime dependencies.
- Apply Beam only to the AI composer.
- Use `size="pulse-inner"`, `colorVariant="mono"`, `theme="light"`, `strength={0.45}`, and `duration={2.8}`.
- Set `active={isLoading}`; the effect must not remain active while idle, complete, or errored.
- Keep the composer's idle border neutral and its radius at 12px.
- Replace the bouncing-dot loader with one `Thinking…` live-region status.
- Keep AI API behavior, non-streaming responses, and conversation state unchanged.
- Do not add global state or a reusable Beam abstraction.

---

### Task 1: Install and Integrate the Stateful AI Composer Beam

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `components/mini-apps/ai-app.test.tsx`
- Modify: `components/mini-apps/ai-app.tsx`

**Interfaces:**
- Consumes: `BorderBeam` from `border-beam@1.3.0` and the existing `AIApp` request state
- Produces: a composer surface with `data-testid="ai-composer"`, `data-state="idle" | "generating"`, a textbox named `Message`, and a send button named `Send message`

- [ ] **Step 1: Install the package**

Run: `npm install border-beam@1.3.0`

Expected: `package.json` and `package-lock.json` add `border-beam` while retaining React 19.

- [ ] **Step 2: Write the failing request-state test**

Create `components/mini-apps/ai-app.test.tsx` with a controlled fetch response. The production regression it catches is a composer that fails to expose generation state or leaves its activity state enabled after the request resolves.

```tsx
import * as React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AIApp } from "@/components/mini-apps/ai-app";

afterEach(() => {
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
```

- [ ] **Step 3: Run the focused test and verify it fails**

Run: `npm run test -- components/mini-apps/ai-app.test.tsx`

Expected: FAIL because the composer has no `ai-composer` test id or application-owned activity state, and the controls lack accessible names.

- [ ] **Step 4: Integrate Border Beam into the composer**

Update `components/mini-apps/ai-app.tsx` to use the project import convention and package component.

```tsx
import * as React from "react";
import { BorderBeam } from "border-beam";
import { Send, Sparkles } from "lucide-react";
```

Replace the bouncing-dot loading block with:

```tsx
{isLoading ? (
  <div className="flex justify-start">
    <p
      aria-live="polite"
      className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground"
      role="status"
    >
      Thinking…
    </p>
  </div>
) : null}
```

Wrap the complete composer surface:

```tsx
<BorderBeam
  active={isLoading}
  colorVariant="mono"
  duration={2.8}
  size="pulse-inner"
  strength={0.45}
  theme="light"
>
  <div
    className="flex gap-2 rounded-xl border border-border bg-background p-2"
    data-state={isLoading ? "generating" : "idle"}
    data-testid="ai-composer"
  >
    <textarea
      aria-label="Message"
      autoComplete="off"
      className="min-h-10 flex-1 resize-none bg-transparent px-1 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-0 disabled:opacity-50"
    />
    <Button aria-label="Send message" className="min-h-10 self-end" size="icon">
      <Send aria-hidden="true" className="size-4" />
    </Button>
  </div>
</BorderBeam>
```

Retain the existing refs, values, change handlers, keyboard handler, disabled rules, and button click handler on the corresponding controls.

- [ ] **Step 5: Run the focused test and verify it passes**

Run: `npm run test -- components/mini-apps/ai-app.test.tsx`

Expected: 1 test passes.

- [ ] **Step 6: Run scoped checks**

Run: `npx tsc --noEmit`

Expected: exit 0.

Run: `npx eslint components/mini-apps/ai-app.tsx components/mini-apps/ai-app.test.tsx`

Expected: no errors or warnings.

- [ ] **Step 7: Commit the tested integration**

```bash
git add package.json package-lock.json components/mini-apps/ai-app.tsx components/mini-apps/ai-app.test.tsx
git commit -m "feat: add AI composer activity beam"
```

### Task 2: Verify the AI Composer in Context

**Files:**
- Modify only files from Task 1 if browser verification reveals a defect

**Interfaces:**
- Consumes: the stateful AI composer from Task 1
- Produces: a verified idle and generating treatment in desktop and mobile AI windows

- [ ] **Step 1: Start the local app**

Run: `npm run dev`

Expected: Next.js serves `http://localhost:3000`.

- [ ] **Step 2: Verify desktop idle state**

Open the AI mini-app at the default browser viewport. Verify the composer has one neutral border, the beam is visually inactive, the input and send button align inside one surface, and there is no horizontal overflow.

- [ ] **Step 3: Verify desktop generating state**

Send a short message. While the request is pending, verify the monochrome inner pulse is confined to the composer, `Thinking…` appears once, and no bouncing-dot loader remains. If the configured API responds too quickly or is unavailable, use the automated deferred-response test as the state proof and inspect the idle/error visual state in the browser.

- [ ] **Step 4: Verify mobile layout**

At 375x812, open the AI mini-app and verify the composer fits inside the safe-area-aware window, the send button remains reachable, and the beam does not clip the rounded surface.

- [ ] **Step 5: Run final verification**

Run: `npm run test && npx tsc --noEmit && npx eslint components/mini-apps/ai-app.tsx components/mini-apps/ai-app.test.tsx && git diff --check`

Expected: all tests, TypeScript, scoped lint, and whitespace checks pass.

Run: `npm run build`

Expected: the production build succeeds.

- [ ] **Step 6: Commit visual corrections if needed**

If browser verification required corrections, stage only the corrected Task 1 files and commit them:

```bash
git add components/mini-apps/ai-app.tsx components/mini-apps/ai-app.test.tsx
git commit -m "fix: refine AI composer beam"
```

- [ ] **Step 7: Push main**

Run: `git push origin main`

Expected: `origin/main` advances through the design, plan, implementation, and any visual-correction commits.
