# Waste services, infinite money and utility rendering — v0.2.16

## Player requests

Added Recycling centre (tool49/tile975) and Garbage collection depot (tool50/tile976) under Services. Both occupy square2×2 plots, need electricity and nearby road access, support drawing/preview/replacement and enable/disable, contribute named annual upkeep, and survive save/session/region storage. Their independently generated ImageGen sprites are kept in assets/custom/civic-15.png and civic-16.png; exact prompts, IDs and hashes are in [WASTE-ASSETS.md](../assets/custom/WASTE-ASSETS.md) and waste-manifest.json. Full images remain intact; the live renderer creates reusable128-pixel thumbnails. Recycling has conveyor activity; the depot has warning beacons and dispatches four visible road-bound trucks rather than the default two.

| Service | Build / annual upkeep | Monthly role |
| --- | --- | --- |
| Recycling centre | $2,000 / $250 | Processes4,000 abstract waste units |
| Collection depot | $1,000 / $150 | Adds12,000 pickup/transport capacity; creates no disposal capacity |
| Existing incinerator | $3,000 / $400 | Processes6,000 units |
| Existing landfill tile | $50 / $10 | Accepts up to1,000 units into10,000 permanent storage |

These are custom player systems, not SNES mechanics. Generation is now0.1 × (displayed population +8 × commercial/industrial census), reduced by education as before, rounded upward monthly. This is one tenth of the previous rate. Existing stored rubbish and sewage debt are preserved, with no mass reset or save migration.

Collection and disposal are distinct limits. Basic pickup is5,000 plus2,000 per operating recycler/incinerator plus500 per enabled road-accessible landfill tile, with12,000 per operating depot added. With no active waste services pickup is0. Regional collection retains its previous external-capacity behavior. Recycling takes priority, then incineration, regional handling, and landfill deposits. New/uncollected waste takes priority over stored waste. Spare pickup and processing capacity can now reclaim rubbish already stored in enabled road-accessible landfills; filled sites are no longer permanently stuck. Recycled, burned, deposited, reclaimed, remaining backlog, landfill change, processing capacity and pickup capacity are reported separately. A depot by itself cannot make waste disappear. An incinerator or recycler with spare processing can still be limited by pickup.

The accounting remains citywide: local road/power gates are checked, and illustrated trucks follow real road routes, but household mass is not yet tied to each physical truck trip or separate road component. Recycling uses aggregate waste, without material-specific sorting fractions. These remain explicit extension limits.

Double-click the date to toggle infinite money. The date and funds display show∞ while active; Enter/Space on the focused date also toggles. Construction and annual-budget deductions stop, but real blueprint prices, site validity, funding calculations, simulation activity and service capacity remain. The finite treasury is preserved, save/session includes the flag, and ordinary affordability/financial-emergency checks return when disabled. Older saves default to disabled. The HUD explicitly accepts pointer input on the date (the HUD otherwise passes pointer events through).

## Slowdown investigation and fixes

The player confirmed the slowdown occurred in normal city view, and suspected sewage pollution. A private saved copy of the affected city was profiled without reloading/resuming its live browser tab. It contained4 sewage pumps,556 pipe tiles,1,748 landfill tiles and32 contaminated sea tiles. The city save is kept out of the repository. A comparison clearing only the sea-pollution array did not improve timings; the main sampled cost was landfill rubbish being repainted with thousands of fillRect calls on every draw.

- Cache landfill sprites by their visible fill stage, deterministic pile variant and boundary edges. The cache is bounded to1,024 sprites. Large sites use one shared layer with only changed eight-pixel cells updated. Offscreen facilities are culled. Stored rubbish still changes the rendered piles when filled or reclaimed.
- Budget/HUD upkeep now sums enabled facility costs directly rather than recomputing water allocation, bus routes and garbage-service graphs just to obtain an annual number. Tests compare totals through power and enable changes.
- Underground coverage/grid/pipe geometry is cached independently of the ghosted surface and moving flows. Pipe edits, allocation, city revision and visible bounds invalidate it. Removed the redundant full pipe pass underneath the underground background. Initial/rebuilt layers still cost more than a cached draw.
- Batch animated water/sewage arrow geometry into two paths, retaining direction, amount, visual-time motion and pause behavior.

Sequential local Chromium measurements, not display-FPS guarantees:

| Scene / measurement | v0.2.15 | v0.2.16 candidate |
| --- | --- | --- |
| Affected city, normal-view forced redraw at8× setting, median / p95 |58.1 /137.1 ms|10.9 /16.0 ms|
| Affected city, running8× animation callback, median / p95 |46.0 /99.9 ms|18.2 /51.0 ms|
| Dense synthetic underground,32 pumps /12,000 pipe tiles, paused redraw median / p95 |170.0 /347.5 ms|1.3 /3.8 ms|

Running tests raise only the private profiling copy's treasury to avoid its financial pause; the city map and pollution are preserved for the original variant. A separate variant clears sea pollution. Same local Chromium/viewport and sequential baseline/candidate modules are used. System load and GPU presentation were not controlled; high-speed simulation still produces occasional slower callbacks. Raw scalar timings/profiler summaries are in [utility-performance-v0.2.16.json](utility-performance-v0.2.16.json). Private map content is not included.

## Verification and remaining work

353 Node tests passed, including waste generation, distinct pickup/disposal, landfill reclamation with mass conservation, power/road/off rejection, actual depot routes, preserved stock and save flags, cheat affordability and genuine blueprint prices, annual funding and returning deficit rules. Browser checks cover actual mouse plops and price/payment, reports, toggles, session reload, mobile dialog fit, double-click/keyboard money toggle, free construction with finite treasury preserved, and cache invalidation/pure rendering.2,112 landfill raster cases compare against the previous renderer, allowing at most2/255 per-channel difference from canvas edge antialiasing; masks/piles and boundaries are retained. A cached underground layer is reused across20 unchanged draws and rebuilt after a pipe edit.

The full native SNES port remains unfinished. Pre-growth census accumulation/global scan scheduling and natural-state comparisons, original UI/news/camera behavior, shared SPC channel priority/restoration and remaining mixed-audio/DSP verification remain open. This release prioritises the player's new services, cheat and observed performance fault; it does not establish whole-game parity.
