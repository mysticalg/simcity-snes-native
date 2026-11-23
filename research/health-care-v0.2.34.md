# Health facilities and ambulances

This release integrates the saved player-requested health expansion into the current native JavaScript game. These are Turbo balance rules, not translations of SNES health mechanics. Original native hospital/school census and gift conditions remain separate.

| Facility | Tiles | Service capacity | Passive radius | Ambulances | Home-visit patients/month |
| --- | --- | ---: | ---: | ---: | ---: |
| Pharmacy | 1x1 | 500 | 12 | 1 | 25 |
| Clinic | 1x2 | 1500 | 16 | 1 | 75 |
| Surgery | 2x2 | 2500 | 18 | 1 | 125 |
| Medical centre | 2x3 | 3500 | 22 | 2 | 175 |
| Hospital | 3x3 | 5000 | 24 | 3 | 250 |

Power, enabled state and road access are required. Passive local health uses distance and capacity relative to residents in range. Selecting any health tool shows the existing coverage; the overlay now uses each facility's actual health radius. Inspector meters show city capacity/health, completed home-visit patients and fleet usage. A full monthly patient allocation or a fully dispatched fleet has an explicit status.

Ambulances follow connected orthogonal road paths to populated residential zones with health below75, prioritizing lower health and then resident count. They can serve beyond passive radius. Another reachable facility can take a call when the nearest fleet is busy. Each trip reserves up to8 patients, respecting the facility's monthly patient budget; completed care is applied on arrival, then the ambulance returns. Global fleet limit is64. This is an abstract home-care model, not individual-agent medical simulation. Capacity is people for passive service and patients/month for visits; the inspector distinguishes them.

Each arrival adds at most30 health points, scaled by patients versus estimated need. Prior visit benefits decay15% per simulated month, including after the final facility is removed. The simulation calendar and vehicle animation retain the existing game timing/speed controls; this release does not change global month length. Pause/modal blocking stops travel. Active routes, fractions, care totals, visit benefits and month state use the existing civic save/session object.

## Integration fixes

The private dispatch cache used total population but omitted home positions/health. Moving a residential plot at unchanged total population could drop its old route without issuing a new one. The current key includes actual home identity, resident count and local health. The monthly decay/reset now occurs before the no-facility early return, so demolishing the last hospital cannot freeze its benefits. Route validation removes invalid, broken or evacuated saved missions. `City.zonePopulation` now returns0 for native hospital/school centers129/132, matching their separate CODE_0391DF/039207 facility counters; this also prevents phantom household workers/income from their tile arithmetic. The original96 full scan comparisons still pass. Existing source-derived gift/utility workers, sea-pollution cache and window-light cache are preserved.

## Artwork

Four retained ImageGen masters and lossless runtime images for pharmacy/surgery/medical centre/clinic are copied from the preserved private branch. Their1:1,1:1,2:3 and1:2 plot ratios are retained. The current hospital image is unchanged. A new matching overhead ambulance has a retained RGBA ImageGen master and252x126 lossless WebP; front faces right, matching existing vehicle orientation. Its base and two light-bar phases use three reused32x16 canvases, drawn with the road heading. No per-frame canvas creation or shadow-blur pass is needed. All24 current civic art records are hash-pinned in the manifest.

## Evidence and limits

-457 Node tests pass, including ten focused health checks: five exact footprints/capacities, road-only arrival care, pause, power/off/disconnection, saved missions, moved homes at equal population, alternate fleets, monthly patient conservation/reset post-demolition decay, original hospital/school exclusion and evacuated-home cancellation. Asset hashes and plot/vehicle aspect ratios pass.
- Chromium loads the five facilities through the actual city-file UI, verifies tool/coverage controls and inspector meters, drags a valid clinic blueprint with no construction before release, and observes actual placement after release. Actual photoreal ambulance drawing uses three cached frames; arrival changes care/health. Pause/session refresh and all five mobile health controls pass. Gallery, inspector, mobile and required client screenshots were inspected. One local startup-hook timeout occurred; request/network diagnostics were added and an isolated rerun passed without errors. This does not count the failed run as a pass.
- `health-profile-v0.2.34.json` records local Chromium timings for1833 homes,34 hospitals and64 real road missions: dispatch median2.3ms, cached validation0.6ms, movement below0.1ms and drawing0.1ms. These isolate the health system; they are not total-frame/device-FPS guarantees. All routes stay on roads and only three vehicle canvases are created.

Private `feature/civic-expansion` remains preserved atf491eba. Only functional health work and its selected art are integrated here; private security definitions and unwired economy modules remain unpublished. Full original UI/audio/global scheduling parity, other requested extension systems and broader original-runtime comparisons remain incomplete.
