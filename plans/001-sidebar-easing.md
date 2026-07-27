# Plan 001 — Sidebar `ease-linear` → `ease-out`

**Commit:** `f1d84cb`
**Severity:** HIGH
**Category:** Physicality
**Effort:** 3 lines, 1 file

## Finding

The sidebar collapse/expand animation uses `ease-linear` (constant velocity) for width, position, and opacity transitions. This creates a mechanical, robotic feel — the sidebar slides at a perfectly uniform speed with no deceleration. All three animated sidebar elements use this easing:

1. **Container** (`sidebar.tsx:233`) — `transition-[left,right,width] duration-200 ease-linear`
2. **Group label** (`sidebar.tsx:406`) — `transition-[margin,opacity] duration-200 ease-linear`
3. **Menu button** (`sidebar.tsx:481`) — `transition-[width,height,padding]` with implicit `ease` (from CVA default)

The sidebar is the most frequently used motion element in the application (every collapse/expand interaction). Using `ease-linear` here is the highest-leverage single easing fix.

## Fix

Replace `ease-linear` with `ease-out` on the container and group label. The menu button already uses default `ease` (no explicit easing class) — this is acceptable but will be addressed in Plan 002.

### File: `src/components/ui/sidebar.tsx`

**Change 1 — Line 233:**

```diff
- "fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-200 ease-linear ..."
+ "fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-200 ease-out ..."
```

**Change 2 — Line 406:**

```diff
- "flex h-8 shrink-0 items-center rounded-xl px-3 text-xs font-medium ... transition-[margin,opacity] duration-200 ease-linear ..."
+ "flex h-8 shrink-0 items-center rounded-xl px-3 text-xs font-medium ... transition-[margin,opacity] duration-200 ease-out ..."
```

**Change 3 — Line 481 (CVA definition):**

No change needed — this line already uses implicit `ease` (Tailwind default), which is close enough to `ease-out` for the small `width/height/padding` delta when collapsing to icon mode. If uneven feel detected, add `ease-out` in Plan 002 token pass.

### Target easing value

```
ease-out = cubic-bezier(0, 0, 0.2, 1)
```

This matches `--motion-ease-out` defined at `src/lib/styles.css:113`. It starts fast and decelerates — natural for a sliding panel.

## Steps

1. Open `src/components/ui/sidebar.tsx`
2. On line 233, replace `ease-linear` with `ease-out`
3. On line 406, replace `ease-linear` with `ease-out`
4. Save. No other changes.

## Scope Boundaries

- **DO** change only `ease-linear` → `ease-out` in `sidebar.tsx`
- **DO NOT** change durations, CSS properties, or layout
- **DO NOT** touch any other file

## Verification

1. Open the app on desktop (width ≥ 768px)
2. Click the sidebar toggle (PanelLeftOpen button in header)
3. **Feel check:** The sidebar should now glide to a stop instead of stopping abruptly. It should feel like it decelerates before reaching its final position.
4. Repeat the toggle 5 times in quick succession — the motion should feel smooth each time
5. Open Chrome DevTools → Performance tab → record a sidebar toggle. Verify no layout recalculation spikes (only composite transforms/width changes, which are unavoidable for sidebar width animation)

If the sidebar feels "floaty" or too slow with `ease-out`, adjust to `duration-150 ease-out` on line 233 only.
