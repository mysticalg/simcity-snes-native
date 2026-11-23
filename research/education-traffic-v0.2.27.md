# Education variety, automatic overlays and growing air traffic

These are requested Turbo extensions; remaining original-game fidelity is not claimed complete.

## Education

| Institution | Plot | Capacity | Radius | Strength | Build / annual upkeep |
|---|---:|---:|---:|---:|---:|
| School | 1×1 | 6,000 | 20 | 100% | $500 / $150 |
| College | 2×1 | 12,000 | 32 | 100% | $2,000 / $300 |
| University | 4×4 | 25,000 | 48 | 100% | $5,000 / $600 |
| Nursery | 1×1 | 1,500 | 14 | 45% | $200 / $60 |
| Preschool | 1×2 | 3,000 | 20 | 65% | $350 / $100 |
| Library | 2×2 | 6,000 | 30 | 70% | $700 / $140 |
| Private school | 2×2 | 10,000 | 32 | 115% | $1,500 / $300 |
| Special school | 2×3 | 5,000 | 28 | 110% | $1,200 / $250 |

Existing school/college capacities double; university capacity increases 2.5×. All three ranges increase. The service field has a full-strength inner 65% of its Manhattan radius and tapers at its edge, accounting for local population load. Institution contributions combine and cap at 100%. Actual monthly city education now approaches the resident-weighted service target at 1/12 of the remaining difference per month (previously 1/24 toward a citywide capacity ratio). Thus reach affects actual benefits, not just an overlay. Existing education reductions in crime, waste and sickness and productivity benefits use the resulting education level.

The same field drives build coverage and residential education overlays. Inspection shows capacity, current education, residents in range, target, range, strength and costs. Power/road access and disabled state apply. Five ImageGen masters and small runtime textures are preserved under `assets/education/`; the preschool's initial pale background was cleaned with ImageGen into v2, retaining v1 as an unused original.

## Build and map overlays

Parks, stadium and ordinary gifts automatically show land value while placement remains active; police/fire headquarters retain their service overlays. Road/bus tools show road traffic, rail shows line demand versus available seats, and airport tools show air traffic. Road/rail shading follows the corresponding network rather than coloring unrelated land. Manual rail/air overlays are also available. The air overlay keeps the extra aircraft moving and visible while the city runs. Bitmap/numeric caches avoid per-tile graph reconstruction and excess hot-path allocations.

## Aviation growth and congestion

The original 6×6 airport now participates in the extra fleet alongside its preserved ROM plane actor. Flight demand increases with population and jobs and is allocated among operating civilian airports. Aircraft limits are 6 municipal / 12 original airport / 20 international; fighter demand also grows. Dispatch accelerates toward the requested load. Airport and city airspace limits create waiting flights and growth penalties (up to −200 commercial / −100 industrial demand), reported in the growth advisor and airport inspection. Adding airports increases both airport capacity and managed airspace capacity, within map-size limits. Passenger, regional-jet and cargo models, route state, pause and reload remain supported.

Verified: **416 Node checks**, including exact new education footprints, reach/capacity/disable effects, actual monthly education, all overlay mappings, rail demand/seat fields, original-airport flight growth, save/pause and congestion relief. Real browser tests exercise all education options and mouse placements, gift/park/road/rail/air overlays with build controls retained, manual traffic maps including live aircraft, education inspection/progress and reload. The actual small-city fixture produced 1 extra flight versus 4–5 in the larger fixture over the same interval. Prior aviation and service-overlay browser regressions also pass. Screenshots inspected; no page errors.

Regional inventory/depot/production integration, private civic/security/disaster/transport expansion, missing original gifts and full source/runtime/audio parity remain unfinished. Pure economy foundation modules are retained separately and are not a playable economy release.
