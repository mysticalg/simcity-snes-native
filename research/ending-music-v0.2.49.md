# Native victory and failure music: v0.2.49

The scenario ending routine `03E2DF` requests music command `$11` for success
and `$12` for failure. The SPC start handler `13C9` selects those order lists
through `DATA_1B10`. Both lists contain one complete pattern and a terminal
zero; they must not restart the last pattern like the existing city themes.

## Original sequence and timing

| Command | Order / pattern | Active ticks | Note starts | Relative duration |
| --- | --- | ---: | ---: | ---: |
| `$11` victory | `$302B` / `$302F` | 312 | 59 | 7.608 seconds |
| `$12` failure | `$3103` / `$3107` | 480 | 74 | 7.928 seconds |

The shared scheduler now supports those finite order lists, retaining the
existing channel-zero pattern boundary, commands, global/voice state, samples,
pitch, stereo mix, envelopes, gate/tie behavior and supported vibrato scheduling.
`createSpcFiniteClock` retains the final tempo-phase boundary without inventing
a loop; requests beyond that finite timeline fail explicitly. The six city
themes retain their existing loops and planning paths.

At the terminal tick, `1453` reads the zero order and branches to `13AD`:
the driver clears music ID `$0D` and active channel mask `$47`, requests all
non-SFX music voices off through `$46`, and emits no new note. Native playback
keeps the finite result marked ended, clears its scheduler timer and allows
scheduled envelope releases to finish. It neither repeats the passage nor
starts the next city theme while the result screen remains open.

## Executed original comparisons

`node tools/reference-spc-ending-music.mjs` executes the original SPC startup
and tick routines for both complete endings. All **792 active logical ticks**,
**133 note starts**, and both exact terminal ticks pass. It checks sample ID,
pitch bytes, stereo levels, tempo/master at note starts; all-tick global Q8
tempo/master and fade counters; KON masks; active-note KOFF/stereo gates; and
the final stopped state. This includes the final ties, rather than validating
only an opening phrase. SFX are silent in this controlled original comparison.

`node tools/reference-spc-ending-clock.mjs` executes `08AE..08B7` for all
**7,768 timer pulses** in the two plans. Every phase byte and carry boundary
matches the supplied, source-verified tempo timeline. Durations above use
relative initial phase zero and the original 2ms pulse length. Absolute
cartridge startup/command transport phase is not asserted. Original reports
retain the exact cases and ROM/ARAM/Mesen hashes.

## Playback integration

With MUSIC enabled, an actual scenario result screen selects the recorded
success/failure command. Closing the result cancels any remaining ending
voices and resumes the city's promotion theme, following Turbo's existing
continued-city behavior. A generic dialog or rereading the recorded result in
Information does not replay the ending. Music still starts through a user
gesture; separate MUSIC/SFX toggles and session-gesture restoration remain.

The common music scheduler is shared with city playback. Generation guards
cancel superseded starts and ignore stale callbacks, including a rapid close
before fetching samples completes. Finite playback records zero loop cycles.
Ending sample data is read from the extracted ARAM and original BRR/WAV assets;
there are no invented notes, new synthesized replacement melodies, or game
emulator wrappers.

## Browser, PCM and regression evidence

**530 Node tests pass.** New checks cover complete original note/global/gate
goldens, every original finite-clock carry boundary, finite endpoints, exact
one-shot voice scheduling, unchanged SFX, timer shutdown, cancellation/stale
callbacks and explicit rejection of unrelated/unsupported commands.

`node tools/check-ending-music.mjs` renders both full scores through the actual
Web Audio voice path into 11-second stereo OfflineAudioContexts. Every emitted
voice's sample/pitch/start/gate/stereo matches the original-verified note plan.
All samples are finite, energy is nonzero, peaks are below full scale, and
the rendered tails after nine seconds are exactly zero. Muted PCM is zero.
The local 32kHz float WAV captures are fully decoded with FFmpeg; they are
diagnostics rather than added public replacement assets.

The actual game check uses 150 developed, powered residential zones and five
real coal plants (120,000 residents), then steps into win/loss outcomes. Live
AudioContext analyser output is nonzero for both, with the context running.
Victory schedules all 59 voices once, reaches its terminal state and clears
the timer without a loop. Early close cancels failure playback. City theme 5
returns after either result closes. Separate toggles, session gesture resume
without replay and actual mobile taps through victory/continue all pass.

The existing six-city-theme browser regression also passes: category tracks
1..6, complete voice/mix schedules and loops, positive finite rendered PCM for
themes 2..6, live analyser output, cancellation, mute and independent toggles.
The scenario-record/lifecycle browser check passes after sharing its unchanged
real powered fixture with the music check. The required gameplay client enters
Practice City; current gameplay/result/touch screenshots were inspected.

`ending-music-verification-v0.2.49.json` retains browser results, source hashes
and the city-theme regression. Public deployment/source/playback is verified
separately before claiming the release live.

## Fidelity still missing

This is original sequence/sample playback with source-verified note/register
timing and emitted native PCM. It is **not** a matched full SNES DSP waveform.
Echo/FIR, noise, complete hardware voice arbitration/resampling, some modulation
details and absolute startup phase remain incomplete. The original fax-machine
background/scroll/HDMA/glass/cord/transmission animation, other menu/event music,
remaining global simulation/interface behavior and requested Turbo content
still need work. Heavy-city long-frame optimization also remains active; no
new rendering/FPS claim is made by this audio release.
