# AI Composer Beam Visibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the monochrome AI composer Beam clearly visible for at least four seconds without delaying responses or keeping controls disabled.

**Architecture:** Keep request state and decorative Beam state separate inside `AIApp`. Start the Beam with each submission, record its start time, and deactivate it only after both the request and four-second minimum have finished; a ref-owned timeout handles the remaining delay and is cleared for resubmission and unmount.

**Tech Stack:** React 19, TypeScript, `border-beam` 1.3.0, Vitest 4, Testing Library, Tailwind CSS 4, Bun

## Global Constraints

- Keep `pulse-inner`, `colorVariant="mono"`, and `theme="light"`.
- Set Beam `strength={1}`, `brightness={0.72}`, and `duration={3.4}`.
- Keep the Beam active for at least `4_000` milliseconds from submission.
- Never delay the AI response or keep controls disabled solely for the Beam.
- Keep timing state local to `AIApp`; do not introduce global state, a shared hook, or an API change.
- Clear pending Beam timeouts before a new submission and when the component unmounts.
- Preserve reduced-motion behavior supplied by `border-beam`.

---

### Task 1: Independent minimum-duration Beam state

**Files:**
- Modify: `components/mini-apps/ai-app.test.tsx`
- Modify: `components/mini-apps/ai-app.tsx`

**Interfaces:**
- Consumes: existing `AIApp()` component and `/api/chat` response shape `{ content: string }`
- Produces: composer attribute `data-beam-state: "active" | "idle"` for application-owned state inspection

- [ ] **Step 1: Write the failing fast-response timing test**

Use fake timers and a controlled response. Assert that the request state returns to idle and the assistant response appears immediately, while `data-beam-state` remains `active` until exactly four seconds from submission:

```tsx
vi.useFakeTimers();
vi.setSystemTime(0);

render(<AIApp />);
const composer = screen.getByTestId("ai-composer");

fireEvent.change(screen.getByRole("textbox", { name: "Message" }), {
  target: { value: "Hello" },
});
fireEvent.click(screen.getByRole("button", { name: "Send message" }));

expect(composer.getAttribute("data-beam-state")).toBe("active");

await act(async () => {
  vi.advanceTimersByTime(1_000);
  resolveResponse(new Response(JSON.stringify({ content: "Hello back" }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  }));
  await responsePromise;
});

expect(composer.getAttribute("data-state")).toBe("idle");
expect(screen.getByText("Hello back")).toBeTruthy();
expect(composer.getAttribute("data-beam-state")).toBe("active");

act(() => vi.advanceTimersByTime(2_999));
expect(composer.getAttribute("data-beam-state")).toBe("active");

act(() => vi.advanceTimersByTime(1));
expect(composer.getAttribute("data-beam-state")).toBe("idle");
```

Restore real timers in `afterEach` with `vi.useRealTimers()`.

- [ ] **Step 2: Run the focused test and verify the expected failure**

Run: `bun run test -- components/mini-apps/ai-app.test.tsx`

Expected: FAIL because the composer does not yet expose `data-beam-state` and Beam activation is still tied directly to `isLoading`.

- [ ] **Step 3: Implement independent Beam timing**

In `components/mini-apps/ai-app.tsx`, add:

```tsx
const BEAM_MIN_DURATION_MS = 4_000;

const [isBeamActive, setIsBeamActive] = React.useState(false);
const beamStartedAtRef = React.useRef(0);
const beamTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
```

Add helpers that clear the saved timeout and deactivate after the remaining minimum duration:

```tsx
const clearBeamTimeout = React.useCallback(() => {
  if (beamTimeoutRef.current !== null) {
    clearTimeout(beamTimeoutRef.current);
    beamTimeoutRef.current = null;
  }
}, []);

const finishBeam = React.useCallback(() => {
  const elapsed = Date.now() - beamStartedAtRef.current;
  const remaining = Math.max(BEAM_MIN_DURATION_MS - elapsed, 0);

  clearBeamTimeout();
  if (remaining === 0) {
    setIsBeamActive(false);
    return;
  }

  beamTimeoutRef.current = setTimeout(() => {
    beamTimeoutRef.current = null;
    setIsBeamActive(false);
  }, remaining);
}, [clearBeamTimeout]);
```

Add unmount cleanup:

```tsx
React.useEffect(() => clearBeamTimeout, [clearBeamTimeout]);
```

At request start, clear a previous timer, record `Date.now()`, and activate the Beam. In `finally`, call `finishBeam()` separately from `setIsLoading(false)`.

Update the component props and inspectable state:

```tsx
<BorderBeam
  active={isBeamActive}
  brightness={0.72}
  className="w-full"
  colorVariant="mono"
  duration={3.4}
  size="pulse-inner"
  strength={1}
  theme="light"
>
  <div
    data-beam-state={isBeamActive ? "active" : "idle"}
    data-state={isLoading ? "generating" : "idle"}
    data-testid="ai-composer"
  >
```

- [ ] **Step 4: Run the focused test and verify it passes**

Run: `bun run test -- components/mini-apps/ai-app.test.tsx`

Expected: PASS with the response visible at one second, request state idle, Beam active through 3,999 milliseconds, and Beam idle at 4,000 milliseconds.

- [ ] **Step 5: Add and verify timeout cleanup coverage**

Add a test that resolves a fast request, confirms `vi.getTimerCount()` is greater than zero while the Beam lingers, unmounts `AIApp`, and then confirms `vi.getTimerCount()` is zero. Run the focused test again and expect both tests to pass.

- [ ] **Step 6: Run static checks**

Run:

```bash
bunx tsc --noEmit
bunx eslint components/mini-apps/ai-app.tsx components/mini-apps/ai-app.test.tsx vitest.setup.ts
git diff --check
```

Expected: all commands exit successfully.

- [ ] **Step 7: Commit the behavior**

```bash
git add components/mini-apps/ai-app.tsx components/mini-apps/ai-app.test.tsx
git commit -m "feat: strengthen AI composer beam"
```

---

### Task 2: Responsive visual and release verification

**Files:**
- Verify: `components/mini-apps/ai-app.tsx`
- Verify: `components/mini-apps/ai-app.test.tsx`

**Interfaces:**
- Consumes: the `AIApp` Beam behavior from Task 1
- Produces: a verified `main` commit ready to push

- [ ] **Step 1: Verify the effect in the browser**

Run `bun run dev`, open the AI mini-app, submit a message, and verify:

- Desktop: the monochrome inner pulse is clearly visible around the composer.
- Fast response: the response appears and controls re-enable while the pulse continues.
- Mobile at 375x812: the pulse remains clipped to the composer, with no horizontal overflow.
- Browser console: no errors or warnings from the Beam timing behavior.

- [ ] **Step 2: Run the complete verification gate**

Run:

```bash
bun run test
bunx tsc --noEmit
bunx eslint components/mini-apps/ai-app.tsx components/mini-apps/ai-app.test.tsx vitest.setup.ts
git diff --check
test ! -e package-lock.json
bun run build
```

Expected: all tests pass, TypeScript and scoped lint pass, no npm lockfile exists, and the Next.js production build succeeds.

- [ ] **Step 3: Push the approved main branch**

Confirm `git status --short --branch` is clean and only expected commits are ahead, then run:

```bash
git push origin main
```

Expected: `origin/main` advances to the implementation commit and the local branch is synchronized.
