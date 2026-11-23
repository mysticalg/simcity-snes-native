# Original city themes: v0.2.36

This release adds the original Town and City sequences to the existing Village
theme. It fixes audible articulation, fade and release errors in that theme.
The playable game remains native JavaScript; Mesen is only a private reference
runner and is not shipped with the site.

## Source path and corrections

* 65816 `CODE_01B3F3` queues music command `$0CA5 + 1` through zero-page `$03`;
  `CODE_009870` sends that queue to APU port 0. `$0CA5` is the city promotion
  stage, advanced by `CODE_03C0FA`. The browser selects commands 1, 2 and 3 for
  Village, Town and City respectively. Higher categories currently retain 3;
  their actual themes are **not implemented** by this release.
* SPC `CODE_13C9` selects an order list through `$1B10`; `CODE_1453..14AD`
  loads shared eight-channel patterns. All three supported themes use channel
  zero as their first pattern-ending stream. The planner is restricted to these
  verified IDs; it is not a general solution for all nineteen music commands.
* `CODE_14DA` replaces articulation when a new prefix occurs. The decoder
  previously spread saved state after that value, overwriting the new prefix
  with the previous pattern's articulation. Consequently its first and later
  body repeats differed incorrectly. All supported repeated bodies now agree.
* `CODE_16BD` installs a channel-volume fade, and `CODE_1869` advances it before
  mixing on the same logical tick. The previous decoder delayed its first step
  by one tick. At track 1/channel 2/tick 1296, the original volume is 197 and
  left DSP volume 4, rather than 200 and 5.
* `CODE_1920..1987` keys off when the gate countdown expires **or** the remaining
  duration reaches two, subject to tie lookahead. `CODE_192D..1975` looks through
  prefixes, command operands and phrase calls/returns without executing them.
  This can see a tie beyond the shared boundary that will replace the stream.
  Track 3/channel 7/tick 19 is a concrete case: its five-tick note remains on
  until the pattern is replaced at tick 24. It must not key off at tick 22.

## Original-execution verification

Run `node tools/reference-spc-city-themes.mjs` with the preserved ROM and pinned
Mesen runner. The generated Lua calls the original `13C9` startup, two `1440`
initialization/pattern ticks, then the original `1440` routine once per logical
tick. The 65816 is held in a private scratch loop; SFX are silent.

`reference-spc-city-themes.json` pins the ROM, ARAM and runner hashes and records
the compared native plan. Across three patterns per theme (intro plus two body
passes), **13,680 logical ticks and 3,423 note starts pass**:

* exact RAM key-on masks on every tick, including ticks without notes;
* sample number, pitch bytes, stereo volume, tempo and master volume at every
  note start;
* KOFF presence/absence throughout every planned note gate;
* stereo register values throughout those gates, including sustained fades.

This is a comparison with executed original instructions, not a self-comparison
between two JavaScript parsers. Node assertions retain the captured evidence,
test phrase/tie edge cases, and check repeat stability and category selection.

The browser check renders the first **12 seconds** of both added themes through
the actual BRR/Web Audio scheduler into stereo OfflineAudioContexts. It checks
finite PCM and nonzero energy in the introduction and two body windows. This
does not compare PCM waveforms with original DSP output or render a full track.
Live playback retains the one-second scheduling window and 100ms scheduler;
whole compositions are not attached to the live audio graph at once. Pending
music starts are invalidated by stop or a newer request.

## Remaining gaps

The reference supplies logical ticks directly; absolute track-start timer phase
and the inter-tick vibrato interpolation are not verified by this capture.
Echo/FIR, full SPC DSP resampling/noise, shared SFX voice arbitration, global
tempo/master automation and later city/menu/event themes still require work.
The supported themes are a dry reconstruction with existing native envelope
and vibrato support. This is not full original audio parity. Full original UI,
natural global scheduling and remaining simulation comparisons also remain open.
The existing public Turbo extensions, photoreal civic/amenity art and recent
heavy-city pollution/lighting caches are retained; private economy/security
foundations are not part of this release.
