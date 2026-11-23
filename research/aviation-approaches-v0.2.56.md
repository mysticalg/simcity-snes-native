# Calm heavy-aircraft traffic

The international-airport scheduler could dispatch every 30 visual frames at
high demand, and every arrival began at the same western edge on the same
straight route. Its twenty-aircraft limit created a continuous line of planes.

This update changes the requested Turbo aircraft system:

* International movements are spaced 28–38 visual seconds apart at 1×, with at
  most four aircraft per international airport. Other airfields have smaller
  visible fleets; total visible fleets are bounded too. Game-speed scaling is
  retained. Airport service demand and its growth penalties are unchanged.
* Arrivals rotate through all four map edges with varied entry positions.
  Curved paths align with the existing horizontal runway against the wind.
  Some arrivals fly an oval holding circuit; reservations can add further
  circuits when a runway is busy. Heading changes are limited each frame.
* Runway reservations separate landing/takeoff use by at least eight visual
  seconds. Departures wait at gates when necessary. Excess arrivals wait
  off-map, rather than stopping in midair on the visible final approach.
* Passenger and cargo heavies are larger and slower. Passenger jets move at
  3.6 tiles/second rather than 18, with a 39×35-pixel outline rather than 25×22.
  The top-down drawing includes four engine nacelles, swept wings, a raised
  forward deck, metal shading and windows. These are game illustrations.
* The air-traffic map follows actual curved flight plans and holding circuits.
  Its legend shows aircraft counts; airport inspectors distinguish service
  capacity from the smaller active fleet.

Saved version-one traffic queues upgrade once to version two. Old straight-line
aircraft are removed and departures are staggered, while clock, sequence,
next identifier and airport totals are retained. Version-two flights preserve
their routes, progress and bookings through reload. The separate original SNES
aircraft worker is unchanged.

## Verification

555 Node tests pass. The new busy-airport test follows 36,000 individual visual
frames, verifying a maximum of four aircraft, dispatch spacing, all four entry
edges, actual holding/landing/taxi/departure phases, bounded speed and heading,
nonoverlapping runway use, and separated bookings. Other checks cover legacy
migration, pause, save/restore, airport operating requirements, capacity/growth
effects, all existing aircraft classes and route overlays. Existing traffic
tests now observe aircraft over time rather than require every class to appear
simultaneously after twenty seconds.

An actual-browser test loads a synthetic, genuinely powered 1,371,120-resident
megacity with an old twenty-plane queue. Migration preserves its totals. Over
the test, 28 new aircraft use all four entry edges, with at most four active;
holding motion covers about three tiles in one visual second and changes
heading. Arrivals/departures complete, pause freezes the fleet, and session
reload restores the exact flight state. Curved overlays and a close-up of the
heavy aircraft are inspected. The required gameplay client also reaches
Practice City in February 1900. Browser checks report no errors.

`tools/check-aircraft-approaches.mjs` reproduces the browser test;
`tests/aviation-approaches.test.js` covers the core regression. Compact evidence
and source hashes are in `aviation-approaches-verification-v0.2.56.json`.
Raw screenshots and synthetic test saves stay private under `output/`.

These are Turbo game rules, not an aircraft-performance model or a claim of
original-ROM aviation parity. This targeted release does not complete the
larger reconstruction.
