# Plan 003 — Bottom Nav Active State Transition

**Commit:** `f1d84cb`
**Severity:** MEDIUM
**Category:** Missed Opportunity (Additive)
**Effort:** 3 lines, 1 file

## Finding

The bottom navigation's active state indicator (pill background, icon scale, and label color) all change instantly with no CSS transition. While the `<Link>` container and the icon wrapper have `transition-all duration-200`, the label span (`<span>` inside each tab) and the "Lainnya" button's label have **no transition class** — they snap between `text-primary` (active) and `text-muted-foreground` (inactive) instantly.

This is the second most frequently used motion element on mobile (every tab switch, dozens of times per day). The instant color change creates a jarring "pop" that undermines the polished feel of the floating nav bar and rounded container.

## Fix

Add `transition-colors duration-200` to the label `<span>` inside both the main tabs and the "Lainnya" button. The icon and pill container already have `transition-all duration-200` — only the text labels are missing.

### File: `src/components/layout/bottom-nav.tsx`

**Change 1 — Line 72-75 (main tabs label):**

```diff
  <span
-   className={`text-[0.6rem] font-semibold uppercase tracking-wider ${
+   className={`text-[0.6rem] font-semibold uppercase tracking-wider transition-colors duration-200 ${
      active ? "text-primary" : ""
    }`}
  >
```

The existing conditional `text-primary` / "" relies on the default `text-muted-foreground` from the parent `<Link>`. Adding `transition-colors duration-200` makes the color shift smooth.

**Change 2 — Line 100-102 ("Lainnya" button label):**

```diff
- <span className="text-[0.6rem] font-semibold uppercase tracking-wider">
+ <span className="text-[0.6rem] font-semibold uppercase tracking-wider transition-colors duration-200">
    Lainnya
  </span>
```

The "Lainnya" button receives its color from the parent button's conditional `text-primary / text-muted-foreground`. The label inherits this — adding `transition-colors` smooths the inherited color change.

**Change 3 — Verify icon and pill already have transitions:**

The icon wrapper already has `transition-all duration-200` (line 60) — no change needed. The "<Lainnya" button's icon wrapper also has `transition-all duration-200` (line 91).

## Target Values

| Element | Transition | Duration | Easing |
|---------|-----------|----------|--------|
| Label span | `transition-colors` | `200ms` | default (`ease`) |
| Icon wrapper | `transition-all` (existing) | `200ms` (existing) | default (existing) |
| Pill bg | `transition-all` (existing) | `200ms` (existing) | default (existing) |

All durations match the existing `duration-200` on the parent elements — consistent with the floating navbar's 200ms timing.

## Steps

1. Open `src/components/layout/bottom-nav.tsx`
2. On line 73, insert `transition-colors duration-200 ` before `${active ? ...}`
3. On line 100, add `transition-colors duration-200` to the `<span>` className
4. Save. No other changes.

## Scope Boundaries

- **DO** add `transition-colors duration-200` to both label `<span>` elements
- **DO NOT** change any layout, sizing, or positioning
- **DO NOT** add transitions to the Sheet content items (different scope)
- **DO NOT** change the existing `transition-all` on the icon/pill wrappers

## Verification

1. Open the app on mobile (width < 768px) or use Chrome DevTools mobile emulation
2. Navigate between tabs by tapping: Beranda → Ziyadah → Murajaah → Presensi
3. **Feel check:** The label text should smoothly fade from `text-muted-foreground` to `text-primary` (and back when inactive) instead of snapping. The combined effect with the icon scale and pill background should create a cohesive tab switch animation.
4. Open "Lainnya" → the label should also transition smoothly when tapping
5. Repeat the tab switch 5 times in rapid succession — the color transition should feel smooth each time
6. Verify the floating bottom nav bar itself retains its `shadow-lg` and `backdrop-blur-sm` — no layout shifts during tab changes
