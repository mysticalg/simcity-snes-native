# Dense power grids: v0.2.38

Dense connected cities could have unpowered districts despite surplus generation.
The original 5,000-entry junction stack discarded pending branches silently.
Turbo's conducting roads/rails and larger maps make that hardware limit visible.
The browser city now uses a work stack bounded by its map size. Existing saves
repair their power flags automatically when loaded.

## Original program evidence

`CODE_03AFB0..03B0DC` walks available north/east/south/west neighbors in order,
retains the first two, follows the second and saves the junction for later.
Every visit, including a revisited junction or source, consumes capacity.
`CODE_03B0BE` compares `$0C57` with `$1388` (5,000) before pushing coordinates
to `$7FD1E4` and `$7FE56C`. A full stack simply skips the push.

`node tools/reference-power.mjs --stack-stress` executes the original power and
map-writeback routines in the preserved USA ROM using the pinned Mesen runner.
`reference-power-stack.json` records ten controlled cases: **120,000 map words,
15,000 bitmap bytes, capacity/visit counters, overload flags, peak stack size
and rejected-push counts** all match. The caller's plant stack and counts are
supplied explicitly; this does not verify natural game-loop timing.

The saturation case supplies 100 nuclear centers and conductive lines on a
12,000-cell map. Original execution reaches a stack peak of 5,000 and rejects
6,763 pushes. It powers 11,900 cells and charges 16,901 visits despite 200,000
capacity and no overload. This is a traversal limit rather than a shortage.
The original nine-case report remains unchanged.

## Native behavior and the Turbo integration

`traceRomPower` retains **5,000 as its default**, preserving the source-ROM
reference behavior. Its explicit `branchLimit` option enables the Turbo
integration to supply a larger finite stack. `City.updatePower` reserves at
least two entries per map cell: one initial seed and one deferred junction.
Visited-neighbor checks and seed deduplication keep that bound finite.

This is an intentional Turbo extension to support the expanded conductor
graph, including ordinary-size cities with conducting transport. The original
neighbor order, generation amounts, visit charging and exhaustion rule remain.
The power pass also removes per-visit neighbor/candidate arrays. Diagnostic
limit/peak/drop counters are exposed in the test state, without adding controls
or implementation details to the game UI.

More of a connected network is now visited and charged. A city can still need
additional generation once its full network is counted. Genuine shortages,
disconnected districts and disabled plants continue to cause outages.

## Integration checks

The connected test city uses 1,833 complete RCI plots and 45 real fusion/solar
sources on a 240×200 map. No power bitmap is forced and no neighborhood gaps
are inserted. With 234,000 capacity, the former stack limit powered only **921
of 1,833 zones**, dropping 495 junction pushes without reporting exhaustion.
The repaired pass powers all 1,833 zones, charges 37,683 visits, peaks at 11,952
entries and drops zero branches.

An independent breadth-first reachability check matches **every map cell** of
the repaired power bitmap under ample generation. Other tests cover native
saturation, old save flags, unchanged map markers/funds/population/census,
zero generation, a real 1,000-capacity overload, and an isolated building.
The native census snapshot is retained; visible power status uses the current
power bitmap independently of those scan-time counters.

`tools/check-turbo-power.mjs` loads the old flags through the actual file input,
checks every RCI zone, inspects a formerly dark home, switches a solar source
off through its inspector, creates and clears a genuine outage, reloads the
session and downloads a fresh save. The save has all repaired power flags and
retains the disabled source and funds. Screenshots of the powered night city,
outage icons and connected inspector were inspected. **472 Node checks pass.**

## Performance measurement

`power-performance-v0.2.38.json` retains the local Chromium samples and source
hashes. For this allocation comparison only, the old `9d6fb66` neighbor-array
implementation is given the same expanded bound. Both versions produce the
same bitmap and counters, so the comparison does not gain speed by dropping
parts of the network. After ten paired warmups, 60 interleaved samples give:

| Traversal CPU time | Old arrays, expanded bound | Current |
|---|---:|---:|
| Median | 1.1 ms | 0.3 ms |
| p95 | 1.3 ms | 2.2 ms |

This short test improves the median while retaining tail outliers. It measures
the power traversal, not whole-game performance or user-display FPS.
The photoreal rendering cache from v0.2.37 remains in place.

The full port remains in progress: further source simulation/timing comparisons,
original interface coverage, later music/full SPC DSP behavior, and requested
economy/security/transport content remain incomplete.
