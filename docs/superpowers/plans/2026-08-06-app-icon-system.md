# App Icon System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace generic dock glyph containers with a cohesive five-app icon family and accessible launch buttons.

**Architecture:** A dedicated `AppIcon` component maps stable app identifiers to direct Lucide imports and app-specific material treatments. `Dock` retains window configuration and animation, but renders each launcher as a labeled button containing `AppIcon`.

**Tech Stack:** Next.js 16, React 19, strict TypeScript, Tailwind CSS 4, Motion, Lucide, Vitest, Testing Library.

## Global Constraints

- Preserve the existing monochrome desktop, translucent dock, and spring magnification behavior.
- Use one rounded-square geometry and one icon stroke system across all five apps.
- Use direct Lucide component imports from the project's existing dependency; add no package and draw no SVG path manually.
- Keep every icon treatment inside the neutral grayscale palette and use smoked graphite, pearl, mirrored chrome, charcoal satin, and aluminum treatments.
- Do not use chromatic Tailwind utilities in app icon surfaces, highlights, glyphs, borders, or shadows.
- Render launchers as semantic buttons with accessible names, visible focus, and pressed feedback.
- Keep the five-item dock usable at the existing mobile breakpoint.

---

### Task 1: Protect the Dock Launcher Contract

**Files:**
- Create: `components/dock.test.tsx`

**Interfaces:**
- Consumes: `Dock({ onOpenWindow })`.
- Produces: regression coverage for named launch buttons and Notes activation.

- [ ] **Step 1: Write the failing interaction test**

Render `Dock` with Motion and the mobile hook isolated. Assert that Calculator, Notes, AI, Music, and Settings are buttons, then click Notes and assert the callback receives a window with `id: "notes"` and `title: "Notes"`.

- [ ] **Step 2: Run the test and confirm the intended failure**

Run `npm run test -- components/dock.test.tsx`.

Expected: failure because the current launchers are clickable `div` elements rather than named buttons.

- [ ] **Step 3: Keep the test focused**

Do not assert Tailwind class strings or exact colors. Those are deliberate visual decisions, not behavioral contracts.

---

### Task 2: Build and Integrate the App Icon Family

**Files:**
- Create: `components/AppIcon.tsx`
- Modify: `components/dock.tsx`

**Interfaces:**
- Produces: `AppIconId` and `AppIcon({ app, className })`.
- Consumes: direct Lucide icon components and `cn()`.

- [ ] **Step 1: Add the focused icon component**

Define the stable union `"calculator" | "notes" | "ai" | "music" | "settings"`. Map each value to a direct Lucide component and a small set of material classes. Render a shared tile shell, restrained highlight layers, and a centered glyph with `strokeWidth={1.8}`.

- [ ] **Step 2: Replace registry glyphs with stable app identifiers**

Remove icon components from `DockItem`. Render `AppIcon` from `item.id` and keep application behavior in `getWindow`.

- [ ] **Step 3: Make launchers semantic**

Render a `button` with `type="button"`, `aria-label={item.name}`, visible `focus-visible` ring styles, and active scale feedback inside each Motion wrapper.

- [ ] **Step 4: Run the focused test**

Run `npm run test -- components/dock.test.tsx`.

Expected: both launcher semantics and Notes activation pass.

---

### Task 3: Verify the Redesign

**Files:**
- Modify only files required by issues found during verification.

**Interfaces:**
- Consumes: completed icon system.
- Produces: verified desktop and mobile dock behavior.

- [ ] **Step 1: Run automated checks**

Run `npm run test`, `npx tsc --noEmit`, scoped ESLint for the changed TypeScript files, and `npm run build`.

- [ ] **Step 2: Run visual checks**

Open the local app at desktop and narrow viewport widths. Verify visual differentiation, consistent shape and glyph weight, readable tooltips, keyboard focus, pointer activation, and dock fit.

- [ ] **Step 3: Review the final diff**

Confirm no unrelated files changed and the implementation matches every global constraint in this plan.
