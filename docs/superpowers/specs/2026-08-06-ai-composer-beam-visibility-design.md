# AI Composer Beam Visibility Design

## Goal

Make the AI composer Beam easy to notice while preserving the app's monochrome, low-saturation visual language. Fast AI responses must not make the effect disappear before a person can perceive it.

## Visual Treatment

- Keep the Beam around the complete composer surface only.
- Keep `pulse-inner`, the `mono` color variant, and the light theme.
- Increase Beam strength from `0.45` to `1` and set brightness to `0.72` for a clearer medium-gray glow against the white composer.
- Use a slower `3.4` second animation cycle so the pulse reads as deliberate rather than flickering.
- Preserve the existing neutral composer border, 12px radius, message layout, and disabled-control styling.
- Do not add color, a second animation, or a Beam around the whole mini-app window.

## Timing and Interaction

Submitting a message activates the Beam immediately. The Beam remains active for at least four seconds from submission, even when the AI response completes earlier.

Request state and Beam state are independent:

- `isLoading` continues to control the disabled composer and `Thinking…` status.
- `isBeamActive` controls only the decorative Beam.
- The response appears and the composer becomes interactive as soon as the request finishes.
- If the request lasts more than four seconds, the Beam remains active until the request finishes.
- After both the request and minimum display period have completed, the Beam deactivates and uses the package's normal fade-out behavior.

This behavior avoids delaying useful content merely to display an animation.

## State Management

Keep the timing logic local to `AIApp`. Record the activation time when a request starts. In the request's `finally` block, calculate the remaining portion of the four-second minimum:

- If time remains, schedule Beam deactivation for that delay.
- If the minimum has elapsed, deactivate immediately.

Store the timeout handle in a ref. Clear an existing timeout before a new submission and on unmount so consecutive sends and component closure cannot leave stale updates behind.

No global state, shared hook, API change, or Border Beam fork is required.

## Accessibility

The Beam remains decorative. `Thinking…` continues to provide the live non-visual request status and disappears as soon as the request completes. The lingering Beam must not keep controls disabled, retain focus, or announce additional status.

Border Beam's reduced-motion behavior remains authoritative. The application does not add custom continuous animation.

## Testing

Extend the AI composer interaction test with controlled time:

- Submit a message and verify both request and Beam states activate.
- Resolve a fast request and verify the response appears and the composer returns to idle while the Beam remains active.
- Advance time to just before four seconds and verify the Beam is still active.
- Advance through the minimum duration and verify the Beam deactivates.
- Verify the timeout is cleaned up when the component unmounts.

Run the focused test through a red-green cycle, then run the complete test suite, TypeScript, scoped lint, and production build. Visually verify the clearer effect on desktop and a 375x812 mobile viewport.

## Out of Scope

- Delaying AI responses or keeping controls disabled for animation timing.
- Changing the chat API or adding streaming.
- Applying Beam to other mini-apps, the dock, or the full window.
- Introducing colorful gradients or high-saturation accents.
