# Dense city rendering, v0.2.29

The photoreal replacement previously repainted every8x8 background tile separately for every visible building on every effects pass. Reuse one background patch per footprint size within a draw instead. Refresh those patches on EVERY draw so the mutable seasonal atlas never becomes stale. Keep per-building art, light power checks, growing/morphing frames and window glow.

Same local Windows Chromium executable, sequential before/after runs. Baseline intercepts only realistic-art.js from63397b1; the1833-zone240x200 fixture, night/rain, high effects, viewport and other code stay the same. The app uses0.5zoom. Background load is not controlled. These are JavaScript/render-submission measurements; they do not prove user-device display FPS.

| Work | Before median / p95 | After median / p95 |
|---|---|---|
| Photoreal day pass |19.4 /21.9 ms|2.8 /3.1 ms|
| Photoreal night pass |21.1 /25.9 ms|7.4 /8.0 ms|
| Complete night/rain pass |28.8 /63.6 ms|14.0 /18.3 ms|
| Running app animation callback |23.0 /52.2 ms|6.3 /35.0 ms|

Small-scene checks match old pixels exactly at1x and0.5x. At2x, fewer than0.4% of image channels differ because terrain patch edges are now sampled as one surface rather than separate source rectangles; unchanged building placement/compositing, palette refresh and damage rejection are checked. Existing browser checks also cover actual power-cut lighting, animated water, shoreline clipping, pause, art toggles and session persistence. This improves the identified bottleneck but does not establish that all large-city simulation/FX bottlenecks are resolved.

Reproduce:

~~~powershell
$env:TEST_URL='http://127.0.0.1:55709'
node tools/profile-rendering.mjs output/mega-before.json --mega --ground-baseline
node tools/profile-rendering.mjs output/mega-after.json --mega
node tools/check-realistic-art.mjs
~~~

tools/check-photo-ground.mjs recreates its private output/realistic-ground-before.js comparison module from63397b1. Full raw synthetic measurements: render-performance-v0.2.29.json.
