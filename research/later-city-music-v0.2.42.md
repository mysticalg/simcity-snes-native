# Six original city themes: v0.2.42

Capital, Metropolis and Megalopolis now use their original music commands 4,
5 and 6. Commands 1–3 retain their verified Village, Town and City planners.
Selection follows original promotion stage, including retention after a later
population decline. Music remains native JavaScript/Web Audio; the reference
emulator is private and is not part of the playable application.

## Shared driver state

The independent-channel decoder could not implement global tempo/master fades.
The new planner clips each stream to the source's shared pattern boundary,
executes controls in channel order, then advances shared state at the original
end-of-tick point. Unknown commands still fail explicitly.

* `SPC_164D/1657` implement E5/E6 master volume; `1669/166E` implement E7/E8
  tempo. `17F8` calculates the signed Q8 increment. The low fractional byte is
  retained by a new fade; the last countdown step lands exactly on its target.
  A zero countdown is inactive. Immediate E5/E7 setters clear the fractional
  byte **without cancelling an already running fade**.
* `153D..1577` advances global fades after stream commands. Metropolis is an
  important concrete case: its 50-tick ramp begins at 12, but the body starts
  at tick 42 with E7=20 while eight fade ticks remain. The original tempo
  briefly reaches 21 before landing back on 20. The reconstruction retains it.
* The FA instrument base is shared. `0906/15A6` maps percussion CA/CB through
  that base and plays at note A4. Metropolis channel 4 uses original samples
  23/24; treating the base as channel-local incorrectly selected sample zero.
* Channel volume uses the same Q8 ramp rules. `1869..18FB` writes stereo only
  when the original dirty conditions require it. A tie at tick 1512 in the
  Megalopolis theme changes articulation but does not immediately rewrite its
  held voice's stereo. Its original 7/14 register values are preserved.

## Timing and complete order loops

`08AE..08B7` adds the current tempo to the timer phase byte on each supplied
2 ms pulse; carry advances the music tick. New note, gate, gain and vibrato
scheduling follows that changing clock. Phase is carried across loops.
The relative first-tick phase remains zero, as in the earlier player; absolute
track-start hardware phase is not claimed reproduced.

Megalopolis has a six-pattern cycle. Repeating only the final pattern would
discard most of its composition. The planner retains the complete last cycle,
and its repeat clock caches at most 256 phase states rather than accumulating
an unbounded per-tick playback history.

## Executed original comparisons

`node tools/reference-spc-advanced-themes.mjs` starts the original SPC driver
and supplies logical ticks with silent SFX. Capital/Metropolis use intro plus
two body passes; Megalopolis is checked for three complete six-pattern cycles.
The pinned `reference-spc-advanced-themes.json` records **29,826 ticks and 8,447
note starts**, all passing:

* exact tempo/master Q8 values and both fade countdowns every tick;
* exact key-on masks, including ticks with no note;
* sample, pitch, stereo, tempo and master registers at each note start;
* KOFF presence and stereo automation through the planned active gates.

`reference-spc-tempo-clock.mjs` separately executes the original `08AE..08B7`
instructions with one timer pulse per call. **13,525 phase/carry comparisons**
pass across twelve windows covering introductions, ramps, pattern changes and
loop positions a million repeats later. This tests supplied relative phase and
source-verified tempos, not wall-clock startup latency or coalesced timers.

The original three-theme evidence remains unchanged. **491 Node checks pass**,
including all new driver/clock goldens, the held-tie and percussion regressions,
steady second/third Megalopolis cycles and bounded repeat memory.

## Browser playback

`check-city-music.mjs` uses the canonical loaded audio module. It renders
12-second stereo PCM passages for themes 2–5 and 36 seconds for theme 6,
including a master-fade window. Samples are finite and have nonzero energy.
It also checks every first-plan voice's sample/pitch/start/gate/stereo and mix
automation offsets against the source-verified plan, plus complete-loop entry
and repeated scheduling. A live AnalyserNode after a user gesture measures
nonzero output with an actually running AudioContext and scheduled voices.
These verify emitted browser audio; they do not compare original DSP waveforms.

All six live category selections, retained promotion stage, pending-start
cancellation, independent music/SFX toggles and actual zero PCM when muted pass.
The required gameplay client enters Practice City, and screenshots were inspected.

Echo/FIR, full DSP resampling/noise, inter-tick vibrato waveform parity, hardware
music/SFX voice arbitration, absolute startup phase and later menu/event music
remain incomplete. The full game port is still in progress. The existing
photoreal assets, Turbo systems and v0.2.41 heavy-city drawing optimizations are
retained; this release makes no new whole-game performance claim.
