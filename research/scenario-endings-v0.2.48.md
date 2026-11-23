# Scenario records and ending messages: v0.2.48

The final-review worker already produces outcome `$0D87 = 1` (failed) or `2`
(cleared). This release translates the subsequent completion-record decision
in `CODE_03E2DF`, and restores its three original messages to the browser UI.

## Original routine and menu path

`03E2DF` requests music command `$12` for outcome 1 and `$11` otherwise. It
preserves the current scenario ID, then defaults to fax screen 9. A scenario
mode-3 victory ORs `DATA_03E334[index]` into the clear word at `$42`. The eight
table words are 1, 2, 4, 8, 16, 32, 64, 128; the seven browser challenge IDs
map to the first seven bits, independently of the browser menu's display order.

If the sign bit is not already set and the first six bits are now all set,
the routine sets `$8000` and selects screen 11. Other victories select screen
10; failures/non-scenario calls select screen 9. Other flag bits are retained.
It writes the clear word to SRAM `$700007`, runs `03E553` to sum the first 14
header bytes into `$70000E`, copies the 16-byte header to `$707FF0` through
`03E484`, then calls the fax renderer `03DF49` and restores the scenario ID.

The source scenario menu `03DDB6..03DE1A` normally limits columns to 0..2;
the sign bit permits column 3. Its two rows select IDs 6 and 7, **Las Vegas
and Free City**. `03DE64..03DEF7` draws clear marks from the individual bits.
The bonus message explicitly names two bonus scenarios. Practice and ordinary
free play do not grant challenge-clear bits in the browser.

## Original message data

The three extracted tilemaps are:

| Screen | Original asset | Message |
| --- | --- | --- |
| 9 | `TM_FailedScenarioText` / `0C8539` | YOU'RE FIRED! |
| 10 | `TM_CompleteScenarioText` / `0C82AD` | CONGRATULATIONS! |
| 11 | `TM_UnlockBonusScenariosText` / `0C83CE` | CONGRATULATIONS! / SCENARIO CLEARED! |

`scenario-ending-text.js` retains each decoded line and its tilemap row,
path and SHA-256. Text/headers use two original font ranges; punctuation was
checked visually by decoding the corresponding 2bpp tiles from the supplied
`GFX_Layer3_InformationAndBankLoanSubScreens` data. The original capitalization
and `masterd` spelling are retained. A separate browser hint explains that the
bonus cities are selected through NEW CITY, alongside the source's cursor text.

The browser shows these words above the existing objective/result card, and
retains them in Information. This is source text in the Turbo interface,
**not** a claim that the original fax-machine background, scrolling, HDMA,
glass color math, cord sprite or transmission animation has been recreated.

## Saved career and compatibility

Each city carries the clear word and its recorded ending. The browser merges
that word with a local career record, displays cleared badges and the six-city
bonus award, and preserves progress between cities, session reloads, regions
and downloaded saves. Importing a winning older save records its result without
reopening a dialog already acknowledged. Recorded fax decisions remain historic.
Combining disjoint winning city archives can finish the record; the verified
original decision then grants the bonus bit without rewriting an already-viewed
ordinary ending. Losing cities cannot erase progress or grant a clear bit.

Writes happen when the career word changes, not every rendered frame. Storage
errors leave progress in memory and city exports; the same failed write is not
retried each frame. Incoming browser storage events merge records. This is a
monotonic browser adaptation, not cross-tab transactional SRAM emulation.
Malformed words/ending metadata are bounded or ignored. A stored ending is
accepted only when recomputing the original decision reproduces all its fields.

Turbo keeps its already-published cities selectable and allows continued
management after final review. The native sign-bit award and badges are now
represented, but the cartridge's menu lock and forced exit are not imposed.
The browser save remains JSON rather than a native SRAM image. The source
music request is recorded; actual ending-track playback remains to be wired.

## Verification

`node tools/reference-scenario-endings.mjs` executes **2,048 original cases**
with **45,056 checked values**. It covers every six-bit combination, all eight
table indices, failure/victory, zero/other outcome words, mode gating, other
high bits, already-earned bonus and repeated clears. Each case checks the RAM
clear word, selected fax, music request, restored scenario ID, SRAM word,
checksum and all 16 mirrored header bytes. The original checksum/copy children
execute; only the fax renderer is intercepted at entry. The initial harness
needed DBR=3 for the actual bank-3 clear-bit table; that corrected harness passes.
Eight actual ROM table words and all three original tilemap text blocks match.
The report retains ROM/Mesen hashes, cases and successful exit status.

**525 Node checks pass**, including the original fixture goldens, six-city
progression, one-time bonus, Las Vegas, failure, save/reload, legacy winning
saves, disjoint archive consolidation, storage failure and corrupt metadata.

`node tools/check-scenario-endings.mjs` drives actual city steps with 150
developed residential zones, five real coal plants and 120,000 residents; all
zones are powered without synthetic power flags. All six wins show the expected
message and career bit. The seventh clear bit is covered in Node/original cases.
The browser checks ordinary/bonus/failure messages, correct menu badges,
continued availability, new-city/session persistence, download and import into
a fresh browser context, repeated victory without a second bonus message, and
real mobile touch selection. The 390px layout has no horizontal dialog overflow.
The required gameplay client enters Practice City and reaches February 1900;
its click coordinates were refreshed for the taller scenario menu. Screenshots
of gameplay, bonus and mobile records were inspected. No browser errors occur.

These are controlled victories and routine calls, not natural full-duration
scenario playthroughs or settled original PPU screen comparisons. Further
global simulation/interface/audio parity, fax presentation, heavy-city long
frames and requested Turbo economy/security/transport/mega-disaster content
remain in the active full-port goal. Existing photoreal assets and v0.2.47
rendering optimizations are retained; no new FPS claim is made by this release.
