# 007 - Preserve Useful Reduced-Motion Feedback

- **Status**: DONE
- **Commit**: bac7a3c
- **Severity**: MEDIUM
- **Category**: Accessibility / Cohesion & tokens
- **Estimated scope**: 1 file, one global media-query block

## Problem

The global reduced-motion rule collapses every transition, including useful color, opacity, border, and shadow feedback, to effectively zero:

```css
/* src/lib/styles.css:237-245 - current */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

The audit rule is to remove movement while retaining gentle transitions that aid comprehension. This rule also cannot control JavaScript-driven animations such as Recharts, which is handled separately in Plan 006.

## Target

Replace only the global media-query block with:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-property: opacity, color, background-color, border-color, box-shadow !important;
    transition-duration: var(--motion-duration-fast) !important;
    transition-timing-function: var(--motion-ease-out) !important;
    scroll-behavior: auto !important;
  }
}
```

The target keeps color/opacity/border/shadow feedback at the existing 150ms fast token while excluding transform, translate, scale, width, height, margin, padding, left, and top from transitions. Keyframe animations remain effectively disabled.

## Repo conventions to follow

- `src/lib/styles.css:111-117` defines `--motion-duration-fast: 150ms` and `--motion-ease-out`; reuse both rather than inventing reduced-motion values.
- `src/components/ui/input.tsx:12` and `src/components/ui/select.tsx:49` already enumerate transition properties instead of using `transition-all`.

## Steps

1. Open `src/lib/styles.css:237-245`.
2. Keep the existing `animation-duration`, `animation-iteration-count`, and `scroll-behavior` declarations.
3. Replace the global `transition-duration: 0.01ms !important` declaration with the exact `transition-property`, `transition-duration`, and `transition-timing-function` declarations from Target.
4. Do not add selectors or change the normal-motion token values.

## Boundaries

- Do not remove reduced-motion handling entirely.
- Do not make transforms, movement, or layout properties animate under reduced motion.
- Do not change Recharts props; Plan 006 owns that JavaScript animation branch.
- Do not alter component markup or add dependencies.
- If the current media query has drifted, stop and report instead of broadening the selector.

## Verification

- **Mechanical**: inspect `src/lib/styles.css:237-245` and confirm the exact target declarations; run `bun run build`.
- **Reduced-motion feel check**: enable `prefers-reduced-motion: reduce`, toggle the theme, focus inputs, change active navigation, and open a Sheet. Color, border, opacity, and shadow feedback should remain visible for 150ms; sidebar movement, icon scaling, sheet translation, and layout movement should snap.
- **Normal-motion regression**: disable reduced motion and confirm normal component timings are unchanged.
- **Slow motion**: use DevTools at 10% playback on a Sheet and theme toggle; confirm no transform is being eased in reduced mode.
- **Done when**: reduced-motion users retain comprehension feedback without receiving positional or layout animation.
