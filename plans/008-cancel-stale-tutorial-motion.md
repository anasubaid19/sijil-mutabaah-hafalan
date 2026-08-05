# 008 - Cancel Stale Tutorial Step Motion

- **Status**: DONE
- **Commit**: bac7a3c
- **Severity**: MEDIUM
- **Category**: Interruptibility
- **Estimated scope**: 1 file, one effect cleanup guard

## Problem

Tutorial step changes schedule delayed async work. Cleanup clears the timeout, but once the timeout has started, `waitForEl()` and `ensureVisible()` can finish after the user has already advanced to another step and then write the old step's `target`, `cardH`, `viewport`, or `anim` state.

Current code:

```tsx
// src/components/tutorial-overlay.tsx:401-423
useEffect(() => {
  setAnim("out");
  const t1 = setTimeout(async () => {
    const s = steps[step];
    const id = s?.navId ?? null;
    if (!id) {
      setTarget(null);
    } else {
      const resolveId = window.innerWidth < 768 ? (s.mobileNavId ?? id) : id;
      const el = await waitForEl(resolveId);
      if (el) {
        await ensureVisible(el);
        setTarget(el.getBoundingClientRect());
      } else {
        setTarget(null);
      }
    }
    setCardH(cardRef.current?.offsetHeight ?? MIN_CALLOUT_H);
    setViewport(getViewport());
    setAnim("in");
  }, 220);
  return () => clearTimeout(t1);
}, [step, steps]);
```

Rapidly pressing `Selanjutnya` can therefore show a spotlight from an earlier step or let an earlier scroll complete after the current step has changed. CSS transitions cannot correct stale asynchronous state.

## Target

Add a per-effect cancellation flag and guard every state write after the delayed/async boundaries:

```tsx
useEffect(() => {
  let cancelled = false;
  setAnim("out");
  const t1 = setTimeout(async () => {
    const s = steps[step];
    const id = s?.navId ?? null;
    if (cancelled) return;
    if (!id) {
      setTarget(null);
    } else {
      const resolveId = window.innerWidth < 768 ? (s.mobileNavId ?? id) : id;
      const el = await waitForEl(resolveId);
      if (cancelled) return;
      if (el) {
        await ensureVisible(el);
        if (cancelled) return;
        setTarget(el.getBoundingClientRect());
      } else {
        setTarget(null);
      }
    }
    if (cancelled) return;
    setCardH(cardRef.current?.offsetHeight ?? MIN_CALLOUT_H);
    setViewport(getViewport());
    setAnim("in");
  }, 220);
  return () => {
    cancelled = true;
    clearTimeout(t1);
  };
}, [step, steps]);
```

The existing 220ms delay, target lookup, scrolling behavior, and animation values remain unchanged. The only new behavior is that obsolete step work stops applying state.

## Repo conventions to follow

- `src/routes/_authed.tsx:45-51` cleans up a browser event listener in `useEffect`; preserve the same effect-local cleanup style.
- `src/components/tutorial-overlay.tsx:246-286` already isolates asynchronous waiting helpers; do not replace them with a new animation library.
- `src/lib/styles.css:237-245` owns global reduced-motion handling; this plan does not change it.

## Steps

1. Add `let cancelled = false` at the start of the effect.
2. Add a guard immediately before the delayed callback performs work.
3. Add a guard after `waitForEl()` resolves and after `ensureVisible()` resolves.
4. Add a guard before `setCardH`, `setViewport`, and `setAnim("in")`.
5. Set `cancelled = true` in the cleanup before clearing the timeout.
6. Do not change `waitForEl`, `ensureVisible`, placement math, or step copy.

## Boundaries

- Do not change tutorial layout, delays, easing, or visual design.
- Do not add an abort-controller dependency or animation library.
- Do not suppress the current step's own async work after it remains current.
- If the effect signature or helper contracts have drifted, stop and report instead of improvising.

## Verification

- **Mechanical**: run `bun run build`; expected result: success. Search the effect for guards after both `await` expressions and cleanup assignment before `clearTimeout`.
- **Interruptibility feel check**: open the tutorial, press `Selanjutnya` rapidly three to five times, including while a navigation target is scrolling. Confirm the final visible spotlight and card correspond only to the final step.
- **Slow motion**: set DevTools animation playback to 10% and advance/retreat steps quickly; confirm no earlier target snaps back into view.
- **Reduced motion**: enable reduced motion and repeat rapid steps; confirm movement is suppressed by the existing global rule and stale state still never appears.
- **Done when**: no obsolete step can update spotlight, card size, viewport, or enter state after a newer step begins.
