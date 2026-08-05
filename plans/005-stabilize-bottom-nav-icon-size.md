# 005 - Stabilize Bottom Nav Icon Size

- **Status**: DONE
- **Commit**: bac7a3c
- **Severity**: HIGH
- **Category**: Purpose & frequency / Performance
- **Estimated scope**: 1 file, 1 class change

## Problem

Every mobile route change interpolates the active icon between two dimensions. The transition runs on `width` and `height`, which are layout-affecting properties, and this happens on a navigation control used dozens of times per day.

Current code:

```tsx
// src/components/layout/bottom-nav.tsx:78-83
<HugeiconsIcon
  icon={item.icon}
  className={`transition-[width,height] duration-200 ${
    active ? "size-[18px]" : "size-5"
  }`}
  strokeWidth={active ? 2 : 1.8}
/>
```

The active pill and label already provide a static state cue, and the icon stroke width still changes synchronously. The dimension interpolation adds layout work without explaining spatial movement.

## Target

Use one stable icon size and remove the dimension transition. Keep `strokeWidth={active ? 2 : 1.8}` and the existing color/background transitions unchanged; those are covered by the historical bottom-nav label plan and are not part of this plan.

```tsx
// target: src/components/layout/bottom-nav.tsx
<HugeiconsIcon
  icon={item.icon}
  className="size-5"
  strokeWidth={active ? 2 : 1.8}
/>
```

## Repo conventions to follow

- `src/components/layout/bottom-nav.tsx:73-76` uses explicit `transition-colors` for the active background rather than a broad transition.
- `src/components/ui/sidebar.tsx:221,233,406` uses named transition properties; do not animate layout properties implicitly.
- `src/lib/styles.css:111-117` is the source of shared duration/easing tokens when a transition is actually needed.

## Steps

1. In `src/components/layout/bottom-nav.tsx:78-83`, replace the conditional icon class with `className="size-5"`.
2. Do not change the parent link, active pill, label transitions, `strokeWidth`, or the `Lainnya` icon.

## Boundaries

- Do not remove the existing label or background color transitions.
- Do not change navigation destinations, hit areas, safe-area padding, or Sheet behavior.
- Do not add a scale transform or another icon animation.
- If the icon is already stable when this plan is executed, mark the plan DONE without further changes.

## Verification

- **Mechanical**: run `rg -n 'transition-\[width,height\]|size-\[18px\]' src/components/layout/bottom-nav.tsx`; expected result: no matches. Run `bun run build`; expected result: success.
- **Feel check**: at a viewport narrower than 768px, switch repeatedly between Beranda, Ziyadah, Murajaah, and Presensi. Confirm the icon never grows or shrinks and the active pill/label cue remains clear.
- **Performance check**: record five rapid tab switches in DevTools Performance; confirm there is no layout animation attributable to icon width/height.
- **Reduced motion**: confirm the stable icon size and static active cue remain usable with reduced motion enabled.
- **Done when**: mobile navigation has no width/height interpolation during route selection.
