# Processing inspector and full-scan census — v0.2.18

Treatment plants use the shared pipe network and electricity. They do not
consume drinking water. Corrected the misleading generic water label; the
inspector now distinguishes missing electricity/pipe, no sewage pump, ready
and actual treatment allocation. Underground view draws an explicit manifold
from pipes beneath or beside each utility to its connector. Intake/outfall tests
cover all four water sides; treatment tests cover interior pipes and every edge.
No horizontal/vertical orientation restriction is present.

The inspector opens with compact accessible meters, numeric rate/capacity,
full-capacity text, status and cost/upkeep/tax. Additional financial/connection
text is expandable. Sewage and waste meters use current monthly dispatch
allocation, not invented activity; municipal pickup precedes extra depot pickup.
Water/power and health/education/transit pool statistics are labelled shared.
Individual employer attendance is not simulated and is not fabricated. Building
enable/disable recomputes allocations. This is a player extension, not ROM logic.

## ROM scan correction

CODE_03821D resets scan counters; CODE_038297 visits row-major; CODE_0390C5
repairs merged halves at their visit while retaining the latched $0B89 ID.
Residential/commercial/industrial workers add their pre-mutation values to
$0B8B/$0B93/$0B8F. CODE_038196 computes population from these words. A post-growth
recount is different. The JavaScript now accumulates at each visit, retains this
census across derived refresh/save/load, and invalidates it on land-use changes.
The scanner also writes the original redraw marker at center+width+1.

`tools/reference-scan-census.mjs` executes 60 controlled complete scans in the
preserved USA ROM, checking RCI counters, zone counts, population, seven RNG
words and all 12,000 map words. All pass. Fixtures and ROM/runner hashes are in
`reference-scan-census.json`; replay tests also cover refresh, save restoration,
legacy/invalid counter fallback and construction invalidation. The old runner
failure came from Lua io/os being disabled. The replacement compares in Lua and
returns diagnostic exit codes, requiring no permission/config change.

367 Node tests pass. Real Chromium checks verify 20,000/20,000 full treatment,
4,000/20,000 second-plant allocation, corrected pipe/water labels, enable/disable,
underground connectors and mobile fit, without page errors. Police/fire footprint
browser regression passes. Desktop/mobile/underground screenshots inspected.

Full original-game fidelity remains unfinished: natural scan/calendar/actor
coordination, original interface parity and mixed SPC/DSP audio remain open.
The separately requested realistic civic art replacement is being generated and
is not claimed complete by this release.
