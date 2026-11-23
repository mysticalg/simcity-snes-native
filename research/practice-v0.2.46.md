# Original Practice lessons: v0.2.46

`CODE_03C474..03C4DB` is translated in `src/rom-practice.js`. It runs only
in mode 1, waits while Wright's pending flag `$0395` or message-busy `$00D7`
is set, and advances `$0CC7` at most once per invocation. Unlike scenario
reminders, a blocked Practice lesson does **not** consume its stage.

The actual ROM tables `03C4DC/03C4E8/03C4F4` contain:

| Due date | Wright message | Topic |
| --- | --- | --- |
| January 1900 | `$1B` | Power, zones and roads |
| June 1900 | `$2E` | Demand bars |
| November 1900 | `$32` | Budget |
| January 1901 | `$1C` | City controls |
| June 1901 | `$33` | Transport connections |
| January 1905 | `$26` or `$27` | Final population review |

The last stage checks the complete 32-bit population at `$0BA5/$0BA7`:
30,000 or more selects `$26` and records history ID 1 through `03C42A`;
otherwise it selects `$27` without a success entry. A later population drop
does not re-run this terminal stage. The original startup `038000` calls the
worker before its first demand pass; the loop calls it again at `0380CC`,
after calendar/annual work and milestone handling. New Practice cities now
run the startup lesson, then review at that existing browser step position.
Manual annual budgets block the review until simulation resumes.

Seven message blocks are read through the original `0FA800` pointer table:
`0FC251`, `0FD45A`, `0FD85F`, `0FC37F`, `0FD965`, `0FCD87`, `0FCE65`.
Their complete bytes and **24-column rows** are checked against the ROM.
The browser joins rows with spaces and renders the source apostrophe glyph
as an apostrophe. The original controls message contains spaces for SNES
button artwork; a separate browser-controls note explains the actual UI.

## Browser integration

The compact advisor announces a reached lesson and provides READ LESSON.
Information retains all reached lessons, the population target and the
recorded final review. There is no forced full-screen tutorial popup.
Reading, closing, or the user's existing three-second timeout acknowledges
the pending lesson. With advisor popups disabled, acknowledgement is
automatic and the lesson remains in Information. This adapts the source
pending flag to the user's requested non-blocking advisor presentation.

Stage, reached IDs, pending ID and review inputs persist in session,
downloaded city and region saves. Restoring a pending lesson re-announces
that same lesson; restoring an acknowledged lesson does not repeat it.
Older saves skip already elapsed dates without inventing a past outcome or
unrecorded text history. Saved stage/message/decision values are bounded.

## Verification

`node tools/reference-practice.mjs` executes **1,659 original worker cases**
in the pinned USA ROM: **6,652 outputs** for stage, message, pending flag,
and success-history date. Cases cover all stages, before/exact/late dates,
mode gating, both blocking flags, population 29,999/30,000/30,001 and
nonzero population high words. It also verifies 18 table words and all seven
message pointer/byte blocks. `reference-practice.json` retains the cases,
text checks, ROM/Mesen hashes and successful exit status.

**514 Node tests pass.** Integration assertions cover startup, source-style
blocking, an actual June calendar step, all lessons, one-time history,
manual-budget deferral, success/loss, pending reload and older/corrupt saves.
The existing general notice/facility-advice tests explicitly use Free City
so their unchanged assertions remain independent of Practice startup.

`node tools/check-practice.mjs` checks the actual rendered app with 38
developed residential zones, real roads and two coal plants: all are powered
and census population is 30,400. It verifies READ LESSON, close, actual June
step, timeout, warnings off, success, failure, historic review after real map
clear, downloaded save/re-import, session reload, mobile width and actual
touch selection from the welcome/new-city flow. No browser errors occur.
The required gameplay client also runs into February 1900 on Practice's
original island. Screenshots of gameplay, lessons, final review and touch
layout were inspected. `practice-verification-v0.2.46.json` stores the local
report and source hashes; live publication is verified separately.

## Remaining work

These controlled original-worker cases are not a natural five-year original
ROM playthrough. Global message arbitration, complete original PPU/Wright
animation and button artwork, scenario ending/unlock flows, full global
simulation scheduling and remaining SPC DSP/menu-event music still require
work. The original controls text is preserved, with browser controls explained
separately. No new render-performance/FPS claim is made by this release;
the verified recent batching/photo/bloom optimizations are retained.
Requested Turbo economy/security/transport/mega-disaster extensions and
further heavy-city optimization remain part of the active full-game goal.
