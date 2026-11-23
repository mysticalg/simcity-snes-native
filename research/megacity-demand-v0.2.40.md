# Large-city demand and evaluation: v0.2.40

The wide population counters exposed further limits in demand, native hospital
and school quotas, and annual problem ratings. A separate map-size bug made
megacity evaluation sample only the original-size portion of the larger planes.

## Source evidence retained

The following original-ROM runners were executed again against the preserved
USA ROM: 79 demand cases, 80 facility spawn/update cases and 84 city-score cases.
All returned exit code zero. Their existing reports are unchanged.

The new `reference-census-consumers.mjs` executes another **65 original CPU
cases**: 40 hospital/school quota cases at `038CE8..038D24`, 12 unemployment
cases at `03B6BD`, and 13 fire-problem cases at `03B6F7`. The report pins ROM and
runner hashes and records actual register/flag outputs, including wrap cases.
The quota tail is reached through a WRAM trampoline that preserves its caller's
PHD/PLD stack layout. This verifies those isolated routines, not natural timing.

`03894C..038A83` converts residential units to households by dividing by eight,
compares previous jobs/households, builds Q8 ratios, then produces scores out of
600. The difficulty factors remain 307, 282 and 251. `038CE8` shifts residential
units eight times and compares the quota with each facility count. `03B6BD`
compares job units times eight with residential units; `03B6F7` calculates the
bounded fire problem from fire count times five, including native word carry.

All original helpers remain unchanged. Ordinary-size, unlinked city demand,
native-size facility quotas and native-size problem arithmetic use them.

## Turbo arithmetic and map geometry

`turbo-demand.js` extends the same fixed-point equations with exact wider
integer intermediates for megacities. It removes word/product wrapping and
incidental carry while retaining floors, difficulty, score caps and the final
native tax/demand accumulation stage. Linked regional demand also uses this
path when remote RCI contributions are present, including normal-size cities.
Those combined inputs can exceed the native registers independently of map size.

Megacity facility quotas compare the full residential total divided by 256
with actual counts. Their wider unemployment/fire operands are capped at the
same problem-rating maximum. The source's zero-job unemployment branch is
retained. These changes are explicit Turbo extensions, not claimed cartridge
behavior. Native demand golden fixtures still exercise the source path.

Evaluation now passes the actual width and height to plane sampling. Every
second cell in both axes is sampled over the whole map, including its bottom
and right districts. Native-size sampling is unchanged. The existing January
budget, review, survey and approval flow receives these corrected inputs.

## Verification

**485 Node tests pass.** Additional checks cover all 79 native demand goldens
through the adapter and all 65 new CPU consumer outputs; continuous demand at
the census word boundary; large regional inputs; a real megacity simulation
step; and the native monthly hospital/school workers and quota update.

A complete 5,070-plot mixed map has RCI units `[67600,8450,5070]`. Against the
same history its wider generated scores are `[970,419,447]`. The real step from
zero demand at tax seven produces `[370,-181,-153]`, without wrapped inputs.
The existing regional provider contract is separately exercised with combined
inputs that produce the same result in a normal-size city. Physical regional
boundary matching remains covered by the existing exchange tests.

Replacing 400 commercial plots with 200 native hospitals and 200 native schools
leaves the residential quota at 264. The old wrapped quota was eight and asked
those facilities to retire. After the real monthly step, both new demand flags
are +1 and all 400 facilities remain present.

The browser loads both fixtures through the actual file input and executes the
canonical simulation. Controlled expanded pollution/traffic fields isolate the
bottom-right sample. The real evaluation dialog displays Pollution 200 and
Traffic 239; refresh and the downloaded save retain the evaluation, wide census
and facility flags. This is a geometry/input test, not a claim of original-ROM
natural field generation. No page/request errors occur. Gameplay-client and
evaluation images were inspected.

This release makes no new whole-game FPS claim and retains earlier rendering
caches. Further performance work, original scheduling/interface/SPC DSP parity,
and the remaining requested Turbo economy, security and transport content are
still incomplete.
