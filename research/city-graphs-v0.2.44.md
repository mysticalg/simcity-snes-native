# Original graph records and City Graphs: v0.2.44

The monthly loop `CODE_038016` increments the month and calls `038BD1`.
January then calls `038D29` before the new annual budget `038DF1`.
These graph workers are now translated and integrated into the city tick.

## Reconstructed records

Six series each retain 120 monthly words (ten years) and 120 January words
(120 years), newest first. Monthly addresses are residential `$7F5FC0`,
commercial `$7F60B0`, industrial `$7F61A0`, crime `$7F6470`, pollution `$7F6290`
and finances `$7F6380`. Their annual counterparts begin at `$7F6560`, `$7F6650`,
`$7F6740`, `$7F6A10`, `$7F6830` and `$7F6920` respectively.

* `03C6A6` initializes RCI/crime/pollution to zero and finances to `$0080`.
* Each shift discards index 119 and calculates the old population maxima from
  indices 0–118. New R values use the census word divided by eight; C/I use
  their census words directly. The literal `$0C63/$0C6B` peak bookkeeping is
  preserved, including the monthly update to the longer-term scale.
* Crime `$0C01` and pollution `$0C07` approach their prior graph trends by
  one quarter of the signed 16-bit difference. Negative differences use
  arithmetic shifts, rounding down. The trend register retains its word;
  the recorded graph value clamps to 255.
* Finances read the previous settled annual net `$0BC1`. The source adds
  `$0A00`, checks the resulting word's sign, divides positive values by 20
  and clamps to 255. Zero net therefore has index 128. January copies the
  latest monthly crime/pollution/finance values before settling its new budget.
* The worker also updates hospital/school demand `$0B97/$0B99` from the
  residential high byte and facility counts. Those flags are included in
  the original comparisons; the existing facility consumer remains intact.

The source helper preserves register-width quirks. The Turbo adapter widens
megacity RCI observations and clips large financial surpluses/deficits without
16-bit wrap. These extensions are explicitly separate from native behavior.
For example, the native finance branch wraps at a net of 30,208; Turbo displays
the appropriate high surplus index instead. The same graph-state shape is
retained, and long-term peaks include widened counts.

`03894C` reads the newest monthly graph words for demand. The actual demand
tick now consumes those records, converting the R word back to the demand
adapter's pre-division units. Older saves retain their existing history fallback
until a new source-backed month is recorded.

Pollution's graph input is captured with the scheduled land/pollution worker,
sampling nonzero half-resolution cells once. Monthly graph recording uses the
previous scheduled means before the later field pass. Custom air pollution and
education still extend the source input fields; their models are not asserted
original-equivalent.

## Executed original evidence

`node tools/reference-graphs.mjs` executes original initialization plus 72
controlled monthly/January pairs in the pinned USA ROM. **210,528 word
comparisons pass**: all twelve history planes after each worker, maxima,
smoothed registers and both facility-demand flags. Fixtures include random
histories, discarded-oldest maxima, negative rounding, signed finance edges
and arbitrary register-width values. `reference-graphs.json` pins ROM/Mesen
hashes and retains inputs and expected outputs. No reference emulator ships
in the playable application.

**502 Node checks pass**, including the original graph goldens; an actual
January simulation step that preserves pre-budget records; source-graph demand
consumption; save/reload; absent/corrupt history; megacity/Turbo adaptations;
and bounded buffers through centuries of supplied observations.

## Playable interface and persistence

The top row now has **City Graphs**. Six independently selectable lines share
a readable plot, with 10-year and 120-year buttons. RCI use one occupancy scale;
the other series use index 0–255. Finances explain their break-even index.
Mouse/touch point selection and keyboard arrows/Home/End show dated values.
The responsive plot fits mobile widths and resizes with the dialog. The modal
blocks simulation advancement through the existing application loop.

Graph records and trend/peak state persist in normal city, session and regional
serialization. Restoration validates bounded arrays and metadata. Older saves
start collecting new graph observations; past original records are not invented
from the incomplete legacy history. Existing city content, funds and other
saved state are retained.

The actual browser verifier checks a January tick against the source-backed
worker, both ranges, all six toggles, keyboard inspection, mobile touch selection
and closing, viewport resize, downloaded save/reload, session restoration,
modal blocking and a graphless older save. It uses a controlled worker-fed
history fixture; this is **not** a natural 120-year original-ROM run. Desktop,
mobile, touch and required gameplay-client screenshots were inspected.

The added records are bounded to 1,440 numeric values plus metadata, and the
SVG is rebuilt only when its dialog controls or width change. A local Node
microbenchmark of the graph workers plus mean-pollution sampling used 1,000
warmup and 500 measured calls: native median/p95 0.023/0.043 ms, megacity
0.032/0.053 ms. This is helper CPU cost, not browser FPS or full-tick cost.
The photoreal art, v0.2.43 lighting optimization and all six city themes remain.

Original graph-screen PPU composition, natural full-loop/startup comparisons,
other remaining original interface/simulation details, full SPC DSP/menu-event
music and requested Turbo economy/security/transport/disaster content remain
incomplete. This release reconstructs graph data and adds a modern browser
interface; it does not claim the full port is finished.
