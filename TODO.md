# TODO

## Juz calculation model — decision required

**Status:** open · **Raised:** 2026-07-22 · **Affects:** `src/lib/surah-data.ts`, `PRD.md` Z2, `setoran` schema

Three different juz models exist and none of them agree. See the warning box under Z2 in [PRD.md](PRD.md) for the full comparison.

### The measured problem

`getJuzForAyat()` in `src/lib/surah-data.ts` approximates multi-juz surahs by ayat midpoint. Compared against `hitungJuz()` in `index-original.html` across all 1357 ayat of the 8 surahs the original splits:

- **339 ayat (25.0%) return the wrong juz.**
- **Juz 2 and juz 5 can never be returned at all.** The midpoint rule only ever yields a surah's `juzStart` or `juzEnd`, so Al-Baqarah's middle juz (2) and An-Nisa's middle juz (5) are unreachable.
- Al-Baqarah 142 → should be 2, returns 1. Al-Baqarah 200 → should be 2, returns 3. An-Nisa' 100 → should be 5, returns 6.

Juz is the unit siswa progress is reported in, so this is user-visible: a student who memorises Al-Baqarah 142–252 — exactly juz 2 — is recorded under juz 1 or 3.

### Tasks

- [ ] **Decide the model:** page-based (`Math.ceil(page / 20)`, as PRD Z2 claims) vs surah + ayat with split points (as both `index-original.html` and the current `surah-data.ts` shape assume).
- [ ] If surah + ayat: port the split table from `hitungJuz()` into `surah-data.ts` — drop-in replacement below.
- [ ] If page-based: `surah-data.ts` has no `page` field at all; a page↔surah mapping table would have to be added first, and `getJuzForAyat` retired.
- [ ] Reconcile the `setoran` schema (`page_start`/`page_end` + `juz`, PRD line ~185) with whichever model wins — today it stores pages while both implementations record surah + ayat.
- [ ] Update PRD Z2 to state the chosen model, and remove the "preserved from original" claim either way.
- [ ] Add a regression test pinning a few known boundaries (Al-Baqarah 141/142, 252/253; An-Nisa' 23/24, 147/148).

### Drop-in replacement for Option B

Transcribed from `hitungJuz()` in `index-original.html`. The original returns a `{start, end}` range because it accepts an ayat *range*; this keeps the single-ayat signature and adds a range variant.

```ts
// Exact juz split points, ported from hitungJuz() in index-original.html.
// Only these 8 surahs need ayat-level resolution; every other multi-juz surah
// in SURAH_DATA is unambiguous at surah granularity.
const JUZ_SPLITS: Record<string, (ayat: number) => number> = {
  "Al-Baqarah": a => (a <= 141 ? 1 : a <= 252 ? 2 : 3),
  "Ali 'Imran": a => (a <= 92 ? 3 : 4),
  "An-Nisa'":   a => (a <= 23 ? 4 : a <= 147 ? 5 : 6),
  "Al-Ma'idah": a => (a <= 81 ? 6 : 7),
  "Al-An'am":   a => (a <= 110 ? 7 : 8),
  "Al-A'raf":   a => (a <= 87 ? 8 : 9),
  "Al-Anfal":   a => (a <= 40 ? 9 : 10),
  "At-Taubah":  a => (a <= 92 ? 10 : 11),
}

export function getJuzForAyat(surahName: string, ayatNumber: number): number {
  const surah = findSurah(surahName)
  if (!surah) return 0
  if (surah.juzStart === surah.juzEnd) return surah.juzStart
  const split = JUZ_SPLITS[surah.name]
  return split ? split(ayatNumber) : surah.juzStart
}

/** Juz range covered by an ayat span, mirroring the original's lintas-surah handling. */
export function getJuzRange(surahName: string, from: number, to: number): [number, number] {
  const a = getJuzForAyat(surahName, Math.min(from, to))
  const b = getJuzForAyat(surahName, Math.max(from, to))
  return [Math.min(a, b), Math.max(a, b)]
}
```

Not applied — this changes app behaviour and the model decision is yours to make.
