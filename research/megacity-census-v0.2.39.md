# Megacity population: v0.2.39

A dense 240x200 map can exceed the original game's census registers. The
browser previously wrapped residential units at 65,536 and also wrapped the
weighted R+C+I total before calculating population. As a result, a growing
megacity could abruptly lose displayed population and city classification.

## Original arithmetic remains verified

`CODE_0393AE` adds the current residential zone population to the 16-bit
register `$0B8B`. `CODE_038196` adds commercial `$0B93` and industrial `$0B8F`,
shifts three times and adds residential without clearing the last shift's
carry. The resulting word is multiplied by `$0014` (20) into a 32-bit
population. This includes real word-wrap and incidental-carry behavior.

`romPopulation` is unchanged. `node tools/reference-population.mjs` was rerun
against the preserved original ROM and returned `cases:60, exitCode:0`.
All 420 recorded output comparisons remain equal, including annual migration,
population categories, word boundaries and final-ASL carry. The native full
scan tests still match all 96 original executions, their maps, census and RNG.

## Explicit Turbo extension

Only maps larger than the original 12,000 cells use wider census counters.
The current supported large map is 240x200. Its population is the same
zone-unit weighting, `20 * (residential + 8 * (commercial + industrial))`,
using ordinary exact JavaScript integers without word truncation or the
native incidental carry. Original-size maps still call `romPopulation`.
The megacity extension is not presented as original cartridge behavior.

Zone occupancy remains collected before growth during the real tile scan.
Refresh and save/load retain that snapshot, rather than silently replacing it
with a census of the post-growth map. Ordinary construction invalidates it.
The counter also computes small-home occupancy once per scanned center,
avoiding the former duplicate neighborhood probe.

New saves mark their population mode and scan-counter mode. Older megacity
saves with wrapped snapshots are recounted from their actual map. Their
already-wrapped prior-population baseline cannot be reconstructed, so migration
starts at zero after this repair. Funds, terrain and construction are retained.
New wide snapshots survive reload; invalid/out-of-map-range counters fall back
to recounting. Original-size legacy snapshots keep their existing behavior.

## Checks

The stress fixture contains 2,891 complete, separated 3x3 residential plots,
each at the source's 40-unit stage. Its independent placement total is 115,640
residential units and 2,312,800 population. The previous implementation reported
1,002,080. A second complete mixed RCI map checks all three weighting inputs.

Focused assertions cover both 65,536 and 131,072 unit boundaries, the source
job-shift boundary, an actual full growth scan, pre/post-growth recounting,
legacy and malformed saves, a real building demolition, and the December to
January path through history, migration and pending-budget reload.
**478 Node tests pass.**

The browser test loads the legacy file through the actual file input, checks
the visible population, demolishes a real plot using the mouse blueprint and
release flow, reloads the session and downloads/reloads a new save. Population
falls by exactly 800 after removing that plot. The test reports no page or
request errors. The required gameplay client entered Practice City, and its
gameplay image and the megacity counter image were inspected.

This is a census/population correction, not a whole-city performance claim.
Recent shared photoreal rendering and power-traversal optimizations are kept.
Demand/history/facility algorithms still need a separate large-counter audit;
further original simulation timing, interface and SPC/DSP parity, plus the
remaining requested Turbo content, are unfinished.
