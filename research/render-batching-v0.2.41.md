# Heavy-city drawing: v0.2.41

The night/rain profile showed long frames beyond the photoreal building pass.
Instrumenting the real frame callback isolated the native terrain layer: in
18 frames above 40 ms, it averaged 42.1 ms, versus 7.4 ms on faster painted
frames. Twelve slow frames also changed the palette. Thousands of individual
Canvas tile commands were a significant part of the stalls.

## Changes

The dedicated, unclipped city tile context now opts into a CPU pixel buffer for
plain city view. Its opaque integer 8x8 tiles copy their exact packed RGBA words
from the native atlas. Dirty tiles share one bounded rectangular upload per
frame; unchanged frames upload nothing. There is no GPU readback. Overlays use
the original Canvas compositing path. Unsupported alpha, blend, filter, shadow
or transform state also falls back. Switching paths invalidates tile identities
so an overlay, a pan or a later visit cannot reuse stale pixels.

This retains one additional ImageData buffer: 3,072,000 raw bytes for a native
map or 12,288,000 for a megacity. It is reused and replaced when dimensions
change; these figures exclude existing canvases/GPU memory.

The native atlas also reuses its ImageData and precomputes palette RGB values.
Original animation transfers affect graphics tiles `$360..$3FF`, referenced by
160 of the 958 map graphics. With unchanged palette bytes, only those entries
are decoded. A palette generation changes only when actual bytes change,
preserving static terrain through quantized seasonal steps. Full palette changes
still rebuild all entries. Transfer timing, palette math, flips and ground-pixel
generation remain unchanged.

Photoreal window glows now restore their alpha and blend mode directly. This
removes one full Canvas save/restore pair per glowing building while preserving
the original brightness, individual windows, ordering and surrounding state.
The photoreal art, existing cache limits and animation speeds are retained.

## Pixel and behavior checks

The full `render-performance-v0.2.41.json` report retains measurements, hashes
and comparison results. Reference rendering uses public commit `3025a5e`.

* 645 atlas and cached-layer comparisons match every RGBA byte through all
  animation cycles, four seasons, fades and palette changes. Ground versions
  also match. Decoded entries fell from 201,180 to 60,732 in this sequence.
* 208 raster-versus-Canvas comparisons match through animation, edits, overlay
  switches, partial views, pans, palette changes, unsupported state and resizing.
  A clean frame performs zero uploads.
* 59 photoreal comparisons match all pixels across all 15 styles, fractional
  views, growth/shrink, power and palette changes, and cache eviction. Extra
  alpha/blend/filter/shadow/rotation/clip cases preserve caller state. Each
  glowing building removes exactly one save and one restore. The existing
  193 ground-generation checks and bounded 128-composition cache still pass.
* 485 Node checks pass. Actual browser checks cover pipe preview/release and
  underground exit; original/photoreal art; water/shore/pollution; power and
  individual night windows; pause and movement; wind/social overlays; weather
  disabled with photoreal art retained; and session reload. The required
  gameplay client enters Practice City. Images were inspected.

An older weather verifier sampled before every image decoded and tried to
format an enormous array difference. Its owned helper was stopped. The verifier
now waits for the actual renderer's complete readiness, hashes pixel samples
and always closes its browser. Paused frames pass after that correction.

## Matched performance captures

Two sequential pairs used the same fully powered 240x200 synthetic city: 1,833
RCI plots, 45 real generators, 234,000 capacity, 1,521 lit buildings, zoom 0.5,
night, rain, 1.5 seconds warmup and five seconds capture. The second pair ran
in reverse order. The Canvas control keeps the same atlas/glow improvements
and disables only raster batching. No visual quality or simulation speed is
reduced for the candidate.

| Painted callback CPU time | Canvas control | Raster batching |
|---|---:|---:|
| Pair 1 median | 13.4 ms | 13.2 ms |
| Pair 1 p95 | 76.2 ms | 31.4 ms |
| Pair 2 median | 13.5 ms | 13.0 ms |
| Pair 2 p95 | 78.5 ms | 29.6 ms |

The long-frame reduction is the main result; typical frame time changes less.
These are local Chromium CPU/render-submission timings, not user-display FPS
or a universal device guarantee. About 30 ms of tail cost remains in this test.
Exploratory glow-only and atlas/glow pairs are retained separately in the report.

Full original scheduling/interface/SPC DSP and later music, remaining requested
Turbo economy/security/transport/disaster content, and further performance work
are still incomplete.
