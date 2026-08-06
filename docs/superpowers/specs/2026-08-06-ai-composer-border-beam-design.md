# AI Composer Border Beam Design

## Goal

Use Border Beam as a meaningful generation-state indicator in the AI mini-app without introducing persistent decorative motion or breaking the existing monochrome visual language.

## Placement

The effect belongs around the complete AI composer surface, which contains the message textarea and send button. It does not wrap the full AI window, message bubbles, dock icon, or other mini-apps.

This placement keeps the animation adjacent to the action that triggered it and avoids adding shared state between the AI app and desktop shell.

## Visual Treatment

- Use the `pulse-inner` Border Beam variant.
- Use the `mono` color variant and `light` theme.
- Set a restrained strength of `0.45`.
- Use a slow `2.8` second duration.
- Activate the beam only while an AI request is in progress.
- Keep a normal neutral 1px border around the composer when idle.
- Preserve the existing rounded shape system with a 12px composer radius.
- Do not use colorful, ocean, sunset, or hue-shifting variants.

The composer becomes a single bordered surface. The textarea uses a transparent, borderless interior, while the send button remains visually distinct inside the shared boundary.

## Interaction States

### Idle

The composer shows its neutral border and accepts input. The beam is inactive.

### Generating

The textarea and send button remain disabled according to the current request rules. The monochrome inner pulse fades in around the composer. A compact `Thinking…` status appears in the message area with `role="status"` and `aria-live="polite"`.

### Complete

The pulse fades out when the response resolves. The composer becomes interactive and focus returns to the textarea through the existing focus behavior.

### Error

The pulse fades out when the request fails. The existing inline error remains visible, and the composer becomes interactive again.

## Motion and Accessibility

- Use Border Beam's pulse variant because it includes a reduced-motion fallback.
- The beam is decorative and must not affect keyboard navigation or pointer interaction.
- The `Thinking…` status provides a non-visual generation signal.
- Do not add a second loading animation. Replace the current three bouncing dots with the static status.
- Do not autofocus on initial mobile render as part of this change; existing focus behavior remains out of scope.

## Architecture

Install the `border-beam` package and import `BorderBeam` directly in the AI mini-app. Keep request state owned by `AIApp`; pass `isLoading` to the beam's `active` prop. Add `data-state="idle"` or `data-state="generating"` to the composer surface so the application state remains inspectable independently of the third-party component's internal markup.

No global store, desktop-shell change, reusable abstraction, or package fork is needed for the first use.

## Testing

- Add AI mini-app tests with a controlled deferred fetch response.
- Verify the composer starts in the idle state.
- Submit a message and verify the composer enters the generating state, controls become disabled, and `Thinking…` appears.
- Resolve the request and verify the composer returns to idle, the status disappears, and the assistant response appears.
- Run the full test suite, TypeScript, scoped lint, and production build.
- Visually verify the AI composer in desktop and mobile windows with idle, generating, and reduced-motion behavior.

## Out of Scope

- Adding Beam to other mini-apps.
- Animating the full active window or dock icons.
- Refactoring the AI API or introducing streaming responses.
- Persisting AI conversation history.
- Redesigning message bubbles or unrelated AI error styling.
