# 006 - Correct and Shorten Chart Animation

- **Status**: DONE
- **Commit**: bac7a3c
- **Severity**: MEDIUM
- **Category**: Easing & duration / Accessibility
- **Estimated scope**: 1 file, chart prop and reduced-motion wiring

## Problem

The Dashboard places `animationDuration={400}` on the chart wrapper components:

```tsx
// src/routes/_authed/dashboard.tsx:771
<BarChart data={chartData} animationDuration={400}>
```

```tsx
// src/routes/_authed/dashboard.tsx:805
<LineChart data={chartData} animationDuration={400}>
```

In the installed Recharts version, `animationDuration` belongs on the `Bar` and `Line` series, not `BarChart` or `LineChart`; TypeScript already reports both wrapper props as invalid. The actual series therefore retain their default 400ms animation. Four hundred milliseconds is above the audit budget for a dashboard control change, and the chart has no JavaScript reduced-motion branch because the global CSS media query cannot control Recharts props.

## Target

1. Track `prefers-reduced-motion` in `DashboardPage` with a `matchMedia` listener.
2. Pass `reducedMotion` into every `ChartBlock` call and add it to the `ChartBlock` props.
3. Remove `animationDuration` from `BarChart` and `LineChart`.
4. Add these exact props to each `Bar` and `Line` series:

```tsx
isAnimationActive={!reducedMotion}
animationDuration={200}
animationEasing="cubic-bezier(0.23,1,0.32,1)"
```

The 200ms duration matches `--motion-duration-normal: 200ms` in `src/lib/styles.css:113`. The cubic-bezier is the audit catalog's strong UI ease-out curve. When reduced motion is enabled, the data update should be immediate with the existing chart labels and controls still providing static feedback.

Use this exact state/listener pattern inside `DashboardPage`:

```tsx
const [reducedMotion, setReducedMotion] = useState(
  () =>
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches,
);

useEffect(() => {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  const update = () => setReducedMotion(media.matches);
  update();
  media.addEventListener("change", update);
  return () => media.removeEventListener("change", update);
}, []);
```

## Repo conventions to follow

- `src/lib/styles.css:110-117` owns motion durations and easing tokens; use its 200ms duration as the reference and do not add a second CSS token.
- `src/routes/_authed/dashboard.tsx:439-463` already exposes chart state through explicit buttons; preserve that static state feedback.
- `src/components/ui/sheet.tsx:56` uses `ease-out` for a crisp dashboard surface rather than `ease-in-out`.

## Steps

1. Add the `reducedMotion` state and `matchMedia` listener to `DashboardPage`, using the exact pattern in Target.
2. Add `reducedMotion={reducedMotion}` to both mobile and desktop `ChartBlock` calls.
3. Add `reducedMotion: boolean` to the `ChartBlock` props type.
4. Remove `animationDuration={400}` from `BarChart` and `LineChart`.
5. Add `isAnimationActive`, `animationDuration={200}`, and the exact `animationEasing` string to both `Bar`/`Line` series.
6. Do not change chart data, colors, axes, tooltip content, or chart height.

## Boundaries

- Do not add Recharts or motion dependencies.
- Do not animate the chart wrapper with CSS.
- Do not use a generic `transition-all` or an `ease-in` curve.
- Do not change the chart's data model or visual palette.
- If the installed Recharts types differ from this plan, stop and report rather than moving props to another component without checking its type.

## Verification

- **Mechanical**: run `rg -n 'BarChart.*animationDuration|LineChart.*animationDuration' src/routes/_authed/dashboard.tsx`; expected result: no matches. Run `bunx tsc --noEmit`; the two current `animationDuration` errors at the chart wrappers should be gone, though unrelated existing errors may remain. Run `bun run build`; expected result: success.
- **Feel check**: switch Week/Month and Bar/Line repeatedly. Confirm the series settles in 200ms with a fast start and gentle deceleration, without restarting awkwardly when the control is changed again.
- **Reduced motion**: enable `prefers-reduced-motion: reduce` in DevTools Rendering, switch chart range/type, and confirm the chart updates without animated movement while the selected control state remains visible.
- **Slow motion**: inspect the chart at 10% playback or frame-by-frame; confirm there is no delayed first frame or wrapper-level animation.
- **Done when**: only the Bar/Line series animate, the duration is 200ms, the easing is the exact cubic-bezier above, and reduced motion disables the chart animation.
