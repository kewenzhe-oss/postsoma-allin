# Poker Lab mascot acceptance · 2026-10-03

## Scope
Landing `/` only. App.vue mounts the component only for route name Home; About and Room have no mascot DOM or scheduler. Existing game/training changes preserved. No deployment or Git push performed.

## Runtime
Four modules: senses.js (page/input guards), drives.js (decay and persistence), selection.js (weighted intent), player.js (priority arbitration and combo phases). One 100ms scheduler, one-second drive heartbeat. Rendering uses Vue and CSS transforms with no new dependencies.

## Shared contract
- Canonical plate, original green sprout, anchored double eyes; no cursor tracking, recoloring, bubbles or extra anatomy.
- Stage mobile 118×129px / desktop 132×145px. Half-eye rest, bounded bottom travel16–84%, modest peek, full single-click reveal.
- Breath3400ms, blink5200ms, sprout±6°, hover560ms with150ms leave deduplication.
- Single click: cards fan + branch emphasis + small hop. Double: flinch with both slots recoil. Triple: blush, hide, wait2400ms and recover.
- Direct actions override environmental/autonomous actions. Focused inputs, visible dialogs, fullscreen and document hiding suppress the mascot. Reduced motion disables autonomous movement and CSS animation.
- Wheel40/30/20/10 with duration±20%; energy/curiosity/affection influence selection. Poker review is a rare idle antic after20s, not a scheduled compulsory performance.

## Evidence
- `node scripts/check-mascot.mjs`: 9 temporal checks passed (combo separation/recovery, priorities, guards, visible travel anchor, reduced motion/sleep, hover deduplication, drives/persistence,17skin33slot mapping).
- `npm run build`: passed; existing bundle-size warning remains.
- Browser preview: desktop132×145px and mobile375px viewport118×129px confirmed; all4 rendered PNG layers loaded, original sprout visible. About route mascot count0 observed. Room excluded by the same Home-only mount condition; no live game started for testing.
- Core PNG copies byte-identical to approved mascot_db_A assets; existing four-color penetration-tested skin files used unchanged.
- Provided request includes sections1–4 only. Unprovided sections5–12 are not represented as independently verified requirements.

## Reference mechanisms
[Oneko source](https://github.com/adryd325/oneko.js/blob/main/oneko.js): idle ladder, rare antic, bounded movement and100ms pacing.
[VS Code Pets states](https://github.com/tonybaloney/vscode-pets/blob/main/src/panel/states.ts): separate instance data and state transitions.
The existing PostSoma engine is adapted to Vue; no third-party sprite pipeline or GPL widget code copied.
