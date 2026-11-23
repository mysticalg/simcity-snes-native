# Native window-mask readbacks: v0.2.50

Detailed heavy-city traces attributed several long lighting calls to **mask
extraction**, rather than glow baking. The previous path drew each native
building's tiles into a small canvas and read them back with `getImageData`.
A recently uploaded/used atlas could force a GPU synchronization. Measured
individual masks took 14–19 ms, with whole mask stages peaking above 20 ms.
Examples included industrial/commercial plots near the viewport fringe and
a small-home plot after growth. Their original culling behavior is retained.

`AnimatedCityAtlas` already retains its exact RGBA pixels in `cityPixels32`.
`nativeWindowPixels` copies the same integer 8x8 source rectangles directly
from that buffer for supported native building masks. It respects the atlas
stride, typed-buffer byte offset, map-edge `city.id` behavior and empty/outside
source tiles. The resulting RGBA bytes feed the unchanged window detector.
The existing mask cache and its keys/eviction remain unchanged.

Static PNG atlases, unsupported CPU metadata and translucent source pixels
retain the original Canvas path. Custom civic image extraction also retains
that path. The fallback now reuses one pixel read for the optional police
window analysis instead of reading the same canvas a second time.

There are no new persistent canvases or whole-map copies. A temporary RGBA
buffer is allocated on a supported mask cache miss (2,304 bytes for a 3x3
footprint), then released after extracting window groups. Existing cached masks,
shared bloom pages, window colors/fades/pulses, image resolution and animation
rates remain unchanged. A CPU-backed bloom experiment changed pixels and was
set aside; the released change leaves bloom contexts and drawing untouched.

## Pixel and behavior verification

* **72 complete atlas/footprint comparisons** match all RGBA bytes: 4,362,816
  compared pixels across all 958 native entries plus two empty entries, four
  seasons, 64 animation states, six palette changes, map edges and outside
  source IDs. The comparison's 72 legacy readbacks become zero candidate
  readbacks. It uses the actual `AnimatedCityAtlas` producer and the original
  integer Canvas composition as its reference.
* **53 full lighting comparisons using that CPU-backed atlas** match every
  RGBA byte against public `9cde5c2`. Another **53 PNG-atlas comparisons**
  exercise the retained fallback. They cover 53 current tool exemplars,
  fades, zoom/pan, caller state/filter/shadow, rotation/clipping, changed/removed
  buildings, overlap, multiple pages, oversized glyphs and empty views.
* In the first actual-atlas gallery, offscreen pixel reads decrease from 49
  to 44 and source draw commands from 114 to 45. Five native masks use the
  CPU path; custom image reads remain. Window/building/pixel counts are equal.
* **534 Node tests pass.** Added assertions cover source rectangles, seams,
  nonzero byte offsets, transparency, malformed/unsupported metadata,
  fallback selection and buffer ownership through later atlas updates.
* Actual app checks cover photoreal/original art, individual night windows,
  power loss, water/shore/pollution, pause, weather movement, wind/social
  overlays and session reload. The required gameplay client enters Practice
  City and reaches February 1900. Comparison, gameplay and night imagery were
  inspected. No browser errors occur.

## Matched local measurements

The raw reports, exact comparisons and normalized source hashes are in
`native-window-performance-v0.2.50.json`. These are local headless Chromium
CPU/render-submission timings, **not user-display FPS**. Each whole-game run
uses the same powered 240x200 fixture: 1,833 developed RCI plots, 45 real
generators, 234,000 power capacity, 34,647 power visits, 1,521 lit buildings,
zoom 0.5, night/rain and contaminated water. Civic-service simulation is disabled
in this rendering fixture; it is not a claim about every active utility mix.

The second pair reverses candidate/control order and routes either renderer
source through the same browser interception path. The fixed-clock section
runs the actual app callback with 300 fixed 60 Hz inputs and fixed product
animation time; all four runs paint 254 frames and reach the same checked base
step 6, visual frame 300, February 2008, power visits and lighting count.

| Measurement | Previous 1 | Direct copy 1 | Previous 2 | Direct copy 2 |
| --- | ---: | ---: | ---: | ---: |
| Mask-stage maximum | 20.2 ms | 1.1 ms | 20.7 ms | 0.9 ms |
| Lighting-stage maximum | 21.1 ms | 2.0 ms | 21.8 ms | 1.8 ms |
| Fixed-clock frame median | 14.5 ms | 14.5 ms | 15.0 ms | 14.3 ms |
| Fixed-clock frame p95 | 19.3 ms | 18.4 ms | 19.1 ms | 16.9 ms |

Ordinary five-second captures show typical frame time 12.7 -> 12.2 ms and
12.5 -> 12.3 ms, but whole-frame p95 remains mixed: 26.9 -> 27.0 ms and
19.5 -> 27.0 ms. Other water/palette/simulation/render stalls remain. This
release removes the measured native-mask readback bottleneck; it does not
claim uniform smoothness or a universal FPS improvement. Inner per-stage
timings in the fixed-product-clock subsection are not interpreted as CPU
durations; its outer duration uses the real clock. Ordinary stage timings
use the real clock throughout.

The timed helper and window renderer are the released implementations.
Subsequent parent module-URL/version changes only ensure browsers fetch them.
The initial separate mask diagnostic identifies slow plot IDs/positions;
the bounded CPU-copy change follows that evidence rather than altering art.

Further work remains on active civic/utility mixes, high-speed simulation and
other long frames, alongside original global simulation/interface/fax/audio
parity and the requested Turbo economy/security/transport/mega-disaster
content. Existing photoreal assets and original city/ending music are retained.
