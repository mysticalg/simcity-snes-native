# Shared civic window bloom: v0.2.43

Detailed heavy-city traces showed occasional expensive civic-light rebuilds
inside `WindowLights.draw`, alongside the remaining simulation/render stalls.
The original implementation kept a source canvas and a separate blurred canvas
for each visible building. The new renderer packs their sources into shared
pages and runs one blur per page. Individual window colours, brightness seeds,
fade steps, bloom radius, screen blending and drawing order remain unchanged.

Each page is at most 512 by 512 pixels. Every glyph keeps its original four-pixel
margin, with an additional eight-pixel gap between cells. Pages and canvases are
reused when the layout stays the same, and unused pages are released from the
cache. Page allocation follows the currently visible glyphs. A glyph larger than
a page retains the original individual path. No lighting resolution or frame
rate has been reduced.

Fractional source-rectangle sampling can round a few colour bytes differently.
For smooth zoom/pan, rotation and higher-quality sampling, a reusable per-glyph
copy preserves the original full-image sampling grid. It still shares the blur.
This fallback can retain one additional canvas per visited glyph; layout/page
memory is not a claim of universally lower raw pixel memory.

## Exact rendering and controls

`node tools/check-window-glows.mjs` compares against public commit `03eee3c`.
All **53 complete pixel comparisons match every RGBA byte**, with equal building,
window and illuminated-pixel counts. They cover 53 current civic/native tool
exemplars, fade boundaries, six zooms, fractional pans, high-quality sampling,
caller alpha/blend/filter/shadows, rotation, clipping, removal/movement, paused
repeats, overlapping windows, three simultaneous pages, oversized glyphs and an
empty visible set. Caller state is preserved.

In the first gallery frame, **46 blur operations become one**, while retaining
715 illuminated windows and 1,260 illuminated pixels. Its two shared canvases
use 1,184,848 raw RGBA bytes, excluding GPU/runtime overhead and fallback copies.
The same canvas objects are reused; paused repeats rebuild no bloom; an empty
view retains zero pages. Three layout checks additionally exercise 800 varied
glyphs, isolation gaps, bounds, oversized fallback and repacking.

All **494 Node checks pass**. Actual browser checks cover photoreal/original
art, individual night windows, power loss, water animation and shore clipping,
contamination, pause stability and session reload. The required gameplay client
enters Practice City. Gallery, night close-up and gameplay images were inspected.

## Matched full-game captures

Raw reports and normalized source hashes are retained in
`shared-window-performance-v0.2.43.json`. These are local headless Chromium
painted callback CPU/render-submission measurements, **not user-display FPS**.
Every run uses a fully powered 240x200 city, 45 actual generators, night/rain,
zoom 0.5, 1.5 seconds warmup and five seconds capture. The control substitutes
only the old window-light renderer; other recent optimizations are retained.
Each second pair reverses the run order.

| Fixture / pair | Old median | Shared median | Old p95 | Shared p95 |
|---|---:|---:|---:|---:|
| 1,833 RCI / 1 | 13.2 ms | 12.7 ms | 18.5 ms | 17.9 ms |
| 1,833 RCI / 2 | 13.1 ms | 13.1 ms | 19.8 ms | 18.8 ms |
| 1,374 RCI + 459 hospitals / 1 | 13.3 ms | 12.2 ms | 25.6 ms | 28.0 ms |
| 1,374 RCI + 459 hospitals / 2 | 13.3 ms | 12.2 ms | 30.4 ms | 25.8 ms |

The civic-heavy fixture uses real 3x3 hospital footprints and existing photoreal
art, but leaves civic-service simulation disabled to focus on rendering. Its
typical callback improved by about 8% in both captures. Whole-frame p95 is mixed;
this release does not claim to eliminate long frames or improve every device.
The isolated effects pass also improves modestly; the large first-pair old
p95 outlier does not recur in the second pair and is not a general speed claim.

Full original simulation scheduling, interface parity, remaining Turbo content,
full SPC DSP/menu-event music and further heavy-city performance work remain
incomplete. The photoreal assets and all six original city themes are retained.
