# Poker Lab mascot animation optimization · 2026-10-04

- Existing Home-only mount unchanged; About browser check confirms zero mascot DOM. Game routes remain excluded by App.vue's Home-only mount; no game started.
- Blink uses tightly cropped HTML transform layers containing static SVG artwork; same eye geometry/theme,5.2s cadence and120ms offset. Small body/sprout/eye compositing hints; layout/style containment leaves accessories unclipped.
- Pointer proximity sampled100ms with one bounds read. Background stops100ms scheduler; offscreen/guarded/shy_wait CSS loops pause. Foreground recovery continues, preventing hidden recovery deadlock; all observers/timers/listeners disposed on unmount.
- Shy phases own recovery so generic interrupt completion cannot undo the650ms hiding transition; regression includes intermediate ticks.
- Canonical PNG files unchanged. Display WebP derivatives: plate396px,sprout64px,cards144px,branches96px,>=3x actual display. Lossless encoding follows downsampling; original-resolution pixel identity is not claimed. Light1,630,577 ->51,478 bytes; dark1,205,234 ->52,596 bytes. Sizes/anchors/timing unchanged. Existing shadow/blush visuals retained, not claimed cost-free.
-9 mascot checks and Vite production compilation pass. Browser verifies4 assets, HTML eyes, click and About absence. SEO export stages not run; unrelated gameplay/backend in-progress edits preserved. GPU-process CPU reduction not measured.
