# Mobile Window Safe Areas Design

## Goal

Make mini-app windows feel intentionally inset on mobile browsers while respecting device notches, browser chrome, the menu bar, and the dock.

## Current Problem

The mobile shell uses fixed pixel offsets and `h-screen`. Mobile windows nearly fill the viewport, the menu bar and dock do not account for safe-area insets, and changing browser chrome can make the usable area jump.

## Design Direction

Preserve the monochrome desktop metaphor and introduce an inset floating-window treatment on viewports below 768px.

- Use `100dvh` for the desktop root so mobile browser chrome changes do not destabilize the layout.
- Add safe-area-aware menu bar padding and height.
- Place mobile windows below the safe-area-aware menu bar with 12px horizontal margins.
- Reserve space below mobile windows for the dock, a 12px visual gap, and the bottom safe-area inset.
- Make the dock bottom position safe-area aware.
- Keep desktop window dimensions, dragging, and resizing unchanged.
- Use existing semantic color tokens and the existing monochrome palette.

## Geometry

The shell exposes shared CSS custom properties:

- `--mobile-shell-gutter: 0.75rem`
- `--mobile-menu-height: 1.75rem`
- `--mobile-dock-height: 4rem`
- `--mobile-shell-gap: 0.75rem`

The safe-area offsets use `env(safe-area-inset-top, 0px)` and `env(safe-area-inset-bottom, 0px)`.

The menu bar occupies the top safe area plus `--mobile-menu-height`. The mobile window starts after the menu bar plus `--mobile-shell-gap`. Its bottom edge sits above the dock height, bottom safe area, and another `--mobile-shell-gap`. The dock sits `0.5rem` above the bottom safe area.

In landscape mobile layouts, the shell reduces the vertical gap to `0.5rem` so short screens retain useful app content without returning to an edge-to-edge window.

## Window Treatment

Mobile windows use a 12px radius, a neutral border, and the existing restrained shadow. The title bar remains 40px tall for touch comfort. Content scrolls inside the window rather than moving the overall desktop shell.

The close control receives an accessible name and a minimum 32px touch target while preserving its small circular visual mark.

## Accessibility and Browser Behavior

- Keep browser zoom enabled.
- Add `viewport-fit: cover` so CSS safe-area variables are available on supported mobile browsers.
- Preserve visible focus states on interactive controls.
- Keep the window opening motion transform- and opacity-only.
- Respect the existing motion behavior; no additional perpetual animation is introduced.
- Prevent horizontal shell overflow.

## Testing

- Unit-test the mobile window class and safe-area-based inset styles.
- Unit-test the accessible close button.
- Run the existing test suite, TypeScript, scoped lint, and production build.
- Visually verify portrait and landscape mobile browser sizes, including the menu bar, window, dock, close control, and internal scrolling.

## Out of Scope

- Redesigning individual mini-app content.
- Changing desktop window sizing, dragging, or resizing.
- Reworking dock icon design or navigation behavior.
- Adding native-device detection or JavaScript viewport measurement.
