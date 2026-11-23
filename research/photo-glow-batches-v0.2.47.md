# Photoreal glow passes: v0.2.47

The dense night/rain profile puts most effects CPU time in photoreal buildings
and their window glows. Each powered building previously switched from normal
drawing to screen blending and back before the next building. The renderer now
defers glows across surfaces that cannot overlap them, then draws the queued
glows in their original order under one screen-blend pass.

`PhotoGlowBatch` marks a conservative one-tile border around each queued
footprint, covering the original four-pixel glow margin. A later footprint that
touches those marks flushes the queue **before** drawing its surface. Therefore
contiguous, overlapping and repeated footprints retain the original occlusion
order. Unsupported transforms/state keep the existing immediate path. The
guard uses the same aligned transform test as the existing composite cache;
smooth fractional zoom/pan retains the original rendering path.

Exact glow alpha, colour, individual window pixels, pulse timing, margins and
drawing order are retained. No quantization, lower-resolution art, reduced
effects count, frame skipping or simulation-speed reduction is introduced.
The command array and occupancy storage are reused. Occupancy costs 48,000
raw bytes for a native map or 192,000 for a megacity, excluding JS overhead;
the command buffer grows to the largest visible batch, then reuses its slots.
Cache-busting module URLs ensure existing browsers fetch the changed renderer.

## Visual and behavioral evidence

`node tools/check-photo-composites.mjs --baseline=3562dab` compares against the
previous public renderer. **80 complete RGBA comparisons match every byte**.
They cover all 15 photoreal styles, day/night and fade values, six zooms,
fractional pans, high-quality sampling, alpha/blend/filter/shadow/rotation/clip,
growth/shrink, damaged footprints, power loss/restore, disabled buildings,
palette changes, cache eviction and ground changes. Added dense cases include
zero/one/two-tile gaps, reverse zone order, repeated overlapping footprints and
clipping. Existing ground-version checks still total 193; the 128-composition
cache remains bounded and unchanged appearances rebuild nothing.

In the one-tile-gap dense case, **216 lit buildings use one glow pass**. With
touching footprints, 345 glows use 331 passes, preserving necessary barriers.
A repeated overlap splits the one-gap queue into two passes. Every compared
caller canvas state is preserved.

**518 Node checks pass.** Four added checks exercise exact alpha/order, overlap
barriers, reused storage, frame/dimension changes, epoch rollover and unsafe
footprints. Actual app checks cover photoreal/original art, individual night
windows, power loss, water/shore/pollution, paused stability, animation,
weather disabled while art remains, wind/social overlays and session reload.
The required gameplay client enters Practice City and reaches February 1900.
Gameplay, comparison and night close-up images were inspected.

One weather-check snapshot initially changed while paused. Diagnostics showed
the camera zoom still approaching its target: 1.2493063667 -> 1.25, with matching
cloud offset, water flow and simulation state. The checker now waits for the
requested zoom to settle before asserting a stationary scene. Failure
diagnostics retain changed-pixel bounds and before/after state. Three subsequent
local weather runs pass. Smooth user zoom remains active while paused.

## Measurements and limits

`photo-glow-performance-v0.2.47.json` retains full reports, pixel comparisons
and normalized source hashes. These are local headless Chromium CPU/render
submission measurements, **not user-display FPS**. The real 240x200 fixture has
1,833 developed RCI plots, 45 actual generators, capacity 234,000, 34,647 power
visits and 1,521 lit buildings. Every developed zone is powered. View is zoom
0.5, night/rain, with contaminated water; civic-service simulation is disabled
in this rendering fixture. It does not represent every requested service mix.

The isolated night-building pass measured about 6.0–6.3 ms before and 5.6–5.7 ms
after. Ordinary five-second whole-game captures improved typical CPU time
slightly, but their p95 was mixed/worse. They include expensive civic-window
fade, water/palette and simulation frames. This release does **not** claim to
eliminate those long frames or establish uniformly smoother real-time play.

The profiler additionally runs the actual app frame callback with 300 fixed
60 Hz inputs, resetting the same city and fixing the product animation clock.
It measures duration with the real clock. This gives matching building-effect
lifetimes and **254 painted frames in both runs**, unlike the first attempt
that fixed only frame inputs. Both runs reach base step 6, visual frame 300,
February 2008, 34,647 power visits and 1,521 lit buildings.

| Fixed-clock painted callback | Previous | Batched |
| --- | ---: | ---: |
| Median | 14.8 ms | 14.3 ms |
| p95 | 17.8 ms | 17.5 ms |

This is one controlled pair, not a universal percentage/FPS claim. Inner stage
timings in this fixed-clock subsection read the overridden product clock and
are not meaningful CPU durations; only its outer real-clock measurements are
used. Ordinary capture stage timings remain real-clock measurements. The
timed renderer/batch code is the released code; subsequent version/query and
diagnostic-counter changes do not change its rendering behavior.

Further work remains on heavy-city long frames, active civic/utility mixes and
high-speed simulation. Full original scheduling/interface/endings/unlocks,
remaining SPC DSP/menu-event audio and requested Turbo economy/security/
transport/mega-disaster content remain incomplete.
