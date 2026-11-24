# Saved-city industry and month-end performance, v0.2.64

This is a player-requested Turbo extension. It does not claim SNES fidelity or complete the paused full-port/fax work.

## Behavior

Every simulated month in the loaded region advances one economic round for its saved, inactive cities. Enabled mines consume finite deposits, factories consume real stock, and operating depots trade over the existing compatible regional routes or their allowed outside market. All inactive production runs before inactive shipments; the active city's trade retries when results arrive. Imported inputs become available to the next production round. Enabled mines, factories and depots pay their annual upkeep in twelve installments; an unaffordable production round is marked Insufficient funds and does not extract or manufacture free goods. Closed facilities remain closed. Regional orders and depot capacity are shared across both active and background passes, so a city cannot use its freight allowance twice.

Regions has a global background-industry switch and a saved per-city Background industry and trade switch. Both default on for existing saves. Background production follows simulated regional months and stops with pause; it does not run while the page is closed. Saved native city calendars, zoning/growth, disasters and full city budgets stay frozen. This is economic activity rather than running every city's complete simulation. Trade still requires appropriate powered depots, compatible connected routes, orders, stock and funds; there is no unconditional resource spawning. Main-thread results never overwrite the active city's newer cash or inventory.

## Performance and storage

RegionalEconomy executes economic and inactive utility work in an ordered module Web Worker. The main month path sends compact geometry and economic state rather than serializing and fully restoring the active city. Remote zone-center lookups use a Map instead of repeated linear searches; depot IDs use a Map and road/rail depots no longer scan all zones for airports. Full city serialization encodes JSON once rather than reparsing/re-encoding it in extension wrappers. Automatic UI session-save requests coalesce within a task.

IndexedDB upgrades from version 1 to 2 without replacing the regions store. Small per-city economic overlays and the completed regional clock commit atomically; periodic/explicit saves compact these into full city records off-thread. Session journals retain unacknowledged rounds and economic transfers. Replayed completed rounds are ignored; pending geometry is serialized as arrays, and clock merges cannot rewind queued months. Switching cities, exporting and saving drain ordered work and use the latest economic record.

## Verification

632 Node checks pass, including background mine -> inactive factory -> active importer, finite depletion, money conservation minus upkeep, shortages, independent/global opt-outs, duplicate-round protection, shared freight quotas and save-patch/restart checks.

Real Chromium browser verification stayed in one city for four months: pharmaceutical imports reached 0, 40, 80, 120 while two inactive cities produced and shipped. Native inactive calendars stayed January and their baseStep stayed zero. Turning off a saved city's production and the global switch stopped their respective work. Pause did not advance rounds. An artificially interrupted worker tick survived reload once, with no duplicate production on a second reload. A three-month burst completed three ordered rounds and depletion reached the expected 1,920. Actual v1 IndexedDB migration, overlays, compaction and other-region isolation passed. Prior pause/traffic/held-blueprint/camera, speed 1/4/8/16, sharing/depot trade, hospital and utility-capacity browser flows passed without page errors. Gameplay client and feature screenshots were inspected.

The same local four-city fixture has 647 plots and population 154,560 per city. Four measured month-end main-thread tick/repaint calls went from 79.0, 70.2, 69.5, 63.2 ms to 35.4, 33.4, 32.4, 28.4 ms. Median fell from 69.85 to 32.9 ms, approximately 53%. Main-thread tradeProvider total fell from 118.3 ms over four calls to 4.1 ms. These are bounded synthetic Chromium measurements, not a guarantee of zero stalls or a profile of the user's particular city. Full active-city simulation, rendering and occasional session saves still cost time; large regions can queue worker rounds.

Reproduce using npm test, scripts/verify-background-economy-browser.mjs, scripts/verify-region-store-upgrade-browser.mjs and scripts/profile-regional-months-browser.mjs. The browser scripts accept a base URL; set CHROMIUM_EXECUTABLE when using a non-default installed Chromium. The profiler also accepts a report suffix and module query string. Verification JSON alongside this document records the local evidence. Live publication is verified separately after deployment.
