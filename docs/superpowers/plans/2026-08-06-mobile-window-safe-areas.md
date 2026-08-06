# Mobile Window Safe Areas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every mini-app a safe-area-aware, inset mobile window without changing desktop behavior.

**Architecture:** Define shared mobile shell geometry as CSS custom properties in the global stylesheet, then consume those properties in the desktop root, menu bar, dock, and mobile branch of `WindowManager`. Keep responsive behavior CSS-driven and retain `useIsMobile` only for choosing between the existing mobile and desktop window interaction models.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Motion, Vitest, Testing Library

## Global Constraints

- Preserve the existing monochrome palette and semantic color tokens.
- Mobile means viewports below 768px, matching `useIsMobile`.
- Use `100dvh`, never `h-screen`, for the desktop shell.
- Use `env(safe-area-inset-top, 0px)` and `env(safe-area-inset-bottom, 0px)` without JavaScript viewport measurement.
- Keep desktop window geometry, dragging, and resizing unchanged.
- Use 12px mobile side gutters and a 12px default vertical shell gap.
- Keep the title bar 40px tall and provide a minimum 32px close-button hit target.

---

### Task 1: Lock the Mobile Window Contract with Tests

**Files:**
- Modify: `components/window-manager.test.tsx`
- Test: `components/window-manager.test.tsx`

**Interfaces:**
- Consumes: `WindowManager(props: WindowManagerProps): React.ReactElement`
- Produces: regression expectations for mobile inset classes, safe-area style expressions, and the accessible close control

- [ ] **Step 1: Replace the legacy full-height assertion with failing inset-shell assertions**

Add expectations that the mobile window has `left: var(--mobile-shell-gutter)`, `right: var(--mobile-shell-gutter)`, a safe-area-aware top expression, a safe-area-aware bottom expression, and no explicit width or height. Assert that the close control is available with `getByRole("button", { name: "Close Notes" })`.

```tsx
const windowElement = screen.getByTestId("mobile-window-notes");

expect(windowElement.style.left).toBe("var(--mobile-shell-gutter)");
expect(windowElement.style.right).toBe("var(--mobile-shell-gutter)");
expect(windowElement.style.top).toContain("safe-area-inset-top");
expect(windowElement.style.bottom).toContain("safe-area-inset-bottom");
expect(windowElement.style.width).toBe("");
expect(windowElement.style.height).toBe("");
expect(screen.getByRole("button", { name: "Close Notes" })).toBeTruthy();
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npm run test -- components/window-manager.test.tsx`

Expected: FAIL because the mobile window has no test id, still uses hardcoded offsets, and the close button has no accessible name.

- [ ] **Step 3: Commit the red test with the implementation in Task 2**

Do not commit a knowingly failing branch. Continue directly to Task 2.

### Task 2: Implement Shared Safe-Area Geometry

**Files:**
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`
- Modify: `components/desktop.tsx`
- Modify: `components/menu-bar.tsx`
- Modify: `components/dock.tsx`
- Modify: `components/window-manager.tsx`
- Test: `components/window-manager.test.tsx`

**Interfaces:**
- Consumes: CSS environment variables `safe-area-inset-top` and `safe-area-inset-bottom`
- Produces: `--mobile-shell-gutter`, `--mobile-menu-height`, `--mobile-dock-height`, and `--mobile-shell-gap` CSS properties used by shared shell components

- [ ] **Step 1: Add mobile shell tokens and stable viewport behavior**

Add the four mobile shell properties to `:root`, set `html` and `body` to full stable height, and add an orientation media query that changes `--mobile-shell-gap` to `0.5rem` for short landscape mobile viewports.

```css
:root {
  --mobile-shell-gutter: 0.75rem;
  --mobile-menu-height: 1.75rem;
  --mobile-dock-height: 4rem;
  --mobile-shell-gap: 0.75rem;
}

@media (max-width: 767px) and (orientation: landscape) {
  :root {
    --mobile-shell-gap: 0.5rem;
  }
}
```

- [ ] **Step 2: Enable safe-area variables in the Next.js viewport**

Export a typed viewport object from `app/layout.tsx`.

```tsx
import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  themeColor: "#f7f7f7",
  viewportFit: "cover",
};
```

- [ ] **Step 3: Replace the unstable desktop viewport height**

Change the desktop root from `h-screen w-screen` to `h-[100dvh] w-full` and keep `overflow-hidden`.

```tsx
<div className="relative h-[100dvh] w-full overflow-hidden bg-background">
```

- [ ] **Step 4: Make the menu bar safe-area aware**

Keep the desktop classes intact. On mobile, compute the bar height and top padding from the safe area.

```tsx
className="menu-bar-blur fixed inset-x-0 top-0 z-50 flex h-[calc(var(--mobile-menu-height)+env(safe-area-inset-top,0px))] items-end justify-between border-b border-(--menu-bar-border) bg-(--menu-bar) px-4 pb-1 text-xs md:h-7 md:items-center md:pb-0"
```

- [ ] **Step 5: Make the dock safe-area aware**

Replace the fixed mobile bottom utility with an arbitrary value derived from the bottom safe area while retaining the desktop offset.

```tsx
className="dock-blur fixed bottom-[calc(env(safe-area-inset-bottom,0px)+0.5rem)] left-1/2 z-40 -translate-x-1/2 transform md:bottom-4"
```

- [ ] **Step 6: Inset the shared mobile window**

Add `data-testid={`mobile-window-${window.id}`}` and replace hardcoded offsets with shared CSS expressions.

```tsx
style={{
  left: "var(--mobile-shell-gutter)",
  right: "var(--mobile-shell-gutter)",
  top: "calc(env(safe-area-inset-top, 0px) + var(--mobile-menu-height) + var(--mobile-shell-gap))",
  bottom: "calc(env(safe-area-inset-bottom, 0px) + var(--mobile-dock-height) + var(--mobile-shell-gap))",
  zIndex: window.zIndex,
}}
```

Use `rounded-xl`, remove explicit `width` and `height`, add `min-h-0 overflow-hidden`, and keep the content as a `min-h-0` scroll container.

- [ ] **Step 7: Improve the close control without changing the visual language**

Give the mobile close button `aria-label={`Close ${window.title}`}`, a 32px outer hit target, a visible focus ring, and an inner neutral circular mark. Keep the title text truncated with `min-w-0` on its container.

- [ ] **Step 8: Run the focused test and verify it passes**

Run: `npm run test -- components/window-manager.test.tsx`

Expected: PASS.

- [ ] **Step 9: Run scoped static checks**

Run: `npx tsc --noEmit`

Expected: exit 0.

Run: `npx eslint app/layout.tsx app/globals.css components/desktop.tsx components/menu-bar.tsx components/dock.tsx components/window-manager.tsx components/window-manager.test.tsx`

Expected: no new errors in modified files. Existing unrelated warnings or errors must be reported separately.

- [ ] **Step 10: Commit the shared mobile shell**

```bash
git add app/globals.css app/layout.tsx components/desktop.tsx components/menu-bar.tsx components/dock.tsx components/window-manager.tsx components/window-manager.test.tsx
git commit -m "fix: inset mobile app windows"
```

### Task 3: Verify Responsive Browser Behavior

**Files:**
- Modify only if visual verification exposes a defect in files from Task 2

**Interfaces:**
- Consumes: the safe-area-aware shared shell from Task 2
- Produces: verified portrait and landscape mobile behavior with no app-specific regressions

- [ ] **Step 1: Start the local application**

Run: `npm run dev`

Expected: Next.js serves the app at `http://localhost:3000`.

- [ ] **Step 2: Verify portrait mobile layout**

At 375x812, open Tasks and verify visible desktop background around the window, clear separation from the menu bar and dock, a usable title bar, internal content scrolling, and no horizontal overflow.

- [ ] **Step 3: Verify landscape mobile layout**

At 812x375, open Tasks and Notes and verify the reduced vertical gap preserves content height, both windows remain inset, and the dock does not overlap window content.

- [ ] **Step 4: Verify a narrow mobile layout**

At 320x568, open Calculator and verify the window, title bar, content, and dock fit without horizontal overflow.

- [ ] **Step 5: Run final verification**

Run: `npm run test && npx tsc --noEmit && git diff --check && npm run build`

Expected: tests, TypeScript, whitespace check, and production build pass. Run scoped ESLint for every modified TypeScript file and report any pre-existing full-project lint debt separately.

- [ ] **Step 6: Commit visual corrections if needed**

```bash
git add app components
git commit -m "fix: refine mobile safe-area spacing"
```

- [ ] **Step 7: Push main**

Run: `git push origin main`

Expected: `origin/main` advances to the final verified commit.
