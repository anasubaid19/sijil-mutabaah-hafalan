# Plan 002 — Tokenize Floating Panel Motion Durations

**Commit:** `f1d84cb`
**Severity:** HIGH
**Category:** Cohesion & Tokens
**Effort:** 2 CSS lines + 8 file changes

## Finding

All 13 floating panel components use hardcoded `duration-100` (100ms) for enter/exit animations. The design system defines `--motion-duration-fast: 150ms` but no panel uses it. A future designer who wants to speed up or slow down all panels must edit 13 files. The same applies to the Sheet's `ease-in-out` — it's the only component using that easing.

## Fix

Add a new token `--motion-duration-micro: 100ms` (the actual value all panels use), wire it into Tailwind v4 via `@theme inline` alias, then replace hardcoded values in the 8 most-used floating panel files. Leave the 4 rare overlay components (context-menu, menubar, hover-card, navigation-menu) untouched.

### Step 1: Add duration micro token

**File:** `src/lib/styles.css`

After line 112 (`--motion-duration-slow: 500ms;`), add:

```css
--motion-duration-micro: 100ms;  /* floating panels (dialog, dropdown, popover, select, combobox, tooltip) */
```

After line 62 (`--ease-default: var(--motion-ease-default);`), add:

```css
--duration-micro: var(--motion-duration-micro);
```

This makes `--duration-micro` available as a CSS variable that Tailwind's arbitrary value syntax can reference.

### Step 2: Replace hardcoded values in 8 files

| # | File | Line | Old | New |
|---|------|------|-----|-----|
| 1 | `src/components/ui/dialog.tsx` | 54 | `duration-100` | `duration-[var(--duration-micro)]` |
| 2 | `src/components/ui/dropdown-menu.tsx` | 44 | `duration-100` | `duration-[var(--duration-micro)]` |
| 3 | `src/components/ui/dropdown-menu.tsx` | 141 | `duration-100` | `duration-[var(--duration-micro)]` |
| 4 | `src/components/ui/popover.tsx` | 39 | `duration-100` | `duration-[var(--duration-micro)]` |
| 5 | `src/components/ui/select.tsx` | 98 | `duration-100` | `duration-[var(--duration-micro)]` |
| 6 | `src/components/ui/combobox.tsx` | 123 | `duration-100` | `duration-[var(--duration-micro)]` |

Exact substitution (single-word replacement, same line): `duration-100` → `duration-[var(--duration-micro)]`

### Step 3: Sheet easing alignment

**File:** `src/components/ui/sheet.tsx`, line 56

```diff
- "fixed z-50 flex flex-col ... transition duration-200 ease-in-out ..."
+ "fixed z-50 flex flex-col ... transition duration-200 ease-out ..."
```

This aligns the Sheet with the design token `--motion-ease-out` values (`cubic-bezier(0, 0, 0.2, 1)` — natural deceleration for sliding panels).

### Step 4: Sidebar duration consistency

**File:** `src/components/ui/sidebar.tsx`, line 221 (gap spacer)

```diff
- "relative w-(--sidebar-width) bg-transparent transition-[width] duration-200 ease-linear"
+ "relative w-(--sidebar-width) bg-transparent transition-[width] duration-200 ease-out"
```

This was missed in Plan 001. The gap spacer is a companion element to the sidebar container — should use the same easing.

### Step 5: Dialog overlay matching

**File:** `src/components/ui/dialog.tsx`, line 32

```diff
- "fixed inset-0 isolate z-50 bg-black/30 duration-100 ..."
+ "fixed inset-0 isolate z-50 bg-black/30 duration-[var(--duration-micro)] ..."
```

The Dialog overlay was hardcoded separately from the content. Unified.

## Target Values

| Token | Value | Where Used |
|-------|-------|------------|
| `--motion-duration-micro` | `100ms` | `styles.css:113` (new line) |
| `--duration-micro` | `var(--motion-duration-micro)` | `styles.css:63` (new line) |
| `ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | Sheet + sidebar gap |

## Steps

1. Open `src/lib/styles.css`
2. After `--motion-duration-slow: 500ms;`, add: `--motion-duration-micro: 100ms;`
3. After `--ease-default: var(--motion-ease-default);`, add: `--duration-micro: var(--motion-duration-micro);`
4. Open the 7 files listed in Step 2 table. Replace `duration-100` with `duration-[var(--duration-micro)]` (single-word substitution).
5. Open `src/components/ui/sheet.tsx`. On line 56, change `ease-in-out` to `ease-out`.
6. Open `src/components/ui/sidebar.tsx`. On line 221, change `ease-linear` to `ease-out`.
7. Save all files.

## Scope Boundaries

- **DO** change only listed files and lines
- **DO NOT** touch: context-menu, menubar, hover-card, navigation-menu, tooltip, sonner
- **DO NOT** change any duration value — `100ms` stays `100ms`, just tokenized
- **DO NOT** change easing on floating panels (they already use implicit `ease` which matches `--ease-default`)

## Verification

1. Open any dialog (e.g., student modal from Laporan page)
2. The enter/exit animation should feel identical to before — 100ms fade + scale
3. Open the Sheet (mobile bottom nav → "Lainnya")
4. The sheet should slide in with a smoother deceleration (no longer "sticky" at the start of `ease-in-out`)
5. Collapse the desktop sidebar — should feel identical to Plan 001 result
6. Check that all 13 panel types still animate. If any panel uses `duration-100` you missed a file — search `rg "duration-100" src/components/ui/` to find it.
