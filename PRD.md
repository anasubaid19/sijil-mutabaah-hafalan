# PRD: Sijil Mutaba'ah — Full-Stack Rewrite

## 1. Executive Summary

### Problem Statement

Sijil Mutaba'ah is a Quran memorization tracking app currently built as a single-file HTML app (`index.html`, ~1469 lines) with localStorage persistence. It works for one musyrif on one device, but cannot support multiple users, data is lost on cache clear, and there is no way for wali (parents) to view their children's progress. The app needs to become a multi-user, multi-device, production-grade web application.

### Proposed Solution

Rewrite from scratch as a full-stack TanStack Start application with:

- **TanStack Start** (file-based SSR/SSG routing, `createServerFn` for server functions)
- **Neon PostgreSQL** (serverless Postgres, `@neondatabase/serverless` driver for Bun)
- **Drizzle ORM** (type-safe schema + migrations)
- **Better Auth** (email/password authentication, session management, role-based access)
- **shadcn/ui** (component library via `uikit/` reference — uses `@base-ui/react`, NOT Radix)
- **Biome** (linting + formatting, config from `uikit/biome.json`)

Self-hosted deployment on VPS.

### Success Criteria

| KPI | Target |
|-----|--------|
| Feature parity with original app | 100% of existing features work identically |
| Multi-user support | Unlimited musyrif, each with own halaqah |
| Wali (parent) access | Read-only dashboard + laporan for linked siswa |
| Data persistence | Zero data loss (PostgreSQL vs localStorage) |
| Responsive design | Mobile-first, works on phones, tablets, desktops |
| Lighthouse Accessibility | >= 90 |
| Page load (LCP) | < 2s on 3G |

---

## 2. User Experience & Functionality

### User Personas

| Persona | Role | Access |
|---------|------|--------|
| **Musyrif** | Quran teacher, manages halaqah | Full CRUD: setup, dashboard, ziyadah, murajaah, laporan, pengaturan |
| **Wali** | Parent of a siswa | Read-only: dashboard (overview), laporan (detail for linked siswa only) |

### User Stories & Acceptance Criteria

#### Authentication & Onboarding

| # | Story | AC |
|---|-------|----|
| A1 | As a new musyrif, I want to register with email + password so I can create my account | - Email/password registration via Better Auth<br>- Password min 8 chars<br>- Email verification (optional, configurable) |
| A2 | As a musyrif, I want to log in so I can access my halaqah | - Email + password login<br>- Session persisted via HTTP-only cookie<br>- "Remember me" checkbox |
| A3 | As a musyrif, I want to set up my halaqah after first login | - Name halaqah<br>- Add initial siswa (1..n) with name + start page<br>- Must complete setup before accessing dashboard |

#### Dashboard

| # | Story | AC |
|---|-------|----|
| D1 | As a musyrif, I want to see an overview of my halaqah stats | - Total siswa count<br>- Active this week (setoran in last 7 days)<br>- Average progress %<br>- Students needing attention (no setoran in 7+ days) |
| D2 | As a musyrif, I want to see a weekly activity chart | - Bar chart: setoran count per day (last 7 days)<br>- Uses recharts (already in uikit deps) |
| D3 | As a musyrif, I want to see recent activity | - Last 10 setoran entries<br>- Shows: siswa name, surah, ayat, type (ziyadah/murajaah), timestamp |
| D4 | As a musyrif, I want to see per-siswa progress | - Progress bar: current page / total pages (604)<br>- Sorted by most recent activity |
| D5 | As a musyrif, I want to see attention-needed list | - Siswa with no setoran in 7+ days<br>- Sorted by days since last setoran (descending) |

#### Ziyadah (New Memorization)

| # | Story | AC |
|---|-------|----|
| Z1 | As a musyrif, I want to record new memorization for a siswa | - Select siswa (autocomplete/search)<br>- Select surah (autocomplete from 114 surah)<br>- Select page range (auto-calculate juz from page)<br>- Toggle: lintas surah (cross-surah)<br>- Toggle: mutqin (perfect memorization)<br>- Grade: Mumtaz / Jayyid Jiddan / Jayyid / Maqbul |
| Z2 | As a musyrif, I want auto-calculation of juz from page | - ⚠️ See contradiction note below — this AC does not match the original, and neither matches the current rewrite |
| Z3 | As a musyrif, I want to optionally add murajaah in the same flow | - "Tambah Murajaah" toggle in ziyadah form<br>- If on: shows murajaah fields inline |

> [!warning] Z2 contradiction — three different juz models, none agreeing
>
> This AC originally read: `Math.ceil(page / 20)` formula preserved from original. That claim is false, and there are in fact **three** models in play:
>
> | Where | Model | Input |
> |---|---|---|
> | **This PRD** | `Math.ceil(page / 20)` | page number |
> | **`index-original.html` → `hitungJuz()`** | lookup table with exact ayat split points for 8 multi-juz surahs, returns a `{start, end}` range | surah + ayat |
> | **`src/lib/surah-data.ts` → `getJuzForAyat()`** | midpoint approximation: `ayat <= ayatCount/2 ? juzStart : juzEnd` | surah + ayat |
>
> The original never had a page-based formula. It derives juz from surah + ayat with hard-coded split points (Al-Baqarah ≤141→1, ≤252→2, else 3; An-Nisa' ≤23→4, ≤147→5, else 6; and similar for Ali 'Imran, Al-Ma'idah, Al-An'am, Al-A'raf, Al-Anfal, At-Taubah).
>
> **The rewrite's approximation is measurably wrong.** Comparing `getJuzForAyat()` against `hitungJuz()` across every ayat of the 8 split surahs (1357 ayat):
>
> - **339 ayat (25.0%) return the wrong juz.**
> - **Juz 2 and juz 5 are unreachable** — the midpoint rule can only ever return a surah's first or last juz, so no ayat of Al-Baqarah can be classified as juz 2, and none of An-Nisa' as juz 5.
> - Examples: Al-Baqarah ayat 142 → original `2`, rewrite `1`. Al-Baqarah ayat 200 → original `2`, rewrite `3`. An-Nisa' ayat 100 → original `5`, rewrite `6`.
>
> This matters because juz is the unit siswa progress is reported in. A student who memorises Al-Baqarah 142–252 — exactly juz 2 — is recorded under juz 1 or juz 3.
>
> Note also that the schema at line 185 stores `page_start`/`page_end` + `juz`, while both the original and the rewrite record surah + ayat. The data models are not equivalent.
>
> **Decision required** — tracked in [TODO.md](TODO.md):
> - **Option A — page-based (this PRD as written).** Simpler, matches the stored schema, but discards ayat-level precision and contradicts both existing implementations.
> - **Option B — surah + ayat with the original's split table (recommended).** Restores parity with the app being replaced, fixes the 25% error, and needs roughly ten lines ported into `surah-data.ts`.

#### Murajaah (Review)

| # | Story | AC |
|---|-------|----|
| M1 | As a musyrif, I want to record review sessions | - Select siswa<br>- Select jenis: Fardi (individual), Bersama (group), Tasmi' Mutqin<br>- Select pages reviewed<br>- Grade |

#### Laporan (Reports)

| # | Story | AC |
|---|-------|----|
| L1 | As a musyrif, I want to view laporan in grid or list view | - Toggle grid/list<br>- Grid: card per siswa with avatar, name, progress, grade badge<br>- List: table row per siswa |
| L2 | As a musyrif, I want to see monthly insight | - This month vs last month comparison<br>- Total setoran, average grade, pages completed |
| L3 | As a musyrif, I want to export laporan as PDF | - Uses html2pdf.js (or equivalent)<br>- Includes: siswa name, halaqah, date range, setoran history |
| L4 | As a musyrif, I want to export laporan as CSV | - Columns: Nama, Juz, Surah, Halaman, Tanggal, Tipe, Grade |
| L5 | As a musyrif, I want to view per-siswa detail | - Click siswa card → modal/page with full setoran history<br>- Bar chart: setoran per week<br>- Grade distribution |

#### Pengaturan (Settings)

| # | Story | AC |
|---|-------|----|
| S1 | As a musyrif, I want to export all my data as JSON backup | - Downloads complete halaqah data as JSON file |
| S2 | As a musyrif, I want to import data from JSON backup | - Upload JSON → validate → replace current data<br>- Confirmation dialog before overwrite |
| S3 | As a musyrif, I want to clear all data | - Confirmation dialog (type "HAPUS" to confirm)<br>- Irreversible action |
| S4 | As a musyrif, I want to edit my profile | - Update name, email |
| S5 | As a musyrif, I want to reset to demo data | - Loads preset sample data for testing |

#### Wali (Parent) Access

| # | Story | AC |
|---|-------|----|
| W1 | As a wali, I want to view my child's progress | - Dashboard shows only linked siswa<br>- Laporan filtered to linked siswa only<br>- No edit/delete access |
| W2 | As a musyrif, I want to link wali to siswa | - In siswa management: add wali email<br>- Wali receives invitation (optional) |

#### Dark Mode

| # | Story | AC |
|---|-------|----|
| DM1 | As a user, I want to toggle dark mode | - System/light/dark toggle<br>- Persisted in localStorage (or cookie)<br>- Uses `next-themes` (already in uikit) |

#### Responsive Design

| # | Story | AC |
|---|-------|----|
| R1 | As a mobile user, I want a bottom navigation bar | - 5 tabs: Dashboard, Ziyadah (+), Murajaah, Laporan, Pengaturan<br>- Ziyadah as FAB (floating action button) |
| R2 | As a desktop user, I want a sidebar navigation | - Fixed sidebar (280px) with all nav items<br>- Collapsible on tablet |
| R3 | As a user, I want the app to work offline (read-only) | - Service worker for cached pages<br>- Show "offline" banner |

### Non-Goals (v1)

- Real-time sync (WebSocket) — future v2
- Push notifications — future v2
- Multi-language (i18n) — Indonesian only for v1
- Native mobile app (PWA is sufficient)
- Payment/subscription system
- Admin panel for super-user

---

## 3. Technical Specifications

### Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                    Browser                       │
│  TanStack Start (SSR) + React 19 + shadcn/ui   │
│  Service Worker (offline cache)                  │
└──────────────────┬──────────────────────────────┘
                   │ HTTP (cookie session)
┌──────────────────▼──────────────────────────────┐
│              TanStack Start Server               │
│  createServerFn() for all data operations        │
│  Better Auth middleware (session validation)      │
└──────────────────┬──────────────────────────────┘
                   │ neon-serverless driver (WebSocket)
┌──────────────────▼──────────────────────────────┐
│           Neon PostgreSQL (serverless)            │
│  Drizzle ORM schema + migrations                 │
└─────────────────────────────────────────────────┘
```

### Database Schema

```sql
-- Users (Better Auth manages auth, we store profile)
CREATE TABLE user_profile (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL UNIQUE REFERENCES auth.users(id),
  name        TEXT NOT NULL,
  halaqah_name TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Siswa (students)
CREATE TABLE siswa (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id),
  name         TEXT NOT NULL,
  start_page   INTEGER DEFAULT 1,
  current_page INTEGER DEFAULT 1,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- Setoran (memorization records)
CREATE TABLE setoran (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  siswa_id    UUID NOT NULL REFERENCES siswa(id),
  user_id     UUID NOT NULL REFERENCES auth.users(id),
  type        TEXT NOT NULL CHECK (type IN ('ziyadah', 'murajaah')),
  surah       INTEGER NOT NULL CHECK (surah BETWEEN 1 AND 114),
  page_start  INTEGER NOT NULL,
  page_end    INTEGER NOT NULL,
  juz         INTEGER NOT NULL CHECK (juz BETWEEN 1 AND 30),
  grade       TEXT CHECK (grade IN ('mumtaz', 'jayyid_jiddan', 'jayyid', 'maqbul')),
  is_lintas   BOOLEAN DEFAULT false,
  is_mutqin   BOOLEAN DEFAULT false,
  murajaah_type TEXT CHECK (murajaah_type IN ('fardi', 'bersama', 'tasmi_mutqin')),
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Wali links (parent-student relationship)
CREATE TABLE wali_link (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wali_id   UUID NOT NULL REFERENCES auth.users(id),
  siswa_id  UUID NOT NULL REFERENCES siswa(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(wali_id, siswa_id)
);

-- Presensi (attendance, future use)
CREATE TABLE presensi (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  siswa_id   UUID NOT NULL REFERENCES siswa(id),
  user_id    UUID NOT NULL REFERENCES auth.users(id),
  date       DATE NOT NULL,
  status     TEXT NOT NULL CHECK (status IN ('hadir', 'tidak_hadir', 'izin')),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Integration Points

| System | Purpose | Package |
|--------|---------|---------|
| Neon PostgreSQL | Primary database | `@neondatabase/serverless` |
| Drizzle ORM | Schema, migrations, queries | `drizzle-orm`, `drizzle-kit` |
| Better Auth | Authentication, sessions | `better-auth` |
| shadcn/ui (base-ui) | UI components | `@base-ui/react` (from uikit) |
| Hugeicons | Icon library | `@hugeicons/react` |
| Recharts | Charts (weekly activity, progress) | `recharts` |
| next-themes | Dark mode | `next-themes` |
| Biome | Lint + format | `@biomejs/biome` |

### Security & Privacy

- Passwords hashed by Better Auth (bcrypt/argon2)
- Sessions: HTTP-only cookies, SameSite=Lax
- RLS (Row-Level Security): all queries filtered by `user_id`
- Wali can only read linked siswa data
- No PII logged
- CSRF protection via Better Auth

---

## 4. AI Agent Skill Usage Guide

This section defines **which skills to use at each phase** and **when to invoke them**. Every agent working on this codebase MUST follow these guidelines.

### Phase 0: Scaffolding & Project Setup

| Skill | When to Use |
|-------|-------------|
| **ponytail** | Active EVERY response. Enforce minimal dependencies. Don't add packages that can be avoided. Use stdlib where possible. |
| **find-docs** | Before adding any new dependency, check if it already exists or if stdlib covers it. |
| **context7** | When setting up TanStack Start, Better Auth, Drizzle — fetch latest docs to avoid stale patterns. |

**Rules for Phase 0:**
- `ponytail` level: **full** — question every dependency, prefer stdlib
- Don't add recharts yet — add only when chart component is built
- Don't add motion — add only when animation is needed
- Use `bun` for all package management (per CLAUDE.md)
- Biome config: copy from `uikit/biome.json` verbatim

### Phase 1: Database & Auth

| Skill | When to Use |
|-------|-------------|
| **context7** | Fetch Drizzle ORM + Neon docs before writing schema/migrations |
| **context7** | Fetch Better Auth docs before configuring auth |
| **find-docs** | If unsure about Drizzle syntax or Better Auth plugin API |
| **ponytail** | Don't build custom auth — use Better Auth's built-in email/password. Don't add OAuth providers yet (YAGNI). |

### Phase 2: Layout & Navigation

| Skill | When to Use |
|-------|-------------|
| **apple-design** | Before building the sidebar + bottom nav — read for spring animations, gesture patterns, responsive breakpoints |
| **ui-ux-pro-max** | For design decisions: color palette, spacing, typography, dark mode tokens |
| **frontend-design** | When building the layout shell — for high-quality, polished UI |
| **ponytail** | Copy sidebar from `uikit/src/components/ui/sidebar.tsx` — don't rebuild it. Copy `ToggleTheme` as-is. |

**Apple Design Specifics:**
- Sidebar transitions: use `cubic-bezier(0.25, 0.1, 0.25, 1)` (Apple ease)
- Bottom nav: iOS-style tab bar with spring feedback on tap
- Dark mode: match Apple's dimming curve, not just CSS class toggle
- Haptic feedback concept: visual "press" state with scale(0.97) + quick spring back

### Phase 3: Core Pages (Dashboard, Ziyadah, Murajaah)

| Skill | When to Use |
|-------|-------------|
| **apple-design** | For card hover states, list transitions, micro-interactions |
| **ui-ux-pro-max** | For chart design, data visualization, color usage in badges |
| **frontend-design** | When building complex page layouts (dashboard grid, forms) |
| **ponytail** | Don't build custom autocomplete — use `@base-ui/react` Combobox from uikit. Don't build custom select — use uikit's Select. |
| **error-handling** | For form validation patterns — use typed errors, not try/catch walls |
| **context7** | Before using recharts API — fetch docs for current API surface |

### Phase 4: Laporan & Reports

| Skill | When to Use |
|-------|-------------|
| **tabel-pro** | When building CSV export — use for spreadsheet formatting, auto-fit columns, number formatting |
| **ui-ux-pro-max** | For card grid/list toggle design, modal layouts |
| **frontend-design** | For the laporan detail modal with charts |
| **ponytail** | PDF export: use `html2canvas` + `jsPDF` (2 deps) — not a 5-dependency PDF library. CSV: manual string builder, don't add a CSV lib. |

### Phase 5: Settings & Data Management

| Skill | When to Use |
|-------|-------------|
| **ponytail** | JSON export = `JSON.stringify()` + `Blob` + `URL.createObjectURL`. Import = `<input type="file">` + `JSON.parse()`. No library needed. |
| **error-handling** | For import validation — validate JSON schema before importing, show clear error messages |
| **investigate** | If import/export has bugs — use systematic debugging |

### Phase 6: Wali (Parent) Access

| Skill | When to Use |
|-------|-------------|
| **ponytail** | This is just RLS (Row-Level Security) + filtered queries. No new abstractions needed. |
| **frontend-design** | For the wali dashboard (read-only, simplified view) |

### Phase 7: Polish & Responsive

| Skill | When to Use |
|-------|-------------|
| **apple-design** | For all animations: page transitions, card entrances, bottom nav spring, sidebar collapse |
| **find-animation-opportunities** | Scan the built UI for places that should animate but don't |
| **review-animations** | After animations are added — review against craft bar |
| **ui-ux-pro-max** | For responsive breakpoints, mobile-first adjustments |
| **web-design-guidelines** | Final accessibility + UX audit |

### Phase 8: Testing & QA

| Skill | When to Use |
|-------|-------------|
| **investigate** | When tests fail — systematic root-cause debugging |
| **ai-regression-testing** | For testing AI-written code — catch blind spots |
| **systematic-debugging** | For any bug found during QA |
| **e2e-testing** | If building E2E tests — Playwright patterns |

### Phase 9: Security & Deployment

| Skill | When to Use |
|-------|-------------|
| **security-audit** | Before deployment — full security scan |
| **production-audit** | Pre-launch readiness check |

### Phase 10: Documentation & Final Review

| Skill | When to Use |
|-------|-------------|
| **code-review** | Final code review before merge/deploy |
| **ponytail-review** | Scan for over-engineering — what can be deleted? |

### Universal Rules (ALL Phases)

1. **ponytail is ALWAYS active** — every response, no exceptions. Question whether new code needs to exist. Reuse uikit components. Don't add dependencies for things a few lines can do.

2. **context7 before any library API** — even if you think you know it. Training data is stale. Always verify.

3. **apple-design for ALL animations** — never use generic CSS transitions for user-facing motion. Read the skill, pick 2-3 rules, compose them.

4. **No ASCII art, no placeholder diagrams** — use Mermaid for flowcharts, TikZ concepts for data viz if needed.

5. **Every file edit runs through ponytail's ladder:**
   - Does this need to exist?
   - Does uikit already have this component?
   - Can stdlib do it?
   - Can it be one line?
   - Only then: write the minimum.

---

## 5. Technical Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Neon serverless cold start latency | Dashboard load > 2s | Use connection pooling (`@neondatabase/serverless` pool), edge functions |
| Better Auth learning curve | Auth phase takes 2x longer | Fetch docs via context7 early, use email/password only (no OAuth) |
| base-ui vs Radix confusion | Wrong component APIs used | Always import from `uikit/src/components/ui/`, never from Radix |
| Data migration from localStorage | Users lose existing data | Build import tool first, provide migration guide |
| Service worker caching stale assets | Users see old version | Versioned cache names, `skipWaiting()` on activate |

---

## 6. Phased Rollout

### MVP (v0.1) — Weeks 1-3

- [ ] Project scaffold (TanStack Start + Neon + Drizzle + Biome)
- [ ] Auth (register, login, logout, session)
- [ ] Setup page (halaqah + siswa onboarding)
- [ ] Dashboard (stats, weekly chart, recent activity)
- [ ] Ziyadah form (with all fields)
- [ ] Murajaah form
- [ ] Dark mode

### v0.2 — Weeks 4-5

- [ ] Laporan (grid/list, monthly insight, per-siswa detail)
- [ ] PDF export
- [ ] CSV export
- [ ] Pengaturan (backup/import/clear)
- [ ] Responsive: bottom nav + sidebar

### v0.3 — Week 6

- [ ] Wali (parent) access + link system
- [ ] Presensi (attendance) tracking
- [ ] Offline support (service worker)
- [ ] Security audit
- [ ] Production deployment

---

## 7. File Structure

```
sijil-mutabaah/
├── app/
│   ├── routes/
│   │   ├── __root.tsx              # Root layout (ThemeProvider, Sidebar)
│   │   ├── _authenticated/         # Auth-protected layout
│   │   │   ├── dashboard.tsx
│   │   │   ├── ziyadah.tsx
│   │   │   ├── murajaah.tsx
│   │   │   ├── laporan.tsx
│   │   │   └── pengaturan.tsx
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── setup.tsx
│   ├── components/
│   │   ├── ui/                     # Copied from uikit/src/components/ui/
│   │   ├── layout/
│   │   │   ├── sidebar.tsx         # Adapted from uikit sidebar
│   │   │   ├── header.tsx
│   │   │   └── bottom-nav.tsx
│   │   ├── dashboard/
│   │   ├── ziyadah/
│   │   ├── murajaah/
│   │   ├── laporan/
│   │   └── pengaturan/
│   ├── lib/
│   │   ├── auth.ts                 # Better Auth config
│   │   ├── db/
│   │   │   ├── index.ts            # Drizzle client
│   │   │   ├── schema.ts           # All table definitions
│   │   │   └── migrations/
│   │   ├── utils.ts                # cn() from uikit
│   │   └── quran-data.ts           # 114 surah data, juz calculation
│   ├── hooks/
│   │   └── use-mobile.ts           # From uikit
│   └── styles.css                  # Adapted from uikit (remap primary to teal)
├── public/
│   ├── manifest.json
│   └── sw.js
├── biome.json                      # From uikit/biome.json
├── drizzle.config.ts
├── package.json
├── tsconfig.json
├── vite.config.ts
└── index.html
```

---

*Last updated: 2026-07-20*
