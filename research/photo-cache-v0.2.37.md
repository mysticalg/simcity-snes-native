# Photoreal building rendering: v0.2.37

Developed cities repeatedly drew the same ground, shading, day image and night
image for every building. This release composes shared appearances into bounded
small canvases. Individual window glow and flicker remain animated separately.
No art files or simulation rules change.

## Rendering and invalidation

`RealisticBuildings` shares a composed appearance by sprite, footprint, raster
dimensions and power state. An entry updates for a changed night amount or
ground generation. It retains at most 128 canvases, with a 512-pixel dimension
guard. The exercised eviction case retained 3,745,828 bytes of raw RGBA storage;
browser bookkeeping and GPU allocations are additional to that estimate.

The fast path requires the plot grid and camera translation to align with the
canvas pixel grid. Arbitrary fractional zoom, fractional pan, growing/shrinking
buildings and nonstandard filters, shadows, alpha, blend or sampling quality retain the original drawing path.
This preserves its sampling and compositing behavior. A preflight check runs
once per draw, avoiding matrix allocation and canvas-state queries per building
when the normal path is required.

The native `AnimatedCityAtlas` compares the exact 256 RGBA bytes of ground tile
zero while producing an atlas. Its `cityGroundVersion` changes only when those
pixels change. This uses the existing CPU image data and requires no GPU
readback. Season and palette changes invalidate composed appearances; unrelated
road/water animation leaves them reusable. Unversioned external atlases refresh
their ground each draw, preserving support for mutable inputs.

## Verification

Serve the project and set `TEST_URL` to that server URL, then run
`node tools/check-photo-composites.mjs`. The check compares the complete output against the
renderer from public commit `8d43b84`. All **52 comparisons have zero changed
pixel channels**, covering all 15 original photoreal sprite slots, day/night
amounts, several scales and camera offsets, intermediate growth and shrink
blends, power changes, disabled facilities, damaged footprints, mutable palette
input and cache eviction. The browser imports the actual module URLs used by
the app. Another **193 original-atlas checks** compare generation metadata with
the actual ground pixels through animation, four seasons and a palette change.
An unchanged versioned appearance rebuilds zero composed layers. Canvas reuse
and the 128-entry eviction bound are exercised.

The real app checks also pass for individual night windows, power cutting
lights, pause-stable rendering, moving water, shore clipping, blue/brown water,
the original-art option, all four weather/art toggle combinations, and session
reload. The required web-game client enters and runs a city. Screenshots were
inspected. The existing **468 Node checks pass**, retaining the original-ROM
simulation and music evidence from prior releases.

## Performance evidence and limits

`photo-cache-performance-v0.2.37.json` retains all raw measurements used below.
These are local Chromium CPU/render-submission timings for a synthetic city,
with night, rain and high effects. They do not measure user-display FPS.
The harness validates complete native RCI footprints in its
`powered-developed-RCI-v3` fixture: 1,833 RCI zones plus45 operating fusion/solar
plants in separate neighborhood grids, with1,482 photoreal plots reported in
the zoomed-out view. Every RCI zone must remain powered after save/restore;
no forced power bitmap is used. Capacity is234,000 and consumed visits34,647,
without overload. Civic service simulations are disabled. The app runs unpaused
for1,500ms before the five-second profile. The baseline routes only the original `8d43b84`
photoreal renderer; other code and inputs are the same.

| Measurement | Baseline | Candidate |
|---|---:|---:|
| Painted frame callback median | 40.7 ms | 13.7 ms |
| Painted frame callback p95 | 89.0 ms | 72.0 ms |
| Isolated night buildings median | 11.7 ms | 6.6 ms |
| Isolated complete effects median | 17.4 ms | 9.1 ms |
| Unpowered control zoom 1.37, painted median | 4.1 ms | 4.1 ms |
| Fractional zoom 1.37, painted p95 | 6.7 ms | 7.1 ms |

The aligned view used three retained appearance canvases and rebuilt zero
appearances in its final unchanged draw. The retained fractional/unpowered control used the normal
path. No general speedup is inferred for arbitrary fractional camera positions.
Short isolated drawing batches can produce deferred-raster/queue outliers;
the raw p95 slices are retained rather than used to claim an overall FPS gain.
The improvement is a measured milestone. The original5,000-entry power work-stack limit (`CODE_03B0BE`, `$1388`) remains
a separate issue for large connected Turbo grids; scaling that integration is
a following simulation task. Heavy-city simulation and other FX
still have costs that require further work.

The local preview server also increases its pending connection queue from five
to 128. A 48-connection probe changed from 41 successes/seven refusals to
48 successes/zero refusals. This fixes a local cold-import reliability issue;
GitHub Pages uses its own serving infrastructure.

The full original port remains incomplete: original interface composition,
natural global scheduling and further simulation comparisons, later music and
full SPC DSP behavior, plus requested economy/security/transport extensions
remain open. Existing photoreal civic and amenity art is retained.
