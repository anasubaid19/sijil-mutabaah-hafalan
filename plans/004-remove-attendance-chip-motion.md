# 004 - Remove Attendance Chip Motion

- **Status**: DONE
- **Commit**: bac7a3c
- **Severity**: HIGH
- **Category**: Purpose & frequency / Performance
- **Estimated scope**: 2 files, 2 class-string edits

## Problem

Attendance status chips are changed repeatedly during daily attendance entry. They use `transition-all`, so every click asks the browser to interpolate every animatable property rather than changing the status cue immediately.

Current code:

```tsx
// src/routes/_authed/dashboard.tsx:381
className={`rounded-md px-2 py-1.5 text-xs font-semibold transition-all duration-150 min-h-[44px] min-w-[44px] focus-visible:ring-2 focus-visible:ring-ring ${
  current === st ? CHIP_ACTIVE[st] : CHIP_COLORS[st]
}`}
```

```tsx
// src/routes/_authed/presensi.tsx:261
className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition-all duration-150 min-h-[44px] min-w-[44px] focus-visible:ring-2 focus-visible:ring-ring ${
  current === st ? CHIP_ACTIVE[st] : CHIP_COLORS[st]
}`}
```

These are high-frequency controls, not decorative transitions. The status must feel recorded immediately and never spend time animating layout, color, or ring changes after every attendance click.

## Target

Remove the transition class from both attendance chip buttons. Keep the existing dimensions, focus ring, accessible names, `aria-pressed`, and state color/ring classes unchanged.

```tsx
// target in both files
className={`rounded-md px-2 py-1.5 text-xs font-semibold min-h-[44px] min-w-[44px] focus-visible:ring-2 focus-visible:ring-ring ${
  current === st ? CHIP_ACTIVE[st] : CHIP_COLORS[st]
}`}
```

Use the corresponding `px-2.5` value in `presensi.tsx`; do not normalize unrelated spacing.

## Repo conventions to follow

- `src/components/layout/bottom-nav.tsx:69-117` already limits state animation to explicit `transition-colors`; do not reintroduce `transition-all`.
- `src/lib/styles.css:110-117` is the shared motion token area, but this interaction intentionally has no transition because it is high frequency.

## Steps

1. In `src/routes/_authed/dashboard.tsx:381`, delete only `transition-all duration-150` from the attendance chip class string.
2. In `src/routes/_authed/presensi.tsx:261`, delete only `transition-all duration-150` from the attendance chip class string.
3. Leave the button markup, `aria-label`, `aria-pressed`, color maps, and hit-area classes unchanged.

## Boundaries

- Do not change attendance API calls or optimistic state behavior.
- Do not change the dashboard or Presensi layout.
- Do not add a replacement animation, dependency, hook, or new token.
- Do not touch the shared `Button` component.
- If either class string has drifted from the excerpt, stop and report instead of improvising.

## Verification

- **Mechanical**: run `rg -n 'transition-all duration-150' src/routes/_authed/dashboard.tsx src/routes/_authed/presensi.tsx`; expected result: no matches. Run `bun run build`; expected result: success.
- **Feel check**: open Dashboard and Presensi, click different status chips rapidly for several students, and confirm the new ring/color state appears immediately without a delayed or sliding response.
- **Reduced motion**: with `prefers-reduced-motion: reduce` enabled, confirm the same immediate state change and no loss of the static selected cue.
- **Done when**: both attendance screens retain their 44px targets, focus rings, and selected status cue while status changes no longer animate.
