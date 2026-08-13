# 009 — Refined Workflow State Feedback

- **Status**: DONE
- **Severity**: MEDIUM
- **Category**: State comprehension / Accessibility
- **Estimated scope**: 3 files, class and timeout edits only

## Finding

The refined grade selector and attendance controls already limit transitions to
color, border, and shadow, but they rely on an implicit duration. The new
attendance save acknowledgement mounts without a short entrance cue, and the
actionable submission toast expires before every user can reach its actions.

## Target

1. Use the existing 150ms fast token for the grade and attendance state changes.
2. Fade the per-row save acknowledgement in over 150ms without movement.
3. Keep the actionable submission toast open until dismissed or an action is
   chosen.
4. Preserve the existing global reduced-motion behavior: no transforms or layout
   movement; color, border, opacity, and shadow feedback remains available.

## Boundaries

- Do not animate route changes, page containers, layout, width, or height.
- Do not add bounce, scale, or decorative motion.
- Do not change attendance persistence or submission business logic.
- Do not add a motion dependency or duplicate component.

## Verification

- Run `bun test`, `bunx tsc --noEmit`, and `bun run build`.
- Change attendance status rapidly and confirm selected state is immediate and
  the saved acknowledgement fades in once.
- Change grades using mouse and keyboard and confirm focus/selected states remain
  clear.
- Enable reduced motion and confirm no positional movement is introduced.

