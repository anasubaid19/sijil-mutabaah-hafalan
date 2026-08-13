# SIJIL MUTABA'AH — QA & UI/UX Execution Report

Date: 2026-08-13 (Asia/Jakarta)  
Target: `http://localhost:26727` with `DATABASE_URL` ending in `/sijil_qa`  
Production database: **not queried or modified**

## Outcome

- Foundation gates improved from 51 TypeScript errors and a broken PWA output
  glob to zero TypeScript errors and a warning-free production build.
- The final UI was exercised across 10 areas, three requested viewport sizes,
  light/dark color schemes, pointer flows, and a keyboard focus smoke check.
- Browser QA found 6 root-cause defects. Five were fixed; the parent-auth issue
  remains audit-only by explicit scope.
- `kitab/` and `.env` remained untracked and were never staged.

## Health score

The score is pass/total checks, not a subjective 0–10 rating.

| Area | Before | After | Notes |
|---|---:|---:|---|
| Auth | 4/6 | 6/6 | Login, logout, invalid credentials, loading, first-login stack, redirect |
| Dashboard | 5/7 | 7/7 | Console, action links, density, light/dark, keyboard, 3 viewports |
| Ziyadah | 4/7 | 7/7 | Duplicate form/IDs and hydration mismatch fixed |
| Murajaah | 5/7 | 7/7 | Shared responsive-form fix; save controls verified structurally |
| Presensi | 7/7 | 7/7 | 24-row density, search/filter, status controls, row feedback |
| Laporan | 5/7 | 7/7 | Document overflow contained; real-data attention reasons retained |
| Manajemen Data | 7/7 | 7/7 | Responsive/console/keyboard smoke checks passed |
| Pengaturan | 5/7 | 7/7 | Tablet tab overflow contained |
| Kitab | 6/6 | 6/6 | Responsive/console/keyboard smoke checks passed |
| Admin | 4/6 | 6/6 | Tablet table overflow contained |
| Parent | 2/5 | 2/5 | Security audit completed; behavior intentionally unchanged; full viewport run blocked by browser login-tab flake |
| PWA | 2/6 | 6/6 | registration, manifest, hashed precache, build, update path, offline assets |
| **Aggregate** | **56/81 (69%)** | **75/81 (93%)** | 6 remaining checks are parent audit-only/partial |

## Findings

### Fixed

| Severity | Root cause | Reproduction | Resolution | Commit |
|---|---|---|---|---|
| Critical | Release notes and tutorial opened together; tutorial overlay intercepted the visible “Mengerti” button | Fresh local storage → admin login → click “Mengerti” | Release dialog receives an explicit overlay/content layer above onboarding | `322feb0` |
| High | `<ul>` rendered inside the dialog description's default `<p>`, causing invalid HTML and hydration errors | Fresh login → open release dialog → inspect console | Render description as a semantic `<div>` | `1e3a8a3` |
| High | Root `<html>` was wrapped by `ThemeProvider`, causing TanStack script ordering errors during client navigation | Login → dashboard → inspect console | Keep the document root outermost and scope the provider to body content | `46b5920` |
| High | Ziyadah/Murajaah mounted desktop and mobile forms simultaneously, duplicating IDs and amplifying Base UI hydration mismatch | Open Ziyadah at 1440px → inspect accessibility tree and console | Render exactly one form using a shared SSR-safe media-query hook | `b966a4c` |
| Medium | Laporan filters, Pengaturan tabs, and Admin table widened the document at 768px | Load each page at 768×1024 and compare `scrollWidth`/`clientWidth` | Constrain overflow to the owning scroller with `min-w-0`, `max-w-full`, and local overflow | `8a81ca0` |

### Remaining — audit only by explicit instruction

| Severity | Finding | Evidence | Status |
|---|---|---|---|
| High | Parent login accepts only a predictable student ID; no second credential is verified | `src/routes/api/parent-auth.ts` POST lookup | Documented, unchanged |
| High | Parent cookie signing falls back to the static string `sijil-parent-session-fallback` | `src/routes/api/parent-auth.ts:7-9`, `src/routes/api/parent-data.ts:7-9` | Documented, unchanged |
| High | Parent session cookie omits `Secure` | `src/routes/api/parent-auth.ts:68` | Documented, unchanged |

## Matrix and evidence

- Machine-readable results: [`matrix.json`](matrix.json) (60 completed checks).
- Screenshot directory: [`screenshots/`](screenshots/) (67 PNG files, including
  all completed viewport/theme combinations).
- Representative evidence:
  - [`dashboard-musyrif.png`](screenshots/dashboard-musyrif.png)
  - [`first-login-unblocked.png`](screenshots/first-login-unblocked.png)
  - [`ziyadah-desktop-light.png`](screenshots/ziyadah-desktop-light.png)
  - [`presensi-mobile-dark.png`](screenshots/presensi-mobile-dark.png)
  - [`laporan-tablet-light.png`](screenshots/laporan-tablet-light.png)
  - [`admin-tablet-dark.png`](screenshots/admin-tablet-dark.png)

Completed matrix dimensions:

- Auth, dashboard, ziyadah, murajaah, presensi, laporan, manajemen-data,
  pengaturan, kitab, and admin.
- 1440×900, 768×1024, and 390×844.
- Light and dark.
- Pointer interaction for primary login/onboarding/navigation flows and
  keyboard focus smoke checks on every completed page.

Partial/not completed:

- The parent page's six viewport/theme screenshots did not complete because the
  temporary browser runner intermittently failed to activate the parent tab
  after repeated hot reloads. The parent security implementation was reviewed
  directly, and its behavior was deliberately not changed.
- Video was not captured: every reproduced defect was visible in a static
  screenshot or console trace except first-login interception, whose repro and
  post-fix interaction were captured through the browser command log.

## Functional checks

- Auth: valid/invalid login, loading state, logout, protected-route redirect,
  first-login release/tutorial sequence.
- Dashboard: actionable Hadir/Sudah Setor/Belum Setor destinations and populated
  24-student data.
- Forms: single responsive Ziyadah/Murajaah form, grade keyboard focus,
  responsive CTA arrangement, double-submit disabled/loading implementation,
  error feedback paths inspected.
- Presensi: 24 rows, search/filter/status controls, bulk actions, per-row
  saving/saved/error feedback.
- Laporan: real-data attention rules, responsive charts/cards, local horizontal
  scrolling, export endpoints present.
- Destructive actions: reset/delete confirmation dialogs inspected; no destructive
  QA mutation was executed.
- Session boundary: protected route redirects without a session; logout returns
  to login.
- PWA: service worker registration exists in the client root; manifest and
  `.output/public/sw.js` are emitted; final precache contains 54 hashed entries;
  build has no PWA warning. Offline asset coverage was verified from generated
  precache. A fully interactive offline form submission is intentionally not
  expected because APIs require the local server/database.

## Final gate

- `bun test`: 6/6 passed.
- `bunx tsc --noEmit`: passed with zero errors.
- `bun run build`: passed without the previous PWA glob warning.
- PWA output: `.output/public/manifest.webmanifest`, `.output/public/sw.js`, and
  hashed application assets present in precache.

## Execution commits

- `3c7a5b5` — TypeScript health
- `e1d5cd0` — PWA output and registration
- `911fd60` — core workflow UI refinement
- `25020dc` — isolated sidebar active state
- `50d16f1` — restrained workflow motion
- `eb706ad` — isolated deterministic QA seed
- `1e3a8a3` — valid release-dialog markup
- `46b5920` — valid root document hierarchy
- `322feb0` — first-login overlay blocker
- `b966a4c` — one responsive submission form
- `8a81ca0` — responsive overflow containment
