# Bounded building-transition captures, v0.2.54

Profiling a powered 240×200 city at 16× speed, with night, rain, photoreal art
and high effects quality, identified repeated map scans in building transitions.
Each old/new building image called the pollution, elevation and shoreline
renderers for the whole map even though its canvas typically held nine cells.
The canvas clipped the output, but JavaScript still inspected all 48,000 cells
for each overlay and each capture.

## Change

`BuildingEffects` supplies its existing capture rectangle to these three
renderers. `tileDrawBounds` conservatively clips the cells to the map; elevation
and shoreline calculations still read original neighbors outside that rectangle.
Pollution checks the live map and pollution bytes inside the capture and draws
only that portion of its existing shared texture. A later whole-map call still
checks the entire map, so direct edits, monthly array replacements, terraforming
and restores cannot leave stale visible data. Cached aggregate counters during
partial updates describe the cached cells; building captures do not consume them.

Full-map callers retain their normal rendering. Transition duration, event caps,
growth rules, simulation steps, vehicles, quality and photoreal assets are
unchanged. The existing cache remains weakly owned by each city. Canonical
module URLs are updated together for returning browsers.

## Pixel and behavior verification

The comparison is against the previous **browser release**, `5da6f43`, not a
claim of additional original-ROM pixel fidelity.

* 312 terrain/pollution capture comparisons pass, including map edges, four
  zoom factors (0.5, 1, 1.375 and 2), and direct mutable-array edits.
* Eight actual city steps produce 1,294 old/new transition images. All
  2,981,376 compared RGBA channels match the previous renderer.
* All 80 complete transition-frame comparisons match, including growth,
  overlapping images, scale/fade stages and expiry. Event metadata matches.
  Rendering does not alter serialized simulation state.
* Focused Node checks verify clipping and preservation of north/west elevation
  shading while a one-cell capture reads only that cell and its two neighbors.
* 549 Node tests pass. Actual app growth, shrink, repeated changes, construction,
  demolition expiry, wind overhang, pause, disabled buildings and traffic/power
  invariants pass. Art, lights, water/shore/pollution, utilities, outages, edited
  pipe networks, weather, overlays and session-reload checks also pass.

## Measurements

Runs were sequential on the same local browser and hardware. These are elapsed
JavaScript/render-submission measurements, **not player-display FPS**.

| Workload | Before | After |
| --- | ---: | ---: |
| 96 simultaneous building transitions, median of seven captures | 104.8 ms | 8.5 ms |
| Same capture workload, slowest of seven | 107.3 ms | 9.5 ms |
| Fixed 300-frame city run, p95, pair 1 | 97.7 ms | 84.3 ms |
| Fixed 300-frame city run, p95, pair 2 (reverse order) | 95.4 ms | 78.8 ms |
| Fixed city run, median, pair 1 | 18.1 ms | 19.1 ms |
| Fixed city run, median, pair 2 | 17.8 ms | 18.2 ms |

All four controlled city runs painted 300 times, advanced to simulation step
106 and visual frame 4,800, and produced exactly the same full-save SHA-256:
`808f65910eec5d5d8673c8be3498576a5832ddd1ec6cf6c9fb221efa29e1393e`.

Ordinary five-second runs also improved, but their elapsed simulation states
differ, so they are not equivalent-state benchmarks. Callback median changed
109.0→81.6 ms and 112.2→81.4 ms; p95 changed 156.2→104.3 ms and
146.3→115.8 ms. The controlled median did not improve; the measured benefit is
in transition work and long frames, not every frame.

Reproduce with `tools/check-patch-pixels.mjs` and `tools/profile-rendering.mjs`
using `--active-utilities --speed=16 --stages --fixed-frames`; add
`--patch-ref=5da6f43` for the released capture path. Raw private screenshots,
profiles and hardware details remain under `output/`. A compact measured report
is in `building-captures-verification-v0.2.54.json`.

## Remaining work

Busy 16× callbacks are still long. Whole-city simulation/scanning, garbage
vehicles, routing and drawing remain substantial costs. This change does not
establish smooth performance for every city or device. The full original port,
remaining SPC/DSP and global-loop comparisons, and requested Turbo content
remain active work.
