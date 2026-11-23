# Scenario calendar and review: v0.2.45

The original `CODE_03C500` is a staged worker. The browser previously tracked
reminders separately and could decide an outcome independently of those stages.
It also checked reminders before advancing the month/year, while the source
checks after the monthly/annual work. These paths now share the source stage.

## Source behavior

`03C500` runs only in scenario mode 3. `$0CCB` indexes thresholds five, four,
three, two, one and zero years. It advances at most one stage per invocation,
including a late date that has passed several thresholds. The first five stages
attempt notices `$14/$15/$16/$18/$19`; their stage is consumed even when
`$00D7` or `$0AB5` blocks the notice. The sixth stage performs the final check.

Every scenario requires Metropolis or larger. Bern additionally reads traffic
rating `$0C05 < 80`; Detroit reads mean crime `$0C01 < 60`; Tokyo, Boston and
Rio require score `$0DED >= 500`. San Francisco and Las Vegas have no additional
condition. The traffic value is the source's evaluated rating, already scaled
by `03B66A`, not the raw road maximum or unscaled mean. That existing consumer
is retained.

The city now reviews once at the existing end-of-base-step point, after the
date and automatic annual assessment. Manual budgets defer that review until
settlement. An automatic January no longer risks an extra review from both
the settlement callback and the normal step. Pending review state is saved.

`CODE_03B96F` event dispatch was also compared directly: terminal San Francisco,
Tokyo and Boston events; Rio's modulo-16 floods; Las Vegas's modulo-16 UFO
attempts at population 85,000 or above; and exact counter decrements. Initial
counts, absolute deadline years, thresholds and reminder codes are checked
against 25 actual ROM table words.

## Executed original comparison

`node tools/reference-scenario-lifecycle.mjs` executes both original workers
in the pinned USA ROM. **427 progress cases and 392 event cases pass**, with
**2,065 compared outputs**: stage, attempted notice, outcome, countdown and
selected handler. Cases cover all seven numeric IDs, due/before/late dates,
city-category boundaries, crime/traffic/score thresholds, mode gating, busy
notices, renderer-busy entry, zero/terminal/modulo counters and the 32-bit
Las Vegas population boundary. `reference-scenario-lifecycle.json` retains
all cases, tables and ROM/Mesen hashes.

Disaster handlers are intercepted at entry in this particular comparison;
it verifies dispatch/countdown, not their map effects. The real original
reminder child routine runs, while its entry records the attempted code.
Global notification routing and the original PPU presentation are separate.

**508 Node checks pass**. New integration checks cover actual January order,
one automatic review, pending-budget reload and settlement, late stages,
recording a decision once, preserving its inputs after decline, and older-save
migration. Existing outcome tests now explicitly start at final review stage 5.

## Playable objectives and saved review

City Information displays each scenario's deadline, current state and exact
requirements. Completion/failure dialogs display the same card with the inputs
recorded at the decision. Later population/score changes do not rewrite that
review. The decision, stage and one-time-dialog state persist in city/session
saves and regional serialization. Old saves infer stage from reminder history;
recorded results are retained. Older results without a decision snapshot do
not acquire fabricated historical values.

The browser verifier uses 150 real developed residential zones and five
original coal plants: population 120,000, real traced power, no artificial
power-mask fill. It checks all seven cards; a late Tokyo sequence that remains
active through five stages and decides on the sixth; actual city demolition
after a win; session reload without a duplicate dialog; Boston's pending
January budget saved/reloaded and settled through the real APPLY button;
Detroit's exact crime-60 failure using consistent land/density/crime fields;
downloaded failure-save reload; older stage migration; and mobile/touch cards.
The controls run against the actual application module, with automatic time
held only while installing controlled fixtures. Desktop, mobile, touch and
required gameplay-client screenshots were inspected. No browser errors remain.

The existing full-game rendering, all six city themes, photoreal art, parks,
graphs and recent performance caches are retained. This release adds bounded
stage/decision data and modal-only cards, and makes no new whole-game FPS claim.

## Remaining scope

The browser keeps completed cities playable, so stage 6 is explicitly terminal.
The original ending/bonus-unlock flow is not reconstructed by this worker.
The browser retains its user-requested advisor/dialog presentation rather than
claiming every original global message-busy flag or PPU screen is reproduced.
These are controlled worker and browser checks, not natural five/ten-year ROM
playthrough comparisons.

Practice City's separate `03C474` lesson calendar, remaining full-loop/UI
details, full SPC DSP/menu-event audio, requested Turbo economy/security/
transport/disaster content and further heavy-city performance work remain
incomplete. The full native port is still active.
