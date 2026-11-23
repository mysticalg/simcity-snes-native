# Original fax presentation: v0.2.53

The three scenario results now display the original paper, fax machine, wood
table, glass effect, cord and console emblem, with the original text graphics.
The native browser renderer implements this fixed scene from the extracted
cartridge assets; it does not run a CPU/PPU emulator or replay a captured video.

## Original graphics path and reference

`CODE_03DF49` decompresses `08C4DB` and `09875C` into the general-purpose
buffer at offsets 0 and `$4000`, then DMA-copies `$8000` bytes to VRAM byte 0.
It loads a result text map, paper at `$1000`, machine at `$2000` and glass at
`$2800`, copying `$3000` bytes to VRAM byte `$8000`. The result maps are
`0C8539` (failure), `0C82AD` (complete) and `0C83CE` (bonus).

The sprite file `0AC460` is only 512 bytes but its DMA copies `$1000` bytes;
palette `0C8ED8` is 384 bytes but its DMA copies 512. The implementation
preserves the original buffer tail through these operations. Zero-padding
those transfers would not reproduce the actual memory state.

Mode 0 uses a 32x64 text plane at VRAM byte `$8000` with character data at
`$4000`, a 32x64 paper plane at `$9000`, and 32x32 machine/glass planes at
`$A000`/`$A800`. Layer palettes, priority and flip bits are retained. Main
screen `$17`, sub-screen `$08` and subtraction `$A7` produce the glass effect
in 5-bit RGB before expansion. HDMA table `03E23F` changes main layers to
`$14` at the printer cutoff. Objects `$25`/`$26`, from table `00A164`, use
records `00A5BF`/`00A5DA` at cursor coordinates `(264,159)` and `(50,207)`.

The reference tool executes the **original** renderer, COP services,
decompressor, DMA, object generation, fade and NMI code in Mesen. It seeds a
controlled menu entry and holds requested scroll/brightness values for settled
PPU captures; graphics routines are not replaced with JavaScript stubs.

All three scenes match every one of their **49,152 written VRAM bytes, 512
CGRAM bytes and 544 OAM bytes**. The untouched VRAM ranges contain power-on
data and are excluded. The renderer never samples those ranges in this scene.

There are **21 original PPU image comparisons, totaling 1,204,224 visible RGB
pixels**, with zero differences: five full-brightness paper positions and two
additional brightness levels per result. The 256x239 reference framebuffer
is cropped by seven top/eight bottom rows to the original visible 256x224
picture, matching the reference screenshot. Comparison uses original RGB;
expected hashes pack those colors with opaque browser alpha 255.

Mode-0 priority/color-math interpretation was cross-checked against the
[Mesen PPU implementation](https://github.com/SourMesen/Mesen2/blob/master/Core/SNES/SnesPpu.cpp)
and its [5-bit color conversion](https://github.com/SourMesen/Mesen2/blob/master/Core/Shared/ColorUtilities.h).
The pixel/memory comparisons, original data addresses and asset hashes are in
`reference-fax-graphics-v0.2.53.json`.

## Original menu animation path

An additional reference invokes `03D283` with dispatch stage 19, running
`03E2DF -> 03DF49 -> 008E43`, followed by stage 20's
`03E344 -> 059FBB`. It records the display register and both paper/text scroll
words at the original NMI register-upload routine `00833A`.

For failure, ordinary success and first-six bonus success, all **138 states
per outcome / 414 states / 2,481 compared values** match the native model:

| Relative loaded-scene frame | Display | Paper and text Y |
| --- | --- | --- |
| 0 | `$8F`, forced blank | −120 |
| 1–16 | brightness 0–15 | −120 |
| 17 | brightness 15, menu enters stage 20 | −120 |
| 18–137 | brightness 15 | one pixel upward per update, ending at 0 |

Both scroll words wrap from `$FFFF` to zero together. Input is checked by the
original worker only after feeding is finished. Full original trace data is
in `reference-fax-animation-v0.2.53.json`.

## Browser behavior and checks

Results animate once. Information shows the settled fax without replaying it.
Existing accessible text, objective cards, career records and early Continue
are retained; reduced-motion preference shows the settled scene immediately.
Session reload does not reopen a dismissed result. The canvas preserves its
aspect ratio on mobile. Long dialogs reset their scroll position when opened.

Assets load lazily, with at most three decoded scenes cached. Each open view
reuses one ImageData buffer; its RAF stops when complete, hidden or closed.
A first-RAF timestamp preceding initialization initially caused a negative
frame error; that error was reproduced and fixed by treating it as frame zero.

* 547 Node tests pass, including the original memory/pixel/animation goldens,
  input validation and reusable output-buffer ownership.
* Actual powered-city steps trigger all three results. Browser backing pixels
  match the original settled frame, with visible feeding before completion,
  stable completed pixels, early cancellation, static Information, session
  reload, reduced motion and 390px touch layout without horizontal overflow.
* Existing six-scenario career/bonus/portability tests pass. Original ending
  music still emits verified finite PCM, starts once, cancels early, returns
  to city music and honors separate Music/SFX toggles.
* The required gameplay client reaches Practice City in February 1900.
  Original, desktop, feed, completed and mobile screenshots were inspected.
  Browser checks report no errors.

The capture helper uses its own portable Mesen copy and settings under private
`output/fax-reference-v53/mesen`. Lua file I/O is enabled only there, with
network access disabled; the existing emulator configuration, saves and ROM
are preserved. This follows Mesen's documented
[script restrictions](https://github.com/SourMesen/Mesen2/blob/master/UI/Config/Debugger/ScriptWindowConfig.cs)
and [portable configuration selection](https://github.com/SourMesen/Mesen2/blob/master/UI/Config/ConfigManager.cs).
Reproduce with `reference-fax-frames.mjs`, `check-fax-pixels.mjs`,
`reference-fax-animation.mjs` and `check-fax-view.mjs` under `tools/`, supplying
the preserved source ROM/Mesen paths through their documented environment variables.

## Remaining fidelity limits

The browser presents the verified state sequence at nominal 60 Hz after its
assets load. Original command-to-display startup/decompression latency and
absolute NTSC/global-loop phase are not matched by this adapter. The current
modern dialog keeps early Continue and continued city management, unlike the
original worker's input blocking and return to scenario selection.

The original fax-printer SFX command `$0B` is not yet reconstructed. Existing
victory/failure music is retained, with the previously documented DSP limits.
Natural multi-year original victories, wider original UI/global-loop/audio
parity and the remaining requested Turbo content/performance work are still
open. This release is not completion of the full-port goal.
