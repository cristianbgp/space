# App Icon System Design

## Goal

Replace the dock's generic gray icon buttons with a coherent, recognizable app icon family that strengthens the existing browser-desktop aesthetic without redesigning the desktop itself.

## Design Direction

Use a **mineral glass** direction. Each app receives a restrained material identity while every tile shares the same rounded-square silhouette, border highlight, optical icon size, shadow construction, and interaction behavior.

- Calculator: graphite, precise and dense.
- Notes: warm paper-gold, quiet and tactile.
- AI: cobalt glass, clear and energetic without a generic purple gradient.
- Music: deep garnet, expressive but controlled.
- Settings: titanium, neutral and mechanical.

The dock surface remains monochrome. Color is limited to the app objects, which makes them easier to recognize without changing the broader `.space` palette.

## Component Boundary

Create a focused `AppIcon` component that owns app-specific glyphs and visual treatments. The dock owns app behavior, labels, magnification, and window creation. This keeps decorative details out of the application registry and gives future mini-apps one obvious place to add an icon treatment.

The component accepts a stable app identifier and size-related classes. It uses direct Lucide imports, a consistent `1.8` stroke width, and no hand-drawn SVG paths or new dependencies.

## Interaction and Accessibility

Each app launcher becomes a semantic button with its app name as the accessible label. Keyboard focus uses a visible high-contrast ring. Pointer activation retains the existing spring magnification and adds a subtle pressed state. Decorative glyphs remain hidden from assistive technology because the button supplies the name.

Motion remains short and tactile. The icon surface itself does not run looping animation.

## Responsive Behavior

Tiles remain compact on mobile and increase slightly at the existing medium breakpoint. Internal glyph and highlight proportions scale with the tile rather than changing composition. The five-item dock must continue fitting the narrow layout without horizontal scrolling.

## Verification

- A component test verifies that all five launchers are exposed as named buttons and activation still opens the selected app.
- TypeScript and scoped ESLint verify component integration.
- The full test suite and production build catch regressions.
- Desktop and narrow viewport screenshots verify contrast, spacing, magnification, focus, and visual consistency.

## Scope

This change covers dock app icons and their launcher semantics. It does not redesign controls inside mini-apps, add apps, change window behavior, or alter the desktop background.
