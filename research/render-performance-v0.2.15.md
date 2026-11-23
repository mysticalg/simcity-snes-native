# Rendering optimisation, v0.2.15

The reported slowdown was reproduced with a deterministic 289-zone city, 3,375 visible water cells, 1,530 contaminated water cells, 128 cars and night/rain effects. The supplied original artwork remains selected. There is no simulation-speed reduction in this change.

## Measurements

Same Windows machine and local Chromium executable, sequential runs. The original four renderer/app modules were intercepted from commit 339f219 for the baseline; the fixture, assets, viewport and runner stayed the same. The weather module only differs in dependency cache versions. Individual rendering slices use warmed canvases and 30 synchronous submissions. A separate five-second running-app CPU profile measures requestAnimationFrame callback duration. These measurements include JavaScript and rendering submission costs, not final GPU/display frame presentation; they do not establish FPS on the user's active device. Background system load was not controlled. Other repeated candidate runs measured typical callbacks around 6 ms, illustrating timing variability.

| Work | Baseline median / p95 | v0.2.15 median / p95 |
| --- | --- | --- |
| Complete night/rain visual-effect pass | 220 / 620.8 ms | 6.7 / 9.6 ms |
| Running-app animation callback | 39.3 / 62.1 ms | 3.2 / 12 ms |
| Maximum full-map paints per callback | 3 | 1 |

Early diagnostics counted every full-canvas fill, including haze. The final paint counter filters the map-clearing colour so it counts actual map paints. Raw samples and profiler summaries: [render-performance-v0.2.15.json](render-performance-v0.2.15.json).

## Changes

- Bake native window glow into a small per-building canvas. Individual windows still change brightness during their original three-second fade, sampled at 16 fade steps, and stop animating while paused. No per-window shadow filter runs on the display canvas each frame.
- Crop photoreal day/night frames once into reusable 128-pixel sprites and bake their window bloom once per archetype/footprint size. This covers up to the current 4× zoom resolution. Original full-resolution atlases are preserved.
- Cache water texture patterns and softened pollution masks. Rebuild masks only when contamination values change; skip contamination passes on clean water and reuse the complete surface when visual time/view are unchanged. Wind still integrates over time, shoreline clipping remains exact, and contaminated water remains brown.
- Cache original city-map cells until their displayed tile, overlay colour or seasonal palette changes. Animation invalidates only tiles using original VRAM transfer range $360–$3FF, from cityAnimationTransfers. New cities and changed map dimensions invalidate the cache.
- Combine all paint requests inside an animation callback into one final map draw. Simulation ticks, moving vehicles, visual clocks and immediate input paints are retained.
- Reuse build/drag placement plans until city revision, funds, cursor or draw settings change. Large blueprints no longer repeat the same map-copy/validation work on every ambient animation paint.

## Verification

341 Node assertions passed, including tile-cache invalidation. Browser checks passed for cache reuse/invalidation, water motion and pause stability, clean/dirty water colour and shore clipping, intact/damaged photoreal art, power-dependent window glow, weather particles, smooth/pinch zoom, 792-zone drag previews and release placement, fill-available preservation, budget/session/region restore and mobile dialog fit. No page errors were observed. The budget/session check now waits for the existing smooth zoom animation to settle before capturing its expected restored value.

Reproduce:

~~~powershell
node tools/profile-rendering.mjs output/render-before.json --baseline
node tools/profile-rendering.mjs output/render-after.json
node tools/check-render-caches.mjs
node tools/check-realistic-art.mjs
node tools/check-weather-fx.mjs
node tools/check-smooth-zoom.mjs
node tools/check-zone-blocks.mjs
node tools/check-budget-session.mjs
node --test tests/*.test.js
~~~

The original-ROM reconstruction remains incomplete; this release improves the player-requested rendering extensions and does not establish full simulation, interface or audio parity.
