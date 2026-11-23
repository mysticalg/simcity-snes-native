# Repeated utility work: v0.2.52

This pass reduces repeated work in the existing custom Turbo utility models.
It does not change their balance or claim that water/sewage are SNES features.
The underlying ROM-derived power traversal is unchanged.

## Effective building maps

Restored cities have a `disabledBuildings` object, including when it is empty.
The previous operations wrapper copied the entire city map for every power
update and service-plane read whenever that object existed. It then copied
power bits back across every map word after traversal.

`operationalMap` now allocates a workspace only when a saved disabled entry
actually matches a current map tile. Disabled facilities still receive the
same temporary mask, with their metadata retained. If the real map was used,
the power worker already wrote its output there; a second whole-map writeback
is unnecessary. A masked workspace still receives the original writeback.
Zone filtering and restoration of the caller's map/zone references remain.

The callers are the power worker and read-only service-plane readers. There
is no cached operational map, changed power capacity, skipped simulation tick
or new power connectivity rule.

## Shared pipe connectivity

Water allocation and sewage repeatedly built identical pipe components.
`pipeTopology` retains one current node snapshot, label plane and component
list per live city, held through a WeakMap. Reuse requires the same width,
length and **every node's connectivity value**. No revision counter or hash
can conceal an in-place pipe edit. Old topology is replaced when it changes.

Row-major component roots and N/E/S/W breadth-first member order match the
previous workers, including roots used for regional water allocations.
Private component lists are frozen; water results receive independent mutable
copies. Preview output cannot mutate the cached graph.

Pump/tower state, available storage, regional supply, demand, assignments,
sewage debt, collection, treatment and outfalls are recalculated each call.
Only connectivity is reused. This adds bounded retained connectivity data per
live city in exchange for less repeated traversal and allocation; it does not
retain a history of graphs or add canvases/textures.

## Verification

* 544 Node tests pass. Focused checks cover lazy copies, disabled generation,
  outage/recovery, metadata bits, input ownership, component ordering, width
  changes, in-place edits and output ownership through subsequent calls.
* Against exact public `7f36c07` workers: **900 complete water comparisons**
  across four map sizes and edits to pipes, capacity, tower storage and
  regional supply; **12 complete sewage comparisons** covering network cuts,
  switched-off pumps/plants, debt, education, outfalls and blackouts; and
  **72 full saved-state comparisons** for facility/power/service operations.
* Four Node runs use the same restored active MegaCity, with the actual app's
  building-operations, health-care and financial-safety wrappers installed.
  Twenty steps produce identical complete saved state and service results.
* Four browser runs at 16x with night/rain/high FX/photoreal art preserve the
  same 300 fixed-clock callbacks, 300 painted frames, 106 simulation steps,
  4,800 visual frames and entire saved state. State SHA-256 remains
  `808f65910eec5d5d8673c8be3498576a5832ddd1ec6cf6c9fb221efa29e1393e`.
* The live app checker compares complete water/sewage outputs and route order
  to previous workers, switches a heavy pump off/on, cuts a pipe network,
  disables all generation and restores it, then reloads. Supply drops from
  45 to 44 working pumps when one is off, western zones lose supply after
  the cut, and total blackout stops all water/sewage pumping. Recovery and
  reload restore service. Pause and road-route checks pass too.
* Actual app art/night/power/water/pollution/weather/social/session checks and
  the required Practice gameplay client pass. Screenshots were inspected.
  Browser checks report no errors. Art and FX quality/rates are retained.

The public synthetic fixture is the v0.2.51 active-utility fixture: 240x200,
1,720 developed RCI plots, 27 real fusion generators, 45 heavy water pumps,
45 sewage pumps, 23 each treatment/incineration/recycling facilities, and
15 each hospitals/universities/bus stations/stops. No `power.fill` is used.
The Road tool's automatic traffic coverage is active, the map overlay is
`none`, and the underground view is off.

## Timings and remaining limits

These local CPU/render-submission timings are **not user-display FPS**.
Pairs run sequentially, with the second pair reversing candidate/control
order. Source routing is symmetric. Node samples include startup/JIT costs.
Fixed browser runs use a fixed product clock with real outer durations;
their inner stage clocks are not interpreted as CPU durations.

| Measurement | Previous 1 | Revised 1 | Previous 2 | Revised 2 |
| --- | ---: | ---: | ---: | ---: |
| Node 20-step total | 835.37 ms | 733.88 ms | 936.26 ms | 739.05 ms |
| Node step median | 35.62 ms | 34.25 ms | 39.26 ms | 33.35 ms |
| Node 45 power updates combined | 75.93 ms | 68.00 ms | 78.55 ms | 67.10 ms |
| Fixed browser frame median | 18.50 ms | 19.20 ms | 19.60 ms | 18.10 ms |
| Fixed browser frame p95 | 101.40 ms | 102.90 ms | 101.40 ms | 98.40 ms |
| Ordinary capture frame median | 116.00 ms | 108.60 ms | 124.80 ms | 111.30 ms |
| Ordinary capture frame p95 | 160.60 ms | 150.90 ms | 162.20 ms | 153.20 ms |

The first fixed browser pair regresses slightly and the second improves;
full-frame improvement is mixed. Ordinary captures advance different amounts
of simulation with real elapsed time and do not establish equivalent-state
frame rates. There is evidence of less simulation work, but **heavy 16x
frames remain slow**. The release does not claim a universal smoothness gain.
Raw reports and normalized source hashes are in
`utility-performance-v0.2.52.json`.

Further scanning, pollution, allocation, vehicle and FX costs remain, along
with the original global loop, interface/fax and DSP fidelity gaps and the
requested Turbo economy/security/elevated-transport/mega-disaster content.
The full-port goal remains active.
