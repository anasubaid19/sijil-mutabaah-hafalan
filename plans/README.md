# Animation Improvement Plans

Reconciled by `improve-animations` against commit `bac7a3c`.

## Execution Order

| Order | Plan | Severity | Status | Dependencies |
|-------|------|----------|--------|-------------|
| - | [001 — Sidebar Easing](001-sidebar-easing.md) | HIGH | DONE - already present in `bac7a3c` | None |
| - | [002 — Motion Tokens](002-motion-tokens.md) | HIGH | DONE - already present in `bac7a3c` | 001 historical prerequisite |
| - | [003 — Bottom Nav Transition](003-bottomnav-transition.md) | MEDIUM | DONE - already present in `bac7a3c` | None |
| 1 | [004 — Remove Attendance Chip Motion](004-remove-attendance-chip-motion.md) | HIGH | DONE | None |
| 2 | [005 — Stabilize Bottom Nav Icon Size](005-stabilize-bottom-nav-icon-size.md) | HIGH | DONE | None |
| 3 | [006 — Correct and Shorten Chart Animation](006-correct-chart-animation.md) | MEDIUM | DONE | None |
| 4 | [007 — Preserve Reduced-Motion Feedback](007-preserve-reduced-motion-feedback.md) | MEDIUM | DONE | 006 recommended first for chart behavior |
| 5 | [008 — Cancel Stale Tutorial Motion](008-cancel-stale-tutorial-motion.md) | MEDIUM | DONE | None |

### Recommended execution: 004 -> 005 -> 006 -> 007 -> 008

- **004 first** - deletes animation from the highest-frequency data-entry controls.
- **005 second** - removes layout-bound icon interpolation from the other high-frequency navigation control.
- **006 third** - fixes the chart animation owner, shortens it to 200ms, and adds the JavaScript reduced-motion branch.
- **007 fourth** - preserves useful color/opacity feedback while dropping movement globally; it is easiest to verify after 006.
- **008 last** - isolates the rare tutorial's async step race without changing its visual design.

## Audit Items Not Yet Planned

- `src/components/tutorial-overlay.tsx:473-479,489-498,508-517` still uses broad `transition: all` / `transition-all`; create a separate plan if explicit spotlight/card transition properties are desired after 008.
- `src/routes/parent.tsx:159` uses `fade-in duration-500`; reduce it only if the parent portal's page-load feel is still slow after the higher-leverage plans.
- `src/routes/_authed/dashboard.tsx:331,699` and `src/routes/parent.tsx:211` animate progress `width`; consider a separate performance plan if layout/paint cost is observed on low-power devices.

## Verification Checklist

After executing the TODO plans:

- [x] Sidebar collapses with natural deceleration (001, present in current source)
- [x] Sidebar group label fades smoothly when collapsing to icon mode (002, present in current source)
- [x] Floating panel duration tokenization and Sheet easing are present (002, current source)
- [x] Bottom nav labels have explicit color transitions (003, present in current source)
- [x] Attendance chips change without animation (004)
- [x] Bottom nav icon size remains stable (005)
- [x] Charts animate on series at 200ms and respect reduced motion (006)
- [x] Reduced motion keeps comprehension feedback but drops movement (007)
- [x] Tutorial step changes cannot apply stale async state (008)
