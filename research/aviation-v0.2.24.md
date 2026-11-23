# Municipal/international airports and military aviation

Player-requested Turbo expansion. Native SNES airport/plane routines remain represented separately; these new facilities are not claims of original-ROM behavior.

| Facility | Footprint | Build / annual upkeep | Function |
|---|---:|---:|---|
| Municipal airport | 4×4 | $5,000 / $500 | Light single-engine aircraft and private jets; up to 3 active aircraft |
| International airport | **24×18** | $50,000 / $4,000 | Cargo and super-jumbo aircraft; up to 8 active aircraft |
| Military airbase | 8×8 | $20,000 / $1,500 | Fighter patrols; up to 4 active fighters; industrial benefit |

The international airport is exactly four times the original 6×6 airport's width and three times its height. Each new facility needs electricity, adjacent road access and supplied water once the water system is enabled. Both civilian airports count toward the commercial airport requirement. Complete footprints can be inspected/demolished from any plot tile, and placement uses existing drag/blueprint/cost controls.

Five aircraft models have distinct speed, dimensions, payload and role. Saved state includes route waypoints, segment progress, altitude, heading, next dispatch, actor IDs and monthly movement counts. Arrival, takeoff and fighter-patrol routes use the facility's runway location. Simulation-frame integration makes dispatch and crossings independent of browser frame chunking. The global animation clock supplies speed scaling; pause/underground/map views block these actors. Power loss, closure or demolition cancels that facility's fleet. Active fleets are capped and viewport-culled.

Completed flights update passenger/cargo handling estimates; these are not commodity inventory transfers. The regional freight/stock/price/extraction system remains outstanding. Military bases give a **non-stacking +15% industrial tax-contract bonus** and +120 industrial demand while operating. This bonus is calculated only from industrial assessment units and has its own budget income row, including locked annual assessments.

Three built-in ImageGen masters are preserved with SHA-256 metadata. Lossless runtime textures are 252px for municipal, 768px long edge for international and 384px for military. The renderer retains enough airport detail while preserving small civic sprite caching for ordinary facilities.

Verification: **403 Node checks**, including exact plot sizes/removal, operational gates, all five fleet types, deterministic chunking, pause, arrivals/departures/cargo/sorties, exact flight restore, shutdown, industrial tax and growth-requirement census. Real browser checks verify moving models, 960 animation frames per second at 16×, pause, the 24×18 held blueprint with no early placement, $50,000 release placement, nonzero cargo meter and saved fleet after refresh. Screenshots inspected; no page errors. No original runtime comparison is claimed for these new Turbo mechanics.
