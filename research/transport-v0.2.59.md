# v0.2.59 — high-density roads and multi-level transit

Player-requested Turbo extensions: high-density roads, monorail over roads with stations, subway and conventional rail that changes level. This scoped update follows the verified v58 park/plaza release; unrelated original-ROM/fax work stays paused. These mechanics and graphics are new native JavaScript/Canvas features, not claimed as SNES behavior.

## Use

All tools are under Transport. Draw with the normal line/freehand/rectangle tools; blueprints commit on release and preserve each tool's draw settings.

- High-density road: $50 new / $40 to upgrade an existing native road. Four-lane appearance, four times the congestion budget; select Replace roads only with Filled rectangle to upgrade existing streets while leaving buildings/empty space untouched. $4 annual surcharge per tile, in addition to normal road maintenance. The traffic field still represents congestion on the native0–240 scale; heavy-road journeys alternate13/12 points versus ordinary50, producing the same50 congestion for four trips.
- Monorail track ($80) and station ($1,000) can sit above ordinary or high-density roads. Roads remain intact. Monorail uses its own higher deck and does not merge with conventional rail at crossings.
- Subway track ($60) goes below buildings, roads and utilities without replacing them. Subway station ($1,000) occupies one surface tile or sits on a road; connect it to the underground track. Selecting subway tools automatically fades the surface, exposing cyan tunnels. Remove subway brushes delete only the underground layer, skipping empty cells.
- Elevated rail ($60) and elevated station ($750) use the raised conventional-rail layer. Place ground rail first at each transition, then Rail ramp: ground ↔ raised ($150), or Rail portal: ground ↔ subway ($150). Extend the corresponding layer from that tile. Levels cross independently; explicit ramps connect them. A single-tile transition is a grade marker, rather than a long terrain slope.
- Underground/elevated construction on water costs twice the listed track/station cost. Transit stations need electricity at the tile or immediately beside it. Two connected powered stations of the same service type create a train route; a conventional route can travel through ground sections via ramps/portals. Stations transfer passengers to nearby streets/native rail. Inspect a station or track for status, route totals, estimated riders and upkeep. The budget lists upgrade, subway, elevated, guideway and station maintenance separately.

## Integration and limits

Layer arrays preserve native surface map IDs. A four-layer connectivity graph joins streets to powered stations and joins conventional rail at ramps. Employment and income use these groups, so districts previously separated by disconnected streets can share jobs through a complete transit line. Native growth checks can use a valid transit connection when the original street walk fails. Native ordinary road/rail rules remain the default for cities without these additions.

Each connected station pair gets a real path through compatible rail nodes. An estimated-demand fleet grows to3 trains per route, with a global limit16; coaches scale with estimated riders. Trains follow the computed route, change visible height at ramps, reverse at endpoints, pause with the city and use the existing speed-scaled animation frame budget. This is aggregate service/commuting simulation, not individual passenger agents or a hard station-throughput limit on employment. Ridership/seat/waiting numbers are estimates. Metro networks are currently local to a city; regional surface-road/rail connectivity continues as before.

Blueprint shadows clone all layer arrays, validate/cost complete strokes and commit atomically. Single bulldozing removes upper stations/tracks before the road below; bulk bulldozing removes all layers. The dedicated subway removal tool preserves surface construction. Versioned save data includes layers, upgrades, grade markers, animation phase and fleet positions. Older cities initialize empty layers without moving existing buildings. Road topology and active-station signatures cache graph/routes; unchanged traffic graphics and simulation revisions reuse the graph.

## Verification

583 Node checks pass. Fourteen focused checks cover road upgrade price/capacity, overlay construction preserving roads/buildings, independent crossings, actual ramp paths, subway portals and pipes, atomic valid/rejected blueprints, all-layer and subway-only demolition, connected vs broken job markets, pause/reversals, repeated saves and exact annual cost totals. Native reference tests remain passing.

Chromium used a genuinely powered fixture with6 operating stations and3 routes. A new subway changed reachable employment from0 to160. A raised train path actually traversed levels2 and0 through two ramps. Mouse dragging built six heavy-road tiles only on release for$300; monorail and a station preserved those surface IDs; tunnel dragging beneath a residential building preserved its full surface map. Inspections and budget rows, paused animation, moving trains and exact fleet/layer reload all passed with no browser errors. Required web-game client reached Practice gameplay; gameplay and targeted above/below-ground screenshots were inspected.

A bounded Node240×200 topology benchmark with11,250 native road tiles and6 stations reused the same graph after simulated revisions: cold12.7ms, warm median0.23ms/max1.92ms on this host. These measure topology reuse only, not whole-browser frame rate. Details, browser results and source hashes are in transport-v0.2.59-verification.json. Public deployment verification is recorded privately after release.
