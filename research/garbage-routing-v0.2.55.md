# Avoiding unused garbage-truck routing, v0.2.55

`GarbageVisuals.update` first removes trucks whose facility is no longer
operating or whose path contains a deleted road. Previously it then constructed
a breadth-first road search for each of the first twelve operating roots,
even when the surviving trucks already filled that facility's fleet.
Those search results were unused: the following spawn loop added no trucks.

The new check counts the surviving fleet before allocating/searching. A full
fleet skips that unused search. New facilities and lost routes still use the
same search, north/east/south/west ordering, target order, hash selection, return
loop and fleet limits. All live routes are still validated against current
roads and operating facilities on each city revision. No topology cache,
revision shortcut, simulation skipping, graphics change or quality reduction
is introduced. Application imports use a new cache version for this module.

## Equivalence and runtime checks

The reference is the previous browser release `e8bc78b`, not the SNES program.
Garbage services are a requested Turbo extension.

* 380 exact visual-state comparisons cover a genuinely powered small city,
  road cuts/reconnection and alternate routes, facility enable/disable and
  removal, full/empty landfill, changing facility types/fleet sizes, disappearance
  of residential targets, blackout/recovery, save/reload and forty actual steps
  of the powered active-utility megacity. Truck order, full paths, fractional
  positions, loads, cleared-road expiry and pickup counters match. Each renderer
  update preserves the serialized city.
* The actual browser draw path is checked against the released worker through
  movement and real facility/road/power edits. Seventy-two independently rendered
  frames at 0.5×, 1× and 1.375× match all 66,355,200 RGBA channels, with visible
  photoreal trucks and nonempty drawing verified.
* Focused tests verify that four initial root searches become zero unused
  searches for complete surviving fleets. Road cuts still remove stranded
  trucks and reconnection recreates them. Full landfill, shutdowns and real
  blackouts remove their fleets; restored cities recreate working fleets.
* 552 Node tests pass. Actual mouse placement/release and costs, monthly pickup,
  incineration/recycling and landfill reclamation quantities, facility toggles,
  saved quantities, mobile inspector layout and the required Practice gameplay
  client pass. Gameplay and truck screenshots are inspected.

The waste checker now follows the app's canonical civic module and accepts the
meter's whitespace before `/month`; it still checks the exact 12,000 capacity.

## Performance measurements and limits

Sequential tests use the same powered 240×200 active-utility fixture, 16× speed,
night, rain, photoreal art and high effects quality. These are elapsed CPU and
render-submission timings, **not user-display FPS**.

| Controlled 300-frame workload | Released worker | New worker |
| --- | ---: | ---: |
| Median, pair 1 | 18.1 ms | 17.8 ms |
| p95, pair 1 | 79.6 ms | 73.6 ms |
| Median, pair 2 | 18.9 ms | 19.3 ms |
| p95, pair 2 | 79.3 ms | 79.5 ms |

All four runs paint 300 frames, reach simulation step 106 and visual frame
4,800, and have identical full-save SHA-256:
`808f65910eec5d5d8673c8be3498576a5832ddd1ec6cf6c9fb221efa29e1393e`.
The first baseline precedes the added routing-stage instrumentation; the
second pair uses the same instrumentation. The second pair is effectively flat/slightly worse, so this is not a general
frame-rate improvement claim.

Ordinary five-second callback median changed 79.3→70.4 ms and 82.4→76.6 ms;
p95 changed 113.2→106.9 ms and 122.8→103.5 ms. The sampled garbage-update
stage in the instrumented ordinary runs changed median 6.6→2.1–2.2 ms and
p95 8.6→2.7–2.9 ms. These ordinary runs advance different elapsed city states,
so their stage values are not equivalent-state benchmarks. Nested stage fields
inside the fixed-input harness use its logical clock and are not timing
evidence; only its outer callback measurement uses real elapsed time.

Reproduce with `tools/check-garbage-routing.mjs` and
`tools/profile-rendering.mjs --active-utilities --speed=16 --stages --fixed-frames`;
add `--garbage-ref=e8bc78b` for the previous worker. Compact results are in
`garbage-routing-verification-v0.2.55.json`; raw profiles and screenshots remain
private under `output/`.

Heavy cities still have long simulation/rendering callbacks. The remaining
original-game, global-loop/SPC-DSP and requested Turbo content work is not
complete. Fleet visuals are recreated from a restored city, as previously;
this change does not add persistent truck positions or alter waste economics.
