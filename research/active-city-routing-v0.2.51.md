# Active-city bus routing: v0.2.51

The rendering-only fixture in v0.2.50 leaves civic services disabled. A new
separate 240x200 fixture exercises the enabled systems: 1,720 developed RCI
plots, 27 fusion plants, 45 heavy water pumps at the shoreline, 45 sewage
pumps, 23 treatment plants, 23 incinerators, 23 recycling centres, and 15 each
of hospitals, universities, bus stations and road-mounted stops. Streets and
pipe grids are actual map layers. Initial power comes from the real traversal
(270,000 capacity); every building is powered, without `power.fill` or a
modified capacity rule. Working supplies and 32 real bus routes are asserted.
Finite water/waste shortages remain part of this deliberately heavy fixture.

## Change and preserved behavior

CPU sampling identified repeated `busRoutes` searches as one significant cost.
Previously each working station searched its entire reachable road component,
then reconstructed paths to the stops. It also repeated each stop's road-entry
search for every station.

The revised worker resolves the stop entries once and stops breadth-first
search once all distinct destinations have been discovered. Parent assignment
is final on first discovery, so the remaining component cannot alter their
paths. An unreachable destination still requires the complete search. Empty
station/stop lists avoid the search.

Station/stop ordering, nearest-road entry rules, north/east/south/west tie
breaking, return-path construction, duplicate stops, same-entry behavior and
the 32-route limit remain unchanged. There is no persistent routing cache or
invalidation heuristic. Road edits, power loss and switched-off stations use
the current inputs on every call. This optimizes the existing **custom Turbo
bus model**; buses are not a newly recovered SNES simulation rule.

Apart from that worker, production changes update module query versions and
the displayed release number. The transitive module graph uses one new civic
module URL so returning browsers fetch the changed code consistently. Art,
glows, water, animation rates, simulation cadence and quality settings are
retained.

## Verification

* 538 Node tests pass. New focused cases cover path ties, return paths,
  disconnected roads, map-row boundaries, missing entries, duplicates and
  the route cap. A nearby destination on a 48,000-cell road component needs
  fewer than twelve road-flag reads, rather than exploring that component.
* 604 comparisons against the exact previous `c1f179f` worker match all
  5,019 output routes and their order. Cases include small/large maps, random
  disconnected networks, duplicate destinations and topology edits. Map input
  remains unchanged.
* Two sequential Node pairs, including reversed candidate/control order,
  produce identical complete serialized state after twenty active simulation
  steps. Water, sewage and bus-service results match too.
* Four actual-app browser captures use 16x speed, night/rain, high FX and
  photoreal art at zoom 0.5. Each fixed-clock run executes 300 original app
  callbacks, paints 300 frames, advances 106 base steps/4,800 visual frames,
  and reaches the same month, power count, lighting and complete saved state.
  SHA-256 of that state is
  `808f65910eec5d5d8673c8be3498576a5832ddd1ec6cf6c9fb221efa29e1393e`.
  The Road tool's automatic traffic coverage is active; the map overlay is
  set to `none`, with no underground view.
* Browser checks load this real fixture into the app, compare live routes to
  the previous worker, verify every route cell is road, remove a used road,
  resume/pause and reload the edited city. All 45 water and 45 sewage pumps
  operate initially, pause remains stable and changed/reloaded routes match.
* Existing civic placement, road-mounted stops, water warnings, photoreal/
  original art, nighttime windows, power loss, pollution/shore clipping,
  weather and session checks pass. The required gameplay client reaches
  February 1900 in Practice City. Screenshots were inspected; browser checks
  report no errors.

## Measurements and limits

These are local CPU/render-submission timings, not user-display FPS. Node
samples include startup/JIT costs. Browser fixed runs use a fixed product
clock and real outer duration; their inner stage clocks are not CPU timings.

| Measurement | Previous 1 | Revised 1 | Previous 2 | Revised 2 |
| --- | ---: | ---: | ---: | ---: |
| Node simulation-step median | 38.72 ms | 35.48 ms | 37.38 ms | 34.10 ms |
| Fixed browser frame median | 20.10 ms | 17.60 ms | 18.90 ms | 18.40 ms |
| Fixed browser frame p95 | 105.50 ms | 94.50 ms | 107.00 ms | 101.00 ms |
| Ordinary capture frame median | 122.10 ms | 118.70 ms | 126.50 ms | 116.40 ms |
| Ordinary capture frame p95 | 182.20 ms | 153.60 ms | 168.10 ms | 180.00 ms |

Ordinary captures advance different amounts of simulation with real elapsed
time; their p95 is mixed. The matched fixed runs support a modest improvement,
while heavy 16x frames remain slow. This does not establish universal
smoothness, a user-device frame rate, or completion of performance work.
Further water allocation, sewage, city scanning, pollution, vehicle and FX
costs remain. The exact reports and source hashes are in
`active-city-performance-v0.2.51.json`.

The full port remains incomplete: original global-loop/interface/fax/DSP
comparisons and requested Turbo economy, security, elevated transport and
mega-disaster content remain, alongside further active-city optimisation.
